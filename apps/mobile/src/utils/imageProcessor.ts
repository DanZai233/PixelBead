// Image processing utilities for pixelation, cropping, and background removal

import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { PaletteColor } from '../types/shared';

/**
 * Pixelate image to target dimensions using nearest-neighbor sampling
 */
export async function pixelateImage(
  imageUri: string,
  targetWidth: number,
  targetHeight: number
): Promise<Map<string, string>> {
  try {
    // Resize image to target dimensions
    await manipulateAsync(
      imageUri,
      [{ resize: { width: targetWidth, height: targetHeight } }],
      { compress: 1, format: SaveFormat.PNG }
    );

    // For now, return a simple implementation
    // In a full implementation, we would:
    // 1. Load image and extract pixel data
    // 2. For each pixel, find closest color in palette (if provided)
    // 3. Return Map with key "x,y" and value color hex
    return new Map();
  } catch (error) {
    console.error('Error pixelating image:', error);
    return new Map();
  }
}

/**
 * Crop image to specified region
 */
export async function cropImage(
  imageUri: string,
  cropRegion: { x: number; y: number; width: number; height: number }
): Promise<string> {
  try {
    const result = await manipulateAsync(
      imageUri,
      [
        {
          crop: {
            originX: cropRegion.x,
            originY: cropRegion.y,
            width: cropRegion.width,
            height: cropRegion.height,
          },
        },
      ],
      { compress: 1, format: SaveFormat.PNG }
    );

    return result.uri;
  } catch (error) {
    console.error('Error cropping image:', error);
    return imageUri;
  }
}

/**
 * Remove background from image based on corner pixel analysis
 */
export function removeBackground(
  grid: Map<string, string>
): Map<string, string> {
  // For now, return original grid
  // In a full implementation, we would:
  // 1. Analyze corner pixels to detect background color
  // 2. Use colorDistanceHSL to find similar colors within threshold
  // 3. Return new Map without background pixels
  return new Map(grid);
}

/**
 * Exclude specific colors from grid
 */
export function excludeColors(
  grid: Map<string, string>,
  excludeHexes: string[]
): Map<string, string> {
  const newGrid = new Map(grid);

  for (const [key, color] of newGrid.entries()) {
    if (excludeHexes.includes(color)) {
      newGrid.delete(key);
    }
  }

  return newGrid;
}
