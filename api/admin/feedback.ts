import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient, Db, ObjectId } from 'mongodb';
import { createHmac } from 'crypto';

let cachedDb: Db | null = null;
let cachedClient: MongoClient | null = null;

async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;
  const client = new MongoClient(process.env.MONGODB_URI!);
  cachedClient = client;
  await client.connect();
  cachedDb = client.db('pixelbead');
  return cachedDb;
}

if (typeof process !== 'undefined') {
  process.once('SIGTERM', async () => {
    if (cachedClient) await cachedClient.close().catch(() => {});
  });
}

function verifyToken(token: string): boolean {
  try {
    const secret = process.env.ADMIN_PASSWORD || '';
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return false;
    const payload = Buffer.from(payloadB64, 'base64').toString('utf-8');
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    if (sig !== expected) return false;
    const data = JSON.parse(payload);
    return Date.now() <= data.exp;
  } catch { return false; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ') || !verifyToken(auth.slice(7))) {
    return res.status(401).json({ error: '未登录或登录已过期' });
  }

  try {
    const db = await getDb();
    const col = db.collection('feedback');

    if (req.method === 'GET') {
      const { page = '1', limit = '20' } = req.query;
      const p = Math.max(1, parseInt(page as string, 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
      const [items, total] = await Promise.all([
        col.find().sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).toArray(),
        col.countDocuments(),
      ]);
      return res.status(200).json({
        feedbacks: items.map(f => ({
          id: f._id.toString(),
          suggestion: f.suggestion,
          contact: f.contact || '',
          source: f.source || '',
          createdAt: f.createdAt,
        })),
        total, page: p, limit: l,
      });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: '缺少 id' });
      await col.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Admin feedback API error:', error);
    return res.status(500).json({ error: error.message || '服务器内部错误' });
  }
}
