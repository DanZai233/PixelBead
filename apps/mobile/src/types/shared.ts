// Local copies of shared types and constants
// Avoids cross-package imports that break Metro bundling

export type ColorHex = string;

export enum PixelStyle {
  CIRCLE = 'CIRCLE',
  SQUARE = 'SQUARE',
  ROUNDED = 'ROUNDED',
}

export interface PaletteColor {
  hex: string;
  key: string;
  count?: number;
}

export enum AIProvider {
  OPENAI = 'OPENAI',
  OPENROUTER = 'OPENROUTER',
  DEEPSEEK = 'DEEPSEEK',
  VOLCENGINE = 'VOLCENGINE',
  GEMINI = 'GEMINI',
  CUSTOM = 'CUSTOM',
}

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
  endpoint?: string;
  imageUrlModel?: string;
}

export const AI_MODELS: Record<string, { id: string; name: string; isImageModel?: boolean }[]> = {
  [AIProvider.OPENAI]: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'dall-e-3', name: 'DALL-E 3', isImageModel: true },
  ],
  [AIProvider.OPENROUTER]: [
    { id: 'openai/gpt-4o', name: 'GPT-4o (via OpenRouter)' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
    { id: 'openai/dall-e-3', name: 'DALL-E 3 (via OpenRouter)', isImageModel: true },
  ],
  [AIProvider.DEEPSEEK]: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat' },
    { id: 'deepseek-coder', name: 'DeepSeek Coder' },
    { id: 'deepseek-aider', name: 'DeepSeek Aider' },
  ],
  [AIProvider.VOLCENGINE]: [
    { id: 'doubao-seedream-4-5-251128', name: 'Doubao Seedream 4K', isImageModel: true },
    { id: 'doubao-seedream-4-5-241024', name: 'Doubao Seedream 2K', isImageModel: true },
    { id: 'doubao-pro-32k', name: 'Doubao Pro 32K', isImageModel: false },
    { id: 'doubao-lite-32k', name: 'Doubao Lite 32K', isImageModel: false },
  ],
  [AIProvider.GEMINI]: [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', isImageModel: true },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', isImageModel: true },
  ],
  [AIProvider.CUSTOM]: [],
};

export const DEFAULT_ENDPOINTS: Record<string, string> = {
  [AIProvider.OPENAI]: 'https://api.openai.com/v1',
  [AIProvider.OPENROUTER]: 'https://openrouter.ai/api/v1',
  [AIProvider.DEEPSEEK]: 'https://api.deepseek.com/v1',
  [AIProvider.VOLCENGINE]: 'https://ark.cn-beijing.volces.com/api/v3',
  [AIProvider.GEMINI]: '',
  [AIProvider.CUSTOM]: '',
};

// Color utility functions (from color-system package)

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
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

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

export function getColorCounts(grid: Map<string, string>): PaletteColor[] {
  const counts: Record<string, number> = {};
  for (const color of grid.values()) {
    if (color && color !== '#FFFFFF') {
      counts[color] = (counts[color] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([hex, count]) => ({ hex, key: hex, count }))
    .sort((a, b) => b.count - a.count);
}

export function mergeSimilarColors(
  colors: PaletteColor[],
  threshold: number = 0.15
): PaletteColor[] {
  if (colors.length === 0) return [];
  const processed = new Set<number>();
  const result: PaletteColor[] = [];
  for (let i = 0; i < colors.length; i++) {
    if (processed.has(i)) continue;
    const current = colors[i];
    if (!current) continue;
    const group: PaletteColor[] = [current];
    processed.add(i);
    for (let j = i + 1; j < colors.length; j++) {
      if (processed.has(j)) continue;
      const other = colors[j];
      if (!other) continue;
      if (colorDistanceHSL(current.hex, other.hex) <= threshold) {
        group.push(other);
        processed.add(j);
      }
    }
    const totalCount = group.reduce((sum, c) => sum + (c.count || 0), 0);
    const dominant = group.sort((a, b) => (b.count || 0) - (a.count || 0))[0];
    if (dominant) {
      result.push({ hex: dominant.hex, key: dominant.key, count: totalCount });
    }
  }
  return result.sort((a, b) => (b.count || 0) - (a.count || 0));
}
