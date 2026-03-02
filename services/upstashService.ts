import { Redis } from '@upstash/redis';
import type { BeadGrid } from '../types';

// 使用环境变量或默认配置
const redis = new Redis({
  url: (import.meta as any).env.VITE_UPSTASH_REDIS_REST_URL || '',
  token: (import.meta as any).env.VITE_UPSTASH_REDIS_REST_TOKEN || '',
});

export interface ShareData {
  grid: string[][];
  gridSize: number;
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED';
  createdAt: number;
  expiresAt: number;
}

const EXPIRE_HOURS = 24 * 7; // 7天过期

export async function saveToUpstash(
  grid: string[][],
  gridSize: number,
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED'
): Promise<string | null> {
  try {
    // 生成唯一 key
    const key = `bead:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;

    const shareData: ShareData = {
      grid,
      gridSize,
      pixelStyle,
      createdAt: Date.now(),
      expiresAt: Date.now() + EXPIRE_HOURS * 60 * 60 * 1000,
    };

    // 保存到 Redis
    await redis.set(key, JSON.stringify(shareData), {
      ex: EXPIRE_HOURS * 60 * 60, // 秒
    });

    return key;
  } catch (error) {
    console.error('保存到 Upstash 失败:', error);
    return null;
  }
}

export async function loadFromUpstash(key: string): Promise<ShareData | null> {
  try {
    const data = await redis.get<ShareData>(key);

    if (!data) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > data.expiresAt) {
      await redis.del(key);
      return null;
    }

    return data;
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
