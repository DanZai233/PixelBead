import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { getDb } from '../lib/mongodb';

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
    const result = await db.collection('materials').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $inc: { likes: 1 } },
      { returnDocument: 'after' }
    );
    return res.status(200).json({ likes: result?.likes || 0 });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || '服务器内部错误' });
  }
}
