import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient, Db, ObjectId } from 'mongodb';
import { createHmac } from 'crypto';

let cachedDb: Db | null = null;
async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  cachedDb = client.db('pixelbead');
  return cachedDb;
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ') || !verifyToken(auth.slice(7))) {
    return res.status(401).json({ error: '未登录或登录已过期' });
  }

  try {
    const db = await getDb();
    const col = db.collection('materials');

    if (req.method === 'GET') {
      const { search, page = '1', limit = '20' } = req.query;
      const p = Math.max(1, parseInt(page as string, 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
      let filter = {};
      if (search && typeof search === 'string' && search.trim()) {
        const regex = { $regex: search.trim(), $options: 'i' };
        filter = { $or: [{ title: regex }, { description: regex }, { author: regex }, { tags: regex }] };
      }
      const [materials, total] = await Promise.all([
        col.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).toArray(),
        col.countDocuments(filter),
      ]);
      return res.status(200).json({
        materials: materials.map(m => ({
          id: m._id.toString(), title: m.title, description: m.description,
          author: m.author, tags: m.tags, gridWidth: m.gridWidth, gridHeight: m.gridHeight,
          pixelStyle: m.pixelStyle, createdAt: m.createdAt, views: m.views || 0, likes: m.likes || 0,
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

    if (req.method === 'PUT') {
      const { id, title, description, author, tags } = req.body || {};
      if (!id) return res.status(400).json({ error: '缺少 id' });
      const update: Record<string, any> = {};
      if (title !== undefined) update.title = title;
      if (description !== undefined) update.description = description;
      if (author !== undefined) update.author = author;
      if (tags !== undefined) update.tags = tags;
      if (!Object.keys(update).length) return res.status(400).json({ error: '没有要更新的字段' });
      await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: error.message || '服务器内部错误' });
  }
}
