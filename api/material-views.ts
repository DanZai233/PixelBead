import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient, Db, ObjectId } from 'mongodb';

let cachedDb: Db | null = null;
async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  cachedDb = client.db('pixelbead');
  return cachedDb;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: '缺少 id' });
    const db = await getDb();
    await db.collection('materials').updateOne({ _id: new ObjectId(id) }, { $inc: { views: 1 } });
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || '服务器内部错误' });
  }
}
