// General utility functions
// Minimal starting utilities - will grow with Phase 3+ features

import type { ColorHex } from '@pixelbead/shared-types';

// Validation utilities

export function isValidHexColor(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

export function normalizeHexColor(hex: string): ColorHex {
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }

  // Expand 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }

  return '#' + hex.toUpperCase();
}

// String utilities

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Array utilities

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function uniqueArray<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

// Number utilities

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

// Grid utilities

export function createEmptyGrid(width: number, height: number, defaultColor: ColorHex = '#FFFFFF'): ColorHex[][] {
  return Array(height).fill(null).map(() => Array(width).fill(defaultColor));
}

export function deepCloneGrid(grid: ColorHex[][]): ColorHex[][] {
  return grid.map(row => [...row]);
}
