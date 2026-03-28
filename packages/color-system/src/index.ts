// Color algorithm functions extracted from web app utils/colorUtils.ts and colorSystemUtils.ts
// DOM/browser-specific functions excluded (mobile incompatible)

import type { ColorHex, PaletteColor } from '@pixelbead/shared-types';

// Color conversion functions

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  return {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16),
  };
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

// RGB Euclidean distance algorithm
export function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return Infinity;

  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// HSL distance algorithm (used in mergeSimilarColors)
export function colorDistanceHSL(hex1: string, hex2: string): number {
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

// Find closest color in palette
export function findClosestColor(
  targetHex: string,
  palette: PaletteColor[]
): PaletteColor | null {
  if (!palette || palette.length === 0) {
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

// Merge similar colors
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
    if (!current) continue;

    const group: PaletteColor[] = [current];
    processed.add(i);

    for (let j = i + 1; j < merged.length; j++) {
      if (processed.has(j)) continue;

      const otherColor = merged[j];
      if (!otherColor) continue;

      const distance = colorDistanceHSL(current.hex, otherColor.hex);
      if (distance <= threshold) {
        group.push(otherColor);
        processed.add(j);
      }
    }

    const totalCount = group.reduce((sum, c) => sum + (c.count || 0), 0);
    const dominantColor = group.sort((a, b) => (b.count || 0) - (a.count || 0))[0];

    if (dominantColor) {
      result.push({
        hex: dominantColor.hex,
        key: dominantColor.key,
        count: totalCount,
      });
    }
  }

  return result.sort((a, b) => (b.count || 0) - (a.count || 0));
}

// Map canvas colors to specified palette
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

// Count color usage in grid
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

// Create palette from grid
export function createPaletteFromGrid(grid: string[][], maxColors?: number): PaletteColor[] {
  let colors = getColorCounts(grid);

  if (maxColors && colors.length > maxColors) {
    colors = colors.slice(0, maxColors);
  }

  return colors;
}

// Sort colors by hue
export function sortColorsByHue<T extends { color: string }>(colors: T[]): T[] {
  return colors.slice().sort((a, b) => {
    const rgbA = hexToRgb(a.color);
    const rgbB = hexToRgb(b.color);

    if (!rgbA || !rgbB) return 0;

    const hslA = rgbToHsl(rgbA.r, rgbA.g, rgbA.b);
    const hslB = rgbToHsl(rgbB.r, rgbB.g, rgbB.b);

    // Sort by hue first
    if (Math.abs(hslA.h - hslB.h) > 5) {
      return hslA.h - hslB.h;
    }

    // If hue is same, sort by lightness (light to dark)
    if (Math.abs(hslA.l - hslB.l) > 3) {
      return hslB.l - hslA.l;
    }

    // If lightness is also same, sort by saturation (high saturation first)
    return hslB.s - hslA.s;
  });
}

// Utility functions (from colorUtils.ts)

export const SYMBOLS = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕㉖㉗㉘㉙㉚㉛㉜㉝㉞㉟㊱㊲㊳㊴㊵㊶㊷㊸㊹㊺㊻㊼㊽㊾㊿ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ';

export function getSymbol(index: number): string {
  if (index < SYMBOLS.length) {
    const symbol = SYMBOLS[index];
    return symbol !== undefined ? symbol : String.fromCharCode(0x2460 + (index % 50));
  }
  return String.fromCharCode(0x2460 + (index % 50));
}

export function getUniqueColors(grid: ColorHex[][]): ColorHex[] {
  const colorSet = new Set<ColorHex>();
  grid.forEach(row => {
    row.forEach(color => {
      if (color && color !== '#FFFFFF') {
        colorSet.add(color);
      }
    });
  });
  return Array.from(colorSet);
}

export function getContrastColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return '#000000';

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
