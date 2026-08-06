import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient, Db } from 'mongodb';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { suggestion, contact, source } = req.body || {};
    if (!suggestion || typeof suggestion !== 'string' || !suggestion.trim()) {
      return res.status(400).json({ error: '请填写建议内容' });
    }
    if (suggestion.length > 2000) {
      return res.status(400).json({ error: '建议内容过长' });
    }

    const db = await getDb();
    const col = db.collection('feedback');

    await col.insertOne({
      suggestion: suggestion.trim(),
      contact: typeof contact === 'string' ? contact.trim().slice(0, 200) : '',
      source: typeof source === 'string' ? source.slice(0, 50) : '',
      createdAt: Date.now(),
    });

    return res.status(201).json({ success: true });
  } catch (error: any) {
    console.error('Feedback API error:', error);
    return res.status(500).json({ error: error.message || '服务器内部错误' });
  }
}
