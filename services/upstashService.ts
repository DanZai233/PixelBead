import { Redis } from '@upstash/redis';
import type { BeadGrid } from '../types';

// 使用环境变量或默认配置
const redis = new Redis({
  url: (import.meta as any).env.VITE_UPSTASH_REDIS_REST_URL || '',
  token: (import.meta as any).env.VITE_UPSTASH_REDIS_REST_TOKEN || '',
});

export interface ShareData {
  grid: string[][];
  gridSize?: number;
  gridWidth?: number;
  gridHeight?: number;
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED';
  createdAt: number;
  expiresAt: number;
}

interface CompressedShareData {
  v: 2;
  palette: string[];
  rle: number[];
  gridWidth: number;
  gridHeight: number;
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED';
  createdAt: number;
  expiresAt: number;
}

function compressGrid(grid: string[][]): { palette: string[]; rle: number[] } {
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

function decompressGrid(palette: string[], rle: number[], width: number, height: number): string[][] {
  const flat: string[] = [];
  for (let i = 0; i < rle.length; i += 2) {
    const color = palette[rle[i]];
    const count = rle[i + 1];
    for (let j = 0; j < count; j++) flat.push(color);
  }

  const grid: string[][] = [];
  for (let r = 0; r < height; r++) {
    grid.push(flat.slice(r * width, (r + 1) * width));
  }
  return grid;
}

const EXPIRE_HOURS = 24 * 7;
const MAX_COMPRESSED_SIZE = 1024 * 1024;

export async function saveToUpstash(
  grid: string[][],
  gridWidth: number,
  gridHeight: number,
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED'
): Promise<string | null> {
  try {
    const key = `bead:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    const now = Date.now();

    const { palette, rle } = compressGrid(grid);

    const compressed: CompressedShareData = {
      v: 2,
      palette,
      rle,
      gridWidth,
      gridHeight,
      pixelStyle,
      createdAt: now,
      expiresAt: now + EXPIRE_HOURS * 60 * 60 * 1000,
    };

    const dataStr = JSON.stringify(compressed);
    const dataSize = new Blob([dataStr]).size;

    if (dataSize > MAX_COMPRESSED_SIZE) {
      console.error(`压缩后仍超过 1MB 限制 (${(dataSize / 1024).toFixed(0)}KB)`);
      return null;
    }

    await redis.set(key, dataStr, {
      ex: EXPIRE_HOURS * 60 * 60,
    });

    return key;
  } catch (error) {
    console.error('保存到 Upstash 失败:', error);
    return null;
  }
}

export async function loadFromUpstash(key: string): Promise<ShareData | null> {
  try {
    const raw = await redis.get<any>(key);
    if (!raw) return null;

    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (data.v === 2) {
      const grid = decompressGrid(data.palette, data.rle, data.gridWidth, data.gridHeight);
      const shareData: ShareData = {
        grid,
        gridWidth: data.gridWidth,
        gridHeight: data.gridHeight,
        pixelStyle: data.pixelStyle,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
      };
      if (Date.now() > shareData.expiresAt) {
        await redis.del(key);
        return null;
      }
      return shareData;
    }

    if (Date.now() > data.expiresAt) {
      await redis.del(key);
      return null;
    }
    return data as ShareData;
  } catch (error) {
    console.error('从 Upstash 加载失败:', error);
    return null;
  }
}

export function generateShareUrl(key: string, baseUrl?: string): string {
  const url = baseUrl || window.location.origin + window.location.pathname;
  return `${url}#share=${encodeURIComponent(key)}`;
}

export function getShareKeyFromUrl(): string | null {
  const hash = window.location.hash;
  const match = hash.match(/share=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// 素材广场相关接口

export interface MaterialData {
  id: string;
  key: string;
  title: string;
  description: string;
  author: string;
  tags: string[];
  gridSize?: number;
  gridWidth?: number;
  gridHeight?: number;
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED';
  grid: string[][];
  createdAt: number;
  views: number;
  likes: number;
}

const MATERIAL_LIST_KEY = 'materials:list';

export async function saveMaterialToUpstash(
  grid: string[][],
  gridWidth: number,
  gridHeight: number,
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED',
  title: string,
  description: string,
  author: string,
  tags: string[]
): Promise<string | null> {
  try {
    const key = `material:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;

    const material: MaterialData = {
      id: key,
      key,
      title,
      description,
      author,
      tags,
      gridWidth,
      gridHeight,
      pixelStyle,
      grid,
      createdAt: Date.now(),
      views: 0,
      likes: 0,
    };

    const dataStr = JSON.stringify(material);
    const dataSize = new Blob([dataStr]).size;
    
    if (dataSize > 1024 * 1024) {
      console.error('数据过大，超过 1MB 限制');
      return null;
    }
    
    await redis.set(key, dataStr); // 不设置过期时间，永久保存

    // 添加到素材列表
    await redis.lpush(MATERIAL_LIST_KEY, key);
    // Redis 的 ltrim 命令会保留指定范围内的元素
    // 这里我们不需要手动调用 ltrim，因为我们可以定期清理

    return key;
  } catch (error) {
    console.error('保存素材到 Upstash 失败:', error);
    return null;
  }
}

export async function getMaterialFromUpstash(key: string): Promise<MaterialData | null> {
  try {
    const data = await redis.get<MaterialData>(key);
    
    if (!data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('从 Upstash 加载素材失败:', error);
    return null;
  }
}

export async function getMaterialList(): Promise<MaterialData[]> {
  try {
    const keys = await redis.lrange(MATERIAL_LIST_KEY, 0, 99) as string[];
    
    if (!keys || keys.length === 0) {
      return [];
    }
    
    const materials: MaterialData[] = [];
    
    for (const key of keys) {
      const data = await redis.get<MaterialData>(key);
      if (data) {
        materials.push(data);
      }
    }
    
    return materials.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('获取素材列表失败:', error);
    return [];
  }
}

export async function searchMaterials(query: string): Promise<MaterialData[]> {
  try {
    const materials = await getMaterialList();
    
    if (!query.trim()) {
      return materials;
    }

    const lowerQuery = query.toLowerCase();
    
    return materials.filter(material => {
      const titleMatch = material.title.toLowerCase().includes(lowerQuery);
      const descMatch = material.description.toLowerCase().includes(lowerQuery);
      const authorMatch = material.author.toLowerCase().includes(lowerQuery);
      const tagMatch = material.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      
      return titleMatch || descMatch || authorMatch || tagMatch;
    });
  } catch (error) {
    console.error('搜索素材失败:', error);
    return [];
  }
}

export async function incrementMaterialViews(key: string): Promise<void> {
  try {
    const data = await redis.get<MaterialData>(key);
    if (data) {
      data.views += 1;
      await redis.set(key, JSON.stringify(data), {
        ex: 30 * 24 * 60 * 60,
      });
    }
  } catch (error) {
    console.error('增加浏览数失败:', error);
  }
}

export async function incrementMaterialLikes(key: string): Promise<number | null> {
  try {
    const data = await redis.get<MaterialData>(key);
    if (data) {
      data.likes += 1;
      await redis.set(key, JSON.stringify(data), {
        ex: 30 * 24 * 60 * 60,
      });
      return data.likes;
    }
    return null;
  } catch (error) {
    console.error('增加点赞数失败:', error);
    return null;
  }
}
