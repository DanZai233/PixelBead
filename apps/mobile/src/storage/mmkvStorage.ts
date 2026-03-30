// In-memory storage adapter for Expo Go compatibility
// Replaces MMKV (native module) with a simple Map-based store
// Data persists within a session but not across app restarts in Expo Go

const store = new Map<string, string>();

export const STORAGE_KEYS = {
  canvasCurrent: 'canvas:current',
  canvasUndo: 'canvas:history:undo',
  canvasRedo: 'canvas:history:redo',
  userPreferences: 'user:preferences',
} as const;

export function setJSON<T>(key: string, value: T): void {
  store.set(key, JSON.stringify(value));
}

export function getJSON<T>(key: string): T | null {
  const json = store.get(key);
  return json ? JSON.parse(json) : null;
}

export const mmkvStorage = {
  getItem: (name: string): string | null => {
    return store.get(name) ?? null;
  },
  setItem: (name: string, value: string): void => {
    store.set(name, value);
  },
  removeItem: (name: string): void => {
    store.delete(name);
  },
};

export { store as storage };
