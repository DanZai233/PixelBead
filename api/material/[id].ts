import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import client from '../_lib/mongodb';

const DB_NAME = 'pixelbead';
const COLLECTION = 'materials';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: '缺少 id 参数' });
    }

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    const m = await collection.findOne({ _id: new ObjectId(id) });
    if (!m) {
      return res.status(404).json({ error: '素材不存在' });
    }

    return res.status(200).json({
      id: m._id.toString(),
      key: m._id.toString(),
      title: m.title,
      description: m.description,
      author: m.author,
      tags: m.tags,
      gridWidth: m.gridWidth,
      gridHeight: m.gridHeight,
      gridSize: m.gridSize,
      pixelStyle: m.pixelStyle,
      grid: m.grid,
      createdAt: m.createdAt,
      views: m.views || 0,
      likes: m.likes || 0,
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
}
