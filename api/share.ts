import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

/**
 * 以下类型与压缩逻辑须与 lib/shareCodec.ts 保持一致（此处单文件内联，避免 Vercel ESM 子路径解析问题）。
 */
interface ShareData {
  grid: string[][];
  gridSize?: number;
  gridWidth?: number;
  gridHeight?: number;
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED';
  createdAt: number;
  expiresAt: number;
}

interface CompressedSharePayload {
  v: 2;
  palette: string[];
  rle: number[];
  gridWidth: number;
  gridHeight: number;
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED';
  createdAt: number;
  expiresAt: number;
}

const SHARE_EXPIRE_HOURS = 24 * 7;
const SHARE_MAX_JSON_BYTES = 1024 * 1024;

function compressShareGrid(grid: string[][]): { palette: string[]; rle: number[] } {
  const colorToIdx = new Map<string, number>();
  const palette: string[] = [];

  const flat: number[] = [];
  for (const row of grid) {
    for (const color of row) {
      let idx = colorToIdx.get(color);
      if (idx === undefined) {
        idx = palette.length;
        palette.push(color);
        colorToIdx.set(color, idx);
      }
      flat.push(idx);
    }
  }

  const rle: number[] = [];
  let i = 0;
  while (i < flat.length) {
    const val = flat[i];
    let count = 1;
    while (i + count < flat.length && flat[i + count] === val) count++;
    rle.push(val, count);
    i += count;
  }

  return { palette, rle };
}

function decompressShareGrid(palette: string[], rle: number[], width: number, height: number): string[][] {
  const flat: string[] = [];
  for (let j = 0; j < rle.length; j += 2) {
    const color = palette[rle[j]];
    const count = rle[j + 1];
    for (let k = 0; k < count; k++) flat.push(color);
  }

  const out: string[][] = [];
  for (let r = 0; r < height; r++) {
    out.push(flat.slice(r * width, (r + 1) * width));
  }
  return out;
}

const PIXEL_STYLES = new Set(['CIRCLE', 'SQUARE', 'ROUNDED']);
const MAX_GRID_SIDE = 200;

function getServerRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.VITE_UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.VITE_UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function isValidGrid(grid: unknown, w: number, h: number): grid is string[][] {
  if (!Array.isArray(grid) || grid.length !== h) return false;
  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== w) return false;
    for (const c of row) {
      if (typeof c !== 'string' || c.length < 1 || c.length > 32) return false;
    }
  }
  return true;
}

function rawToShareData(raw: unknown, key: string, redis: Redis): Promise<ShareData | null> {
  let data: unknown;
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return Promise.resolve(null);
  }
  if (!data || typeof data !== 'object') return Promise.resolve(null);

  if ((data as CompressedSharePayload).v === 2) {
    const d = data as CompressedSharePayload;
    const grid = decompressShareGrid(d.palette, d.rle, d.gridWidth, d.gridHeight);
    const shareData: ShareData = {
      grid,
      gridWidth: d.gridWidth,
      gridHeight: d.gridHeight,
      pixelStyle: d.pixelStyle,
      createdAt: d.createdAt,
      expiresAt: d.expiresAt,
    };
    if (Date.now() > shareData.expiresAt) {
      return redis.del(key).then(() => null);
    }
    return Promise.resolve(shareData);
  }

  const legacy = data as ShareData;
  if (typeof legacy.expiresAt !== 'number' || !legacy.grid) return Promise.resolve(null);
  if (Date.now() > legacy.expiresAt) {
    return redis.del(key).then(() => null);
  }
  return Promise.resolve(legacy);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const redis = getServerRedis();
  if (!redis) {
    return res.status(503).json({ error: 'Redis 未配置，请在 Vercel 设置 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN' });
  }

  try {
    if (req.method === 'GET') {
      const key = req.query.key;
      if (!key || typeof key !== 'string' || !key.startsWith('bead:')) {
        return res.status(400).json({ error: '无效的 key' });
      }
      const raw = await redis.get(key);
      if (!raw) return res.status(404).json({ error: '未找到' });

      const shareData = await rawToShareData(raw, key, redis);
      if (!shareData) return res.status(410).json({ error: '已过期' });
      return res.status(200).json(shareData);
    }

    if (req.method === 'POST') {
      const { grid, gridWidth, gridHeight, pixelStyle } = req.body || {};
      if (
        typeof gridWidth !== 'number' ||
        typeof gridHeight !== 'number' ||
        typeof pixelStyle !== 'string' ||
        !PIXEL_STYLES.has(pixelStyle)
      ) {
        return res.status(400).json({ error: '参数无效' });
      }
      const w = Math.floor(gridWidth);
      const h = Math.floor(gridHeight);
      if (w < 1 || h < 1 || w > MAX_GRID_SIDE || h > MAX_GRID_SIDE) {
        return res.status(400).json({ error: '画布尺寸超出限制' });
      }
      if (!isValidGrid(grid, w, h)) {
        return res.status(400).json({ error: 'grid 格式无效' });
      }

      const key = `bead:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
      const now = Date.now();
      const { palette, rle } = compressShareGrid(grid as string[][]);
      const compressed: CompressedSharePayload = {
        v: 2,
        palette,
        rle,
        gridWidth: w,
        gridHeight: h,
        pixelStyle: pixelStyle as ShareData['pixelStyle'],
        createdAt: now,
        expiresAt: now + SHARE_EXPIRE_HOURS * 60 * 60 * 1000,
      };
      const dataStr = JSON.stringify(compressed);
      const byteLen = Buffer.byteLength(dataStr, 'utf8');
      if (byteLen > SHARE_MAX_JSON_BYTES) {
        return res.status(413).json({ error: '数据过大' });
      }

      await redis.set(key, dataStr, { ex: SHARE_EXPIRE_HOURS * 60 * 60 });
      return res.status(201).json({ key });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    console.error('api/share error:', error);
    return res.status(500).json({ error: '服务器错误' });
  }
}
