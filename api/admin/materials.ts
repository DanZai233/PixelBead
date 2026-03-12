import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { getDb } from '../_lib/mongodb';
import { withAuth } from '../_lib/auth';

export default withAuth(async (req: VercelRequest, res: VercelResponse) => {
  try {
    const db = await getDb();
    const collection = db.collection('materials');

    if (req.method === 'GET') {
      const { search, page = '1', limit = '20' } = req.query;
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      let filter = {};
      if (search && typeof search === 'string' && search.trim()) {
        const regex = { $regex: search.trim(), $options: 'i' };
        filter = { $or: [{ title: regex }, { description: regex }, { author: regex }, { tags: regex }] };
      }

      const [materials, total] = await Promise.all([
        collection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).toArray(),
        collection.countDocuments(filter),
      ]);

      const result = materials.map((m) => ({
        id: m._id.toString(), title: m.title, description: m.description,
        author: m.author, tags: m.tags, gridWidth: m.gridWidth, gridHeight: m.gridHeight,
        pixelStyle: m.pixelStyle, createdAt: m.createdAt, views: m.views || 0, likes: m.likes || 0,
      }));

      return res.status(200).json({ materials: result, total, page: pageNum, limit: limitNum });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: '缺少 id' });
      await collection.deleteOne({ _id: new ObjectId(id) });
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

      if (Object.keys(update).length === 0) return res.status(400).json({ error: '没有要更新的字段' });

      await collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});
