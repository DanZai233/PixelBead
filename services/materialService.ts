import {
  type MaterialData,
  saveMaterialToUpstash,
  getMaterialList as redisGetMaterialList,
  searchMaterials as redisSearchMaterials,
  incrementMaterialViews as redisIncrementViews,
  incrementMaterialLikes as redisIncrementLikes,
} from './upstashService';

const API_BASE = '/api';

export type { MaterialData };

async function tryApi(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const resp = await fetch(url, init);
    const ct = resp.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    if (!resp.ok) return null;
    return resp;
  } catch {
    return null;
  }
}

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
  const resp = await tryApi(`${API_BASE}/materials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grid, gridWidth, gridHeight, pixelStyle, title, description, author, tags }),
  });

  if (resp) {
    const data = await resp.json();
    return data.id;
  }

  return saveMaterialToUpstash(grid, gridWidth, gridHeight, pixelStyle, title, description, author, tags);
}

export async function getMaterialList(search?: string): Promise<MaterialData[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const resp = await tryApi(`${API_BASE}/materials${params}`);

  if (resp) {
    return resp.json();
  }

  return search ? redisSearchMaterials(search) : redisGetMaterialList();
}

export async function searchMaterials(query: string): Promise<MaterialData[]> {
  return getMaterialList(query);
}

export async function incrementMaterialViews(id: string): Promise<void> {
  const resp = await tryApi(`${API_BASE}/material-views`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  if (!resp) {
    await redisIncrementViews(id);
  }
}

export async function incrementMaterialLikes(id: string): Promise<number | null> {
  const resp = await tryApi(`${API_BASE}/material-likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  if (resp) {
    const data = await resp.json();
    return data.likes;
  }

  return redisIncrementLikes(id);
}
