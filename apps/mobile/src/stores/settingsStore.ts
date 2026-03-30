// Settings state management with MMKV persistence
// Use selector-based subscriptions: useSettingsStore(state => state.theme)
// Avoid subscribing to entire store: useSettingsStore() ❌

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkvStorage';
import type { PixelStyle } from '../types/shared';
type ColorSystem = 'MARD' | 'COCO' | '漫漫' | '盼盼' | '咪小窝';

interface SettingsState {
  // Theme
  theme: 'light' | 'dark';
  autoTheme: boolean;

  // Canvas preferences
  pixelStyle: PixelStyle;
  showGrid: boolean;
  showRulers: boolean;
  showColorCodes: boolean;

  // Color system preferences
  colorSystem: ColorSystem;
  mergeThreshold: number; // 0-50% (per COLR-07)
  maxColors: number; // Palette preset (48, 96, 144, 168)

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setAutoTheme: (auto: boolean) => void;
  setPixelStyle: (style: PixelStyle) => void;
  setShowGrid: (show: boolean) => void;
  setShowRulers: (show: boolean) => void;
  setShowColorCodes: (show: boolean) => void;
  setColorSystem: (system: ColorSystem) => void;
  setMergeThreshold: (threshold: number) => void;
  setMaxColors: (max: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state
      theme: 'light',
      autoTheme: false,
      pixelStyle: 'CIRCLE' as PixelStyle,
      showGrid: true,
      showRulers: false,
      showColorCodes: false,
      colorSystem: 'MARD',
      mergeThreshold: 15,
      maxColors: 96,

      // Actions
      setTheme: (theme) => set({ theme }),
      setAutoTheme: (auto) => set({ autoTheme: auto }),
      setPixelStyle: (style) => set({ pixelStyle: style }),
      setShowGrid: (show) => set({ showGrid: show }),
      setShowRulers: (show) => set({ showRulers: show }),
      setShowColorCodes: (show) => set({ showColorCodes: show }),
      setColorSystem: (system) => set({ colorSystem: system }),
      setMergeThreshold: (threshold) => set({ mergeThreshold: threshold }),
      setMaxColors: (max) => set({ maxColors: max }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
