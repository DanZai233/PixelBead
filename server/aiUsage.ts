import type { Db, Document } from 'mongodb';

export function usageFilter(query: Record<string, unknown>) {
  const filter: Record<string, any> = {};
  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 200) : '';
  if (search) filter.$or = [
    { prompt: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
    { 'request.ip': search },
  ];
  if (query.ip !== undefined) {
    if (typeof query.ip !== 'string' || !query.ip.trim() || query.ip.length > 100) throw new Error('无效的 IP');
    filter['request.ip'] = query.ip.trim();
  }
  if (typeof query.status === 'string' && ['pending', 'success', 'failed', 'archive_failed'].includes(query.status)) filter.status = query.status;
  if (query.status === 'timeout') filter.status = 'pending';
  if (query.mode === 'text' || query.mode === 'image') filter.mode = query.mode;
  for (const [key, operator] of [['start', '$gte'], ['end', '$lt']]) {
    if (query[key] === undefined || query[key] === '') continue;
    const date = query[key];
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('日期格式不正确');
    const timestamp = Date.parse(`${date}T00:00:00+08:00`);
    if (!Number.isFinite(timestamp) || new Date(timestamp + 8 * 3600000).toISOString().slice(0, 10) !== date) throw new Error('无效的日期');
    filter.createdAt = { ...filter.createdAt, [operator]: timestamp + (key === 'end' ? 86400000 : 0) };
  }
  if (filter.createdAt?.$gte >= filter.createdAt?.$lt) throw new Error('开始日期不能晚于结束日期');
  if (query.status === 'timeout') filter.createdAt = { ...filter.createdAt, $lt: Math.min(filter.createdAt?.$lt ?? Infinity, Date.now() - 180000) };
  return filter;
}

export function usagePipeline(filter: Document, page: number, now = Date.now()): Document[] {
  const countIf = (condition: unknown) => ({ $sum: { $cond: [condition, 1, 0] } });
  const success = { $in: ['$status', ['success', 'archive_failed']] };
  const timeout = { $and: [{ $eq: ['$status', 'pending'] }, { $lt: ['$createdAt', now - 180000] }] };
  const counts = {
    requests: { $sum: 1 }, generated: countIf(success),
    failed: countIf({ $eq: ['$status', 'failed'] }),
    archiveFailed: countIf({ $eq: ['$status', 'archive_failed'] }),
    timeout: countIf(timeout),
    pending: countIf({ $and: [{ $eq: ['$status', 'pending'] }, { $gte: ['$createdAt', now - 180000] }] }),
    text: countIf({ $eq: ['$mode', 'text'] }), image: countIf({ $eq: ['$mode', 'image'] }),
    avgDurationMs: { $avg: { $cond: [{ $and: [success, { $isNumber: '$durationMs' }] }, '$durationMs', null] } },
  };
  const knownIp = { 'request.ip': { $nin: [null, '', 'unknown'] } };
  const breakdown = (field: string) => [
    { $group: { _id: { $ifNull: [field, '未知'] }, requests: { $sum: 1 } } },
    { $sort: { requests: -1, _id: 1 } }, { $limit: 10 },
  ];
  const device = { $switch: {
    branches: [
      ['iPhone|iPad|iPod', 'iOS'], ['Android', 'Android'], ['Windows', 'Windows'], ['Macintosh', 'macOS'], ['Linux', 'Linux'],
    ].map(([regex, then]) => ({ case: { $regexMatch: { input: { $ifNull: ['$request.userAgent', ''] }, regex, options: 'i' } }, then })),
    default: '其他 / 未知',
  } };
  return [
    { $match: filter },
    { $set: { _device: device } },
    { $facet: {
      summary: [{ $group: { _id: null, ...counts } }],
      uniqueIps: [{ $match: knownIp }, { $group: { _id: '$request.ip' } }, { $count: 'total' }],
      daily: [
        { $group: { _id: { $dateToString: { date: { $toDate: '$createdAt' }, format: '%Y-%m-%d', timezone: 'Asia/Shanghai' } }, ...counts } },
        { $sort: { _id: -1 } }, { $limit: 366 }, { $sort: { _id: 1 } },
      ],
      users: [
        { $match: knownIp }, { $sort: { createdAt: -1, _id: -1 } },
        { $group: { _id: '$request.ip', ...counts, firstSeen: { $min: '$createdAt' }, lastSeen: { $max: '$createdAt' }, request: { $first: '$request' } } },
        { $sort: { requests: -1, _id: 1 } }, { $skip: (page - 1) * 20 }, { $limit: 20 },
      ],
      devices: breakdown('$_device'), countries: breakdown('$request.country'), models: breakdown('$model'),
      errors: [{ $match: { status: { $in: ['failed', 'archive_failed'] } } }, ...breakdown('$error')],
    } },
  ];
}

export async function getUsageStats(db: Db, filter: Document, page: number) {
  const [result] = await db.collection('ai_generations').aggregate(usagePipeline(filter, page), { maxTimeMS: 15000 }).toArray();
  return {
    summary: { requests: 0, generated: 0, failed: 0, archiveFailed: 0, timeout: 0, pending: 0, text: 0, image: 0, avgDurationMs: null, ...result?.summary?.[0], uniqueIps: result?.uniqueIps?.[0]?.total || 0 },
    daily: result?.daily || [], users: result?.users || [], devices: result?.devices || [],
    countries: result?.countries || [], models: result?.models || [], errors: result?.errors || [],
    page, limit: 20, timezone: 'Asia/Shanghai',
  };
}
