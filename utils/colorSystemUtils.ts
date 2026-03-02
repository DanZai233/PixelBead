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

// RGB 颜色转换
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

// RGB 转 HSL
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

// RGB 转 CIELAB Delta E 2000（对拼豆颜色更准确）
export function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
  let rr = r / 255;
  let gg = g / 255;
  let bb = b / 255;

  rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
  gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
  bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;

  rr *= 100;
  gg *= 100;
  bb *= 100;

  let x = rr * 0.4124 + gg * 0.3576 + bb * 0.1804;
  let y = rr * 0.2126 + gg * 0.7152 + bb * 0.0722;
  let z = rr * 0.0193 + gg * 0.1192 + bb * 0.9505;

  return {
    l: 116.2479 + Math.sqrt(x) - 16.2479,
    a: 500 - (500 * Math.sqrt(y) - 16.2479) / (z),
    b: 200 - (200 * Math.sqrt(y) - 16.2479) / (x),
  };
}

// RGB 欧几里得距离算法（对拼豆颜色更准确）
export function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return Infinity;

  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;

  return Math.sqrt(dr * dr * 2 + dg * dg * db);
}

// 寻找最近的颜色
export function findClosestColor(
  targetHex: string,
  palette: PaletteColor[]
): PaletteColor | null {
  if (!palette || palette.length === 0) {
    console.warn('findClosestColor: palette is empty');
    return null;
  }

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

// 合并相似颜色
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

// 将画布颜色映射到指定色板
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

// 统计颜色使用量
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

// 从画布创建色板
export function createPaletteFromGrid(grid: string[][], maxColors?: number): PaletteColor[] {
  let colors = getColorCounts(grid);

  if (maxColors && colors.length > maxColors) {
    colors = colors.slice(0, maxColors);
  }

  return colors;
}

// 从映射数据创建完整色板
export function createFullPaletteFromMapping(
  mapping: ColorMapping,
  colorSystem?: ColorSystem,
  maxColors?: number
): PaletteColor[] {
  const allColors = Object.entries(mapping).map(([hex, colorData]) => ({
    hex,
    key: colorSystem ? colorData[colorSystem] : hex,
  }));

  if (maxColors && allColors.length > maxColors) {
    return allColors.slice(0, maxColors);
  }

  return allColors;
}

// 按色相排序颜色
export function sortColorsByHue<T extends { color: string }>(colors: T[]): T[] {
  return colors.slice().sort((a, b) => {
    const rgbA = hexToRgb(a.color);
    const rgbB = hexToRgb(b.color);

    if (!rgbA || !rgbB) return 0;

    const hslA = rgbToHsl(rgbA.r, rgbA.g, rgbA.b);
    const hslB = rgbToHsl(rgbB.r, rgbB.g, rgbB.b);

    // 首先按色相排序
    if (Math.abs(hslA.h - hslB.h) > 5) {
      return hslA.h - hslB.h;
    }

    // 色相相同，按明度排序（从浅到深）
    if (Math.abs(hslA.l - hslB.l) > 3) {
      return hslB.l - hslA.l;
    }

    // 明度也相同，按饱和度排序（高饱和度优先）
    return hslB.s - hslA.s;
  });
}
