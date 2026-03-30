// Clipboard store for copy/paste operations
// Stores selection data for clipboard operations

import { create } from 'zustand';

interface ClipboardState {
  // Clipboard data: paste buffer with normalized coordinates
  clipboard: Map<string, string> | null;
  // Original offset for paste positioning
  clipboardOffset: { x: number; y: number } | null;

  // Actions
  copySelection: (
    region: { x1: number; y1: number; x2: number; y2: number },
    grid: Map<string, string>
  ) => void;
  clearClipboard: () => void;
}

export const useClipboardStore = create<ClipboardState>((set) => ({
  clipboard: null,
  clipboardOffset: null,

  copySelection: (region, grid) => {
    // Extract pixels from grid within region bounds
    const clipboardData = new Map<string, string>();
    let minX = Infinity;
    let minY = Infinity;

    for (let x = region.x1; x <= region.x2; x++) {
      for (let y = region.y1; y <= region.y2; y++) {
        const key = `${x},${y}`;
        const color = grid.get(key);
        if (color) {
          clipboardData.set(key, color);
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
        }
      }
    }

    // Normalize coordinates (start at 0,0)
    const normalizedClipboard = new Map<string, string>();
    for (const [key, color] of clipboardData.entries()) {
      const [x, y] = key.split(',').map(Number);
      const normalizedX = x - minX;
      const normalizedY = y - minY;
      normalizedClipboard.set(`${normalizedX},${normalizedY}`, color);
    }

    set({
      clipboard: normalizedClipboard,
      clipboardOffset: { x: minX, y: minY },
    });
  },

  clearClipboard: () => {
    set({
      clipboard: null,
      clipboardOffset: null,
    });
  },
}));
