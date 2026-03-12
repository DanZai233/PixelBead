import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import client from './_lib/mongodb';

const DB_NAME = 'pixelbead';
const COLLECTION = 'materials';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: '缺少 id' });
    }

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $inc: { likes: 1 } },
      { returnDocument: 'after' }
    );

    const likes = result?.likes || 0;
    return res.status(200).json({ likes });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
}
