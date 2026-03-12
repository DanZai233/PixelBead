import type { VercelRequest, VercelResponse } from '@vercel/node';
import client from './_lib/mongodb';

const DB_NAME = 'pixelbead';
const COLLECTION = 'materials';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    if (req.method === 'GET') {
      const { search } = req.query;
      let filter = {};

      if (search && typeof search === 'string' && search.trim()) {
        const regex = { $regex: search.trim(), $options: 'i' };
        filter = {
          $or: [
            { title: regex },
            { description: regex },
            { author: regex },
            { tags: regex },
          ],
        };
      }

      const materials = await collection
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray();

      const result = materials.map((m) => ({
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
      }));

      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const {
        title,
        description,
        author,
        tags,
        gridWidth,
        gridHeight,
        pixelStyle,
        grid,
      } = req.body;

      if (!title || !author || !grid) {
        return res.status(400).json({ error: '缺少必填字段' });
      }

      const doc = {
        title,
        description: description || '',
        author,
        tags: tags || [],
        gridWidth,
        gridHeight,
        pixelStyle,
        grid,
        createdAt: Date.now(),
        views: 0,
        likes: 0,
      };

      const result = await collection.insertOne(doc);
      return res.status(201).json({ id: result.insertedId.toString() });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
}
