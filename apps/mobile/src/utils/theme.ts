// Theme utilities with dynamic font sizes
// Provides font scaling based on system accessibility settings

import { PixelRatio } from 'react-native';

/**
 * Scale font size based on system font scale
 * @param baseSize - Base font size in pixels
 * @returns Scaled font size (clamped to 0.8x - 1.5x range)
 */
export function scaleFontSize(baseSize: number): number {
  const fontScale = PixelRatio.getFontScale();

  // Clamp scale to reasonable range (0.8x to 1.5x)
  const clampedScale = Math.max(0.8, Math.min(1.5, fontScale));

  return baseSize * clampedScale;
}

/**
 * Responsive font sizes for the app
 * All values are scaled based on system accessibility settings
 */
export const fontSizes = {
  xs: scaleFontSize(10),
  sm: scaleFontSize(12),
  base: scaleFontSize(14),
  md: scaleFontSize(16),
  lg: scaleFontSize(18),
  xl: scaleFontSize(20),
  xxl: scaleFontSize(24),
  xxxl: scaleFontSize(32),
} as const;

/**
 * Type for font sizes
 */
export type FontSizes = typeof fontSizes;
