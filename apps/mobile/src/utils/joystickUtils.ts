export interface JoystickDirection {
  x: number; // -1 to 1 (left to right)
  y: number; // -1 to 1 (up to down)
}

/**
 * Calculate normalized joystick direction from touch delta
 */
export function calculateJoystickDirection(dx: number, dy: number): JoystickDirection {
  const magnitude = Math.sqrt(dx * dx + dy * dy);

  if (magnitude === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: dx / magnitude, // -1 to 1
    y: dy / magnitude, // -1 to 1
  };
}

/**
 * Calculate joystick magnitude (0 to 1) based on distance from center
 */
export function calculateJoystickMagnitude(dx: number, dy: number, maxRadius: number): number {
  const distance = Math.sqrt(dx * dx + dy * dy);
  return Math.min(distance / maxRadius, 1);
}

/**
 * Clamp joystick value to maximum magnitude
 */
export function clampJoystickValue(value: number, max: number = 1): number {
  return Math.max(-max, Math.min(max, value));
}

/**
 * Calculate luminance of hex color (0 to 1)
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const a = [rgb.r, rgb.g, rgb.b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Convert hex color to RGB object
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate contrast ratio between two hex colors
 * Returns ratio from 1:1 to 21:1
 */
export function getContrastRatio(foreground: string, background: string): number {
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard (4.5:1 for normal text)
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AA standard for large text (3:1)
 */
export function meetsWCAGAALarge(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 3.0;
}
