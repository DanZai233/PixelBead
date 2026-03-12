import type { MaterialData } from './upstashService';

const API_BASE = '/api';

export type { MaterialData };

export async function saveMaterial(
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
    const resp = await fetch(`${API_BASE}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grid,
        gridWidth,
        gridHeight,
        pixelStyle,
        title,
        description,
        author,
        tags,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error('保存素材失败:', err);
      return null;
    }

    const data = await resp.json();
    return data.id;
  } catch (error) {
    console.error('保存素材失败:', error);
    return null;
  }
}

export async function getMaterialList(search?: string): Promise<MaterialData[]> {
  try {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const resp = await fetch(`${API_BASE}/materials${params}`);

    if (!resp.ok) {
      console.error('获取素材列表失败:', resp.status);
      return [];
    }

    return await resp.json();
  } catch (error) {
    console.error('获取素材列表失败:', error);
    return [];
  }
}

export async function searchMaterials(query: string): Promise<MaterialData[]> {
  return getMaterialList(query);
}

export async function incrementMaterialViews(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/material-views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  } catch (error) {
    console.error('增加浏览数失败:', error);
  }
}

export async function incrementMaterialLikes(id: string): Promise<number | null> {
  try {
    const resp = await fetch(`${API_BASE}/material-likes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    return data.likes;
  } catch (error) {
    console.error('增加点赞数失败:', error);
    return null;
  }
}
