// @ts-ignore - Workaround for path resolution
import type { ColorHex } from '../../../packages/shared-types/src';

interface Material {
  id: string;
  title: string;
  description: string;
  author: string;
  tags: string[];
  gridWidth: number;
  gridHeight: number;
  gridSize: number;
  pixelStyle: string;
  grid: ColorHex[][];
  createdAt: number;
  views: number;
  likes: number;
}

const API_BASE_URL = 'https://pindou.danzaii.cn';

export async function fetchMaterials(search?: string): Promise<Material[]> {
  try {
    const url = `${API_BASE_URL}/api/materials?search=${encodeURIComponent(search || '')}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (!response.ok && response.status === 0 || response.type === 'error') {
        throw new Error('Network error');
      }
      throw new Error(`Failed to fetch materials: ${response.status}`);
    }

    const data = await response.json();
    return data as Material[];
  } catch (error) {
    console.error('Error fetching materials:', error);
    throw error;
  }
}

export async function publishMaterial(data: {
  title: string;
  author: string;
  description: string;
  tags: string[];
  gridWidth: number;
  gridHeight: number;
  pixelStyle: string;
  grid: ColorHex[][];
}): Promise<{ id: string }> {
  try {
    const url = `${API_BASE_URL}/api/materials`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (!response.ok && response.status === 0 || response.type === 'error') {
        throw new Error('Network error');
      }
      throw new Error(`Failed to publish material: ${response.status}`);
    }

    const result = await response.json();
    return { id: result.id };
  } catch (error) {
    console.error('Error publishing material:', error);
    throw error;
  }
}

export type { Material };
