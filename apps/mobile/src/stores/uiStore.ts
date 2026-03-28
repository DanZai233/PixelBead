// UI state management (transient state without persistence)
// Use selector-based subscriptions: useUIStore(state => state.isSettingsOpen)
// Avoid subscribing to entire store: useUIStore() ❌

import { create } from 'zustand';

interface UIState {
  // Modals
  isSettingsOpen: boolean;
  isColorPickerOpen: boolean;
  isExportDialogOpen: boolean;

  // Panels
  activePanel: 'tools' | 'colors' | 'layers' | null;

  // Navigation
  currentScreen: 'home' | 'editor' | 'settings';

  // Actions
  setSettingsOpen: (open: boolean) => void;
  setColorPickerOpen: (open: boolean) => void;
  setExportDialogOpen: (open: boolean) => void;
  setActivePanel: (panel: 'tools' | 'colors' | 'layers' | null) => void;
  setCurrentScreen: (screen: 'home' | 'editor' | 'settings') => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  isSettingsOpen: false,
  isColorPickerOpen: false,
  isExportDialogOpen: false,
  activePanel: 'tools',
  currentScreen: 'home',

  // Actions
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setColorPickerOpen: (open) => set({ isColorPickerOpen: open }),
  setExportDialogOpen: (open) => set({ isExportDialogOpen: open }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setCurrentScreen: (screen) => set({ currentScreen: screen }),
}));
