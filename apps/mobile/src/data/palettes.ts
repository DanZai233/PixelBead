// Predefined Perler bead color palettes with multi-brand support
// Data copied from colorSystemMapping.json (291 color entries)
// Brands: MARD, COCO, 漫漫, 盼盼, 咪小窝

import type { ColorSystem, PaletteColor } from '../../../../packages/shared-types/src';

// Load color system mapping from JSON
// @ts-ignore
export const ColorSystemMapping: Record<string, Record<string, string>> = require('../../../../colorSystemMapping.json');

// Create palette from color system for a specific brand with max color limit
export function createPaletteFromSystem(
  brand: ColorSystem,
  maxColors: 48 | 96 | 144 | 168 = 168
): PaletteColor[] {
  const colors: PaletteColor[] = [];

  // Extract colors for the specified brand
  for (const [hex, brands] of Object.entries(ColorSystemMapping)) {
    const brandCode = brands[brand];
    if (brandCode) {
      colors.push({
        hex: hex.toUpperCase(),
        key: brandCode,
      });
    }
  }

  // Sort by color code (e.g., A01, A02, B01, B02...)
  colors.sort((a, b) => a.key.localeCompare(b.key));

  // Limit to maxColors
  return colors.slice(0, maxColors);
}

// Group colors by letter prefix (A, B, C, ...)
export function groupColorsByLetter(colors: PaletteColor[]): Map<string, PaletteColor[]> {
  const groups = new Map<string, PaletteColor[]>();

  for (const color of colors) {
    // Extract letter from key (e.g., "A01" -> "A", "B12" -> "B")
    const letter = color.key.charAt(0).toUpperCase();

    if (!groups.has(letter)) {
      groups.set(letter, []);
    }

    groups.get(letter)!.push(color);
  }

  return groups;
}

// Export DEFAULT_COLORS from shared-types for convenience
export const DEFAULT_COLORS = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF'];
