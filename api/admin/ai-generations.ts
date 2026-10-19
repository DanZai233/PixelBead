import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { pipeline } from 'node:stream/promises';
import { getAiDb, imageBucket, verifyAdmin } from '../../server/aiRecords.js';
import { getUsageStats, usageFilter } from '../../server/aiUsage.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!verifyAdmin(req)) return res.status(401).json({ error: '未登录或登录已过期' });
  if (req.method !== 'GET' && req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const db = await getAiDb();
    const col = db.collection('ai_generations');
    const id = req.query.id;
    if (id !== undefined) {
      if (typeof id !== 'string' || !/^[a-f0-9]{24}$/i.test(id)) return res.status(400).json({ error: '无效的记录 ID' });
      const record = await col.findOne({ _id: new ObjectId(id) });
      if (!record) return res.status(404).json({ error: '记录不存在' });
      if (req.method === 'DELETE') {
        if (record.status === 'pending' && Date.now() - record.createdAt < 180000) {
          return res.status(409).json({ error: '生成中的记录暂不能删除' });
        }
        for (const fileId of [record.imageId, record.referenceImageId]) {
          if (fileId && await db.collection('ai_images.files').findOne({ _id: fileId })) {
            await imageBucket(db).delete(fileId);
          }
        }
        await col.deleteOne({ _id: record._id });
        return res.status(200).json({ success: true });
      }
      const fileId = req.query.image === 'reference' ? record.referenceImageId
        : req.query.image === 'generated' ? record.imageId : undefined;
      if (!fileId) return res.status(404).json({ error: '图片不存在' });
      const file = await db.collection('ai_images.files').findOne({ _id: fileId });
      if (!file) return res.status(404).json({ error: '图片不存在' });
      res.setHeader('Content-Type', file.metadata?.contentType || 'image/png');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      await pipeline(imageBucket(db).openDownloadStream(fileId), res);
      return;
    }
    if (req.method === 'DELETE') return res.status(400).json({ error: '缺少记录 ID' });
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 15));
    let filter;
    try { filter = usageFilter(req.query); }
    catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : '筛选条件无效' }); }
    if (req.query.view === 'stats') return res.status(200).json(await getUsageStats(db, filter, page));
    const [records, total] = await Promise.all([
      col.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);
    return res.status(200).json({
      records: records.map(({ _id, imageId, referenceImageId, ...record }) => ({
        ...record, id: _id.toHexString(), hasImage: !!imageId, hasReferenceImage: !!referenceImageId,
      })),
      total, page, limit,
    });
  } catch {
    console.error('Admin AI records request failed');
    if (!res.headersSent) return res.status(500).json({ error: '读取或删除生成记录失败，请稍后重试' });
    res.end();
  }
}
