// @ts-ignore - Workaround for path resolution
import type { ColorHex } from '../../../packages/shared-types/src';
// @ts-ignore - Workaround for path resolution
import { PixelStyle } from '../../../packages/shared-types/src';

interface ShareData {
  name: string;
  grid: ColorHex[][];
  gridWidth: number;
  gridHeight: number;
  pixelStyle: string;
  createdAt: number;
}

const REDIS_URL = 'https://pixelbead.upstash.io';
const SCHEME = 'pixelbead';

// NOTE: Redis token needs to be configured
// For now, we'll use a placeholder that should be replaced with actual token
// via environment variables or Constants.expoConfig.extra.redisToken
const REDIS_TOKEN = 'TODO: Configure actual Upstash Redis token';

function generateShareId(): string {
  return Math.random().toString(36).substr(2, 16);
}

export async function generateShareLink(projectData: {
  name: string;
  grid: ColorHex[][];
  gridWidth: number;
  gridHeight: number;
  pixelStyle: PixelStyle;
}): Promise<string> {
  try {
    const pixelStyle = projectData.pixelStyle.toString();
    const shareData: ShareData = {
      name: projectData.name,
      grid: projectData.grid,
      gridWidth: projectData.gridWidth,
      gridHeight: projectData.gridHeight,
      pixelStyle,
      createdAt: Date.now(),
    };

    const shareId = generateShareId();
    const key = `share:${shareId}`;

    const response = await fetch(`${REDIS_URL}/set/${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${REDIS_TOKEN}`,
      },
      body: JSON.stringify(shareData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate share link');
    }

    return `${SCHEME}://share/${shareId}`;
  } catch (error) {
    console.error('Share link generation error:', error);
    throw error;
  }
}

export async function loadSharedProject(shareId: string): Promise<ShareData> {
  try {
    const key = `share:${shareId}`;

    const response = await fetch(`${REDIS_URL}/get/${key}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${REDIS_TOKEN}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Share link expired or not found');
      }
      throw new Error('Failed to load shared project');
    }

    const data = await response.json();

    if (!data || !data.result) {
      throw new Error('Share link expired or not found');
    }

    const shareData = data.result;

    // Convert pixelStyle string back to PixelStyle enum
    // @ts-ignore - Workaround for enum conversion
    const pixelStyleValue = PixelStyle[shareData.pixelStyle?.toUpperCase() as keyof typeof PixelStyle];

    return {
      ...shareData,
      pixelStyle: pixelStyleValue || PixelStyle.CIRCLE,
    };
  } catch (error) {
    console.error('Load shared project error:', error);
    throw error;
  }
}

export type { ShareData };
