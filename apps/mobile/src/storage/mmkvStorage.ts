// MMKV storage initialization and helper functions
// Simple key-value schema with JSON serialization for complex data

import { createMMKV } from 'react-native-mmkv';

// Initialize MMKV instance (uses New Architecture automatically if enabled in app.json)
const storage = createMMKV();

// Simple key-value schema (per D-09)
export const STORAGE_KEYS = {
  canvasCurrent: 'canvas:current',
  canvasUndo: 'canvas:history:undo',
  canvasRedo: 'canvas:history:redo',
  userPreferences: 'user:preferences',
} as const;

// Helper functions for JSON serialization (per D-09)
export function setJSON<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

export function getJSON<T>(key: string): T | null {
  const json = storage.getString(key);
  return json ? JSON.parse(json) : null;
}

// Custom MMKV storage adapter for Zustand (per D-05: Use MMKV persistence middleware for Zustand stores)
export const mmkvStorage = {
  getItem: (name: string): string | null => {
    return storage.getString(name) ?? null;
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.remove(name);
  },
};

// Export storage instance for direct use if needed
export { storage };
