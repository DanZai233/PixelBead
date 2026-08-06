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

function downscaleGrid(grid: string[][], maxSize = 32): string[][] {
  const h = grid.length;
  const w = grid[0]?.length || 0;
  if (h <= maxSize && w <= maxSize) return grid;
  const stepX = Math.ceil(w / maxSize);
  const stepY = Math.ceil(h / maxSize);
  const result: string[][] = [];
  for (let y = 0; y < h; y += stepY) {
    const row: string[] = [];
    for (let x = 0; x < w; x += stepX) {
      row.push(grid[y]?.[x] ?? '#FFFFFF');
    }
    result.push(row);
    if (result.length >= maxSize) break;
  }
  return result;
}

function mapListItem(m: any) {
  let thumbnailGrid = m.thumbnailGrid || null;
  // Backfill: generate thumbnailGrid for old documents that don't have one
  if (!thumbnailGrid && m.grid) {
    thumbnailGrid = downscaleGrid(m.grid);
    // fire-and-forget: persist the generated thumbnail for next request
    const db = cachedDb;
    if (db) {
      db.collection('materials').updateOne(
        { _id: m._id },
        { $set: { thumbnailGrid } }
      ).catch(() => {});
    }
  }
  return {
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
    createdAt: m.createdAt,
    views: m.views || 0,
    likes: m.likes || 0,
    thumbnailGrid,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const db = await getDb();
    const col = db.collection('materials');

    if (req.method === 'GET') {
      const { search, page: pageStr, limit: limitStr } = req.query;
      const page = Math.max(1, parseInt(pageStr as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(limitStr as string, 10) || 30));

      let filter: any = {};
      if (search && typeof search === 'string' && search.trim()) {
        const regex = { $regex: search.trim(), $options: 'i' };
        filter = { $or: [{ title: regex }, { description: regex }, { author: regex }, { tags: regex }] };
      }

      // Fetch full documents (need grid for backfill), but strip grid before responding
      const [items, total] = await Promise.all([
        col.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray(),
        col.countDocuments(filter),
      ]);

      const materials = items.map(mapListItem);

      return res.status(200).json({
        materials,
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      });
    }

    if (req.method === 'POST') {
      const { title, description, author, tags, gridWidth, gridHeight, pixelStyle, grid } = req.body;
      if (!title || !author || !grid) return res.status(400).json({ error: '缺少必填字段' });
      const thumbnailGrid = downscaleGrid(grid);
      const result = await col.insertOne({
        title, description: description || '', author, tags: tags || [],
        gridWidth, gridHeight, pixelStyle, grid, thumbnailGrid,
        createdAt: Date.now(), views: 0, likes: 0,
      });
      return res.status(201).json({ id: result.insertedId.toString() });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || '服务器内部错误' });
  }
}
