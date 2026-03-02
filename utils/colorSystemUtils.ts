export type ColorSystem = 'MARD' | 'COCO' | '漫漫' | '盼盼' | '咪小窝';

export const colorSystemOptions = [
  { key: 'MARD', name: 'MARD' },
  { key: 'COCO', name: 'COCO' },
  { key: '漫漫', name: '漫漫' },
  { key: '盼盼', name: '盼盼' },
  { key: '咪小窝', name: '咪小窝' },
];

export interface PaletteColor {
  hex: string;
  key: string;
  count?: number;
}

export interface ColorMapping {
  [hex: string]: Record<ColorSystem, string>;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  if (!rgb1 || !rgb2) return Infinity;

  const hsl1 = rgbToHsl(rgb1.r, rgb1.g, rgb1.b);
  const hsl2 = rgbToHsl(rgb2.r, rgb2.g, rgb2.b);

  const dh = Math.min(Math.abs(hsl1.h - hsl2.h), 360 - Math.abs(hsl1.h - hsl2.h)) / 180;
  const ds = Math.abs(hsl1.s - hsl2.s) / 100;
  const dl = Math.abs(hsl1.l - hsl2.l) / 100;

  return dh * 2 + ds * 1 + dl * 3;
}

export function findClosestColor(
  targetHex: string,
  palette: PaletteColor[]
): PaletteColor | null {
  if (!palette || palette.length === 0) return null;

  let minDistance = Infinity;
  let closestColor: PaletteColor | null = null;

  for (const color of palette) {
    const distance = colorDistance(targetHex, color.hex);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }

  return closestColor;
}

export function mergeSimilarColors(
  colors: PaletteColor[],
  threshold: number = 0.15
): PaletteColor[] {
  if (colors.length === 0) return [];

  const merged: PaletteColor[] = [...colors];
  const processed = new Set<number>();
  const result: PaletteColor[] = [];

  for (let i = 0; i < merged.length; i++) {
    if (processed.has(i)) continue;

    const current = merged[i];
    const group: PaletteColor[] = [current];
    processed.add(i);

    for (let j = i + 1; j < merged.length; j++) {
      if (processed.has(j)) continue;

      const distance = colorDistance(current.hex, merged[j].hex);
      if (distance <= threshold) {
        group.push(merged[j]);
        processed.add(j);
      }
    }

    const totalCount = group.reduce((sum, c) => sum + (c.count || 0), 0);
    const dominantColor = group.sort((a, b) => (b.count || 0) - (a.count || 0))[0];

    result.push({
      ...dominantColor,
      count: totalCount,
    });
  }

  return result.sort((a, b) => (b.count || 0) - (a.count || 0));
}

export function mapColorsToPalette(
  grid: string[][],
  targetPalette: PaletteColor[]
): string[][] {
  return grid.map(row =>
    row.map(color => {
      if (color === '#FFFFFF' || !color) return color;
      const closest = findClosestColor(color, targetPalette);
      return closest ? closest.hex : color;
    })
  );
}

export function sortColorsByHue<T extends { color: string }>(colors: T[]): T[] {
  return colors.slice().sort((a, b) => {
    const rgbA = hexToRgb(a.color);
    const rgbB = hexToRgb(b.color);
    
    if (!rgbA || !rgbB) return 0;
    
    const hslA = rgbToHsl(rgbA.r, rgbA.g, rgbA.b);
    const hslB = rgbToHsl(rgbB.r, rgbB.g, rgbB.b);
    
    if (Math.abs(hslA.h - hslB.h) > 5) {
      return hslA.h - hslB.h;
    }
    
    if (Math.abs(hslA.l - hslB.l) > 3) {
      return hslB.l - hslA.l;
    }
    
    return hslB.s - hslA.s;
  });
}

export function getColorCounts(grid: string[][]): PaletteColor[] {
  const counts: Record<string, number> = {};
  
  grid.forEach(row => {
    row.forEach(color => {
      if (color && color !== '#FFFFFF') {
        counts[color] = (counts[color] || 0) + 1;
      }
    });
  });

  return Object.entries(counts).map(([hex, count]) => ({
    hex,
    key: hex,
    count,
  })).sort((a, b) => b.count - a.count);
}

export function createPaletteFromGrid(grid: string[][], maxColors?: number): PaletteColor[] {
  let colors = getColorCounts(grid);
  
  if (maxColors && colors.length > maxColors) {
    colors = colors.slice(0, maxColors);
  }
  
  return colors;
}
