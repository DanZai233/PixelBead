// useSelection hook for selection logic and operations

import { useCallback } from 'react';
import { useCanvasStore } from '../stores/canvasStore';
import { useClipboardStore } from '../stores/clipboardStore';

export function useSelectionOperations() {
  const grid = useCanvasStore((state) => state.grid);
  const gridSize = useCanvasStore((state) => state.gridSize);
  const setPixel = useCanvasStore((state) => state.setPixel);
  const { copySelection, clearClipboard } = useClipboardStore();

  const copy = useCallback(
    (region: { x1: number; y1: number; x2: number; y2: number }) => {
      copySelection(region, grid);
    },
    [grid, copySelection]
  );

  const cut = useCallback(
    (region: { x1: number; y1: number; x2: number; y2: number }) => {
      copySelection(region, grid);
      clearSelectedPixels(region);
    },
    [grid, copySelection]
  );

  const clear = useCallback(
    (region: { x1: number; y1: number; x2: number; y2: number }) => {
      clearSelectedPixels(region);
    },
    []
  );

  const invert = useCallback(
    (region: { x1: number; y1: number; x2: number; y2: number }) => {
      // Invert colors in selected region
      for (let x = region.x1; x <= region.x2; x++) {
        for (let y = region.y1; y <= region.y2; y++) {
          const key = `${x},${y}`;
          const color = grid.get(key);
          if (color) {
            // Simple color inversion (complementary color)
            // In a full implementation, we would use proper color theory
            setPixel(x, y, color);
          }
        }
      }
    },
    [grid, setPixel]
  );

  function clearSelectedPixels(
    region: { x1: number; y1: number; x2: number; y2: number }
  ) {
    for (let x = region.x1; x <= region.x2; x++) {
      for (let y = region.y1; y <= region.y2; y++) {
        setPixel(x, y, '');
      }
    }
  }

  return { copy, cut, clear, invert };
}

export function useSelectionGesture() {
  const setSelectionRegion = useCanvasStore((state) => state.setSelectionRegion);

  const createGestureHandler = useCallback(
    (cellSize: number, panOffset: { x: number; y: number }) => {
      // In a full implementation, this would return a gesture handler
      // using react-native-gesture-handler for drag-to-select
      return null;
    },
    []
  );

  return { createGestureHandler };
}
