import {
  type MaterialData,
  saveMaterialToUpstash,
  getMaterialList as redisGetMaterialList,
  searchMaterials as redisSearchMaterials,
  incrementMaterialViews as redisIncrementViews,
  incrementMaterialLikes as redisIncrementLikes,
} from './upstashService';

const API_BASE = ((import.meta as any).env.VITE_API_BASE_URL || '') + '/api';

export type { MaterialData };

export interface MaterialListResult {
  materials: MaterialData[];
  total: number;
  pages: number;
}

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

export async function getMaterialList(page = 1, limit = 30, search?: string): Promise<MaterialListResult> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set('search', search);
  const resp = await tryApi(`${API_BASE}/materials?${params}`);

  if (resp) {
    const data = await resp.json();
    // Handle both old (array) and new (paginated object) response formats
    if (Array.isArray(data)) {
      return { materials: data, total: data.length, pages: 1 };
    }
    return { materials: data.materials || [], total: data.total || 0, pages: data.pages || 1 };
  }

  // Fallback to Redis (old format)
  const redisResults = search ? await redisSearchMaterials(search) : await redisGetMaterialList();
  return { materials: redisResults, total: redisResults.length, pages: 1 };
}

export async function getMaterialDetail(id: string): Promise<MaterialData | null> {
  const resp = await tryApi(`${API_BASE}/material/${encodeURIComponent(id)}`);
  if (resp) {
    return resp.json();
  }
  return null;
}

export async function searchMaterials(query: string): Promise<MaterialData[]> {
  const result = await getMaterialList(1, 100, query);
  return result.materials;
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
