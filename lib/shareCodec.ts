/**
 * 分享数据压缩/解压（浏览器端）。
 * 服务端：逻辑内联在 api/share.ts（须与这里保持一致）。
 */

export interface ShareData {
  grid: string[][];
  gridSize?: number;
  gridWidth?: number;
  gridHeight?: number;
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED';
  createdAt: number;
  expiresAt: number;
}

export interface CompressedSharePayload {
  v: 2;
  palette: string[];
  rle: number[];
  gridWidth: number;
  gridHeight: number;
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED';
  createdAt: number;
  expiresAt: number;
}

export const SHARE_EXPIRE_HOURS = 24 * 7;
export const SHARE_MAX_JSON_BYTES = 1024 * 1024;

export function compressShareGrid(grid: string[][]): { palette: string[]; rle: number[] } {
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

export function decompressShareGrid(palette: string[], rle: number[], width: number, height: number): string[][] {
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

export function jsonByteLength(s: string): number {
  if (typeof Blob !== 'undefined') {
    return new Blob([s]).size;
  }
  return new TextEncoder().encode(s).length;
}
