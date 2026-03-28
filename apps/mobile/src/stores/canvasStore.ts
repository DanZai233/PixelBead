// Canvas state management with MMKV persistence
// Use selector-based subscriptions: useCanvasStore(state => state.selectedColor)
// Avoid subscribing to entire store: useCanvasStore() ❌

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkvStorage';
// @ts-ignore - Workaround for path resolution
import type { ColorHex } from '@pixelbead/shared-types';
// @ts-ignore - Workaround for path resolution
import { PixelStyle } from '@pixelbead/shared-types';

export type ToolType = 'brush' | 'eraser' | 'fill' | 'picker' | 'line' | 'rectangle' | 'circle';

interface CanvasState {
  // Grid state - use Map for O(1) lookups (Phase 2 change from 2D array)
  // Key: "x,y", Value: color hex
  grid: Map<string, string>;
  gridSize: { width: number; height: number };

  // Tool selection
  currentTool: ToolType;
  brushSize: number;
  selectedColor: ColorHex;

  // Canvas navigation (Phase 2)
  zoom: number;
  panOffset: { x: number; y: number };
  showGridLines: boolean;

  // Pixel style (Phase 4)
  pixelStyle: PixelStyle;

  // Image import (Phase 4)
  importedImage: string | null;
  cropRegion: { x: number; y: number; width: number; height: number } | null;

  // Selection (Phase 4)
  selectionRegion: { x1: number; y1: number; x2: number; y2: number } | null;

  // Drawing state
  isDrawing: boolean;

  // History (undo/redo)
  undoStack: string[]; // JSON-serialized grids
  redoStack: string[];

  // Actions
  setPixel: (x: number, y: number, color: string) => void;
  setGridSize: (width: number, height: number) => void;
  setSelectedTool: (tool: ToolType) => void;
  setSelectedColor: (color: ColorHex) => void;
  setBrushSize: (size: number) => void;
  setDrawing: (isDrawing: boolean) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (x: number, y: number) => void;
  setShowGridLines: (show: boolean) => void;
  setPixelStyle: (style: PixelStyle) => void;
  setImportedImage: (uri: string | null) => void;
  setCropRegion: (region) => void;
  setSelectionRegion: (region) => void;
  resetView: () => void;
  pushToUndoStack: (grid: Map<string, string>) => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
}

// Helper to convert Map to/from JSON (since Maps aren't JSON-serializable)
function mapToJson(map: Map<string, string>): Record<string, string> {
  return Object.fromEntries(map.entries());
}

function jsonToMap(json: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(json));
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      // Initial state
      grid: new Map(),
      gridSize: { width: 20, height: 20 },
      currentTool: 'brush',
      brushSize: 1,
      selectedColor: '#000000',
      zoom: 1.0,
      panOffset: { x: 0, y: 0 },
      showGridLines: true,
      pixelStyle: PixelStyle.CIRCLE,
      importedImage: null,
      cropRegion: null,
      selectionRegion: null,
      isDrawing: false,
      undoStack: [],
      redoStack: [],

      setPixel: (x, y, color) => {
        const { grid } = get();
        const newGrid = new Map(grid);

        if (color === '' || color === '#FFFFFF') {
          // Erase pixel
          newGrid.delete(`${x},${y}`);
        } else {
          // Place pixel
          newGrid.set(`${x},${y}`, color);
        }

        set({ grid: newGrid });
      },

      setGridSize: (width, height) => {
        const { grid } = get();
        const newGrid = new Map(grid);

        // Remove pixels outside new grid size
        for (const [key] of newGrid) {
          const [x, y] = key.split(',').map(Number);
          if (x >= width || y >= height) {
            newGrid.delete(key);
          }
        }

        set({ grid: newGrid, gridSize: { width, height } });
      },

      setSelectedTool: (tool) => set({ currentTool: tool }),

      setSelectedColor: (color) => set({ selectedColor: color }),

      setBrushSize: (size) => set({ brushSize: size }),

      setDrawing: (isDrawing) => set({ isDrawing }),

      setZoom: (zoom) => {
        // Clamp zoom between 0.5x and 5x
        const clampedZoom = Math.max(0.5, Math.min(5, zoom));
        set({ zoom: clampedZoom });
      },

      setPanOffset: (x, y) => {
        set({ panOffset: { x, y } });
      },

      setShowGridLines: (show) => set({ showGridLines: show }),

      setPixelStyle: (style) => set({ pixelStyle: style }),

      setImportedImage: (uri) => set({ importedImage: uri }),

      setCropRegion: (region) => set({ cropRegion: region }),

      setSelectionRegion: (region) => set({ selectionRegion: region }),

      resetView: () => {
        set({ zoom: 1.0, panOffset: { x: 0, y: 0 } });
      },

      pushToUndoStack: (grid) => {
        const { undoStack } = get();
        // Limit undo stack to 20 items
        const newUndoStack = [JSON.stringify(mapToJson(grid)), ...undoStack].slice(0, 20);
        set({ undoStack: newUndoStack, redoStack: [] });
      },

      undo: () => {
        const { grid, undoStack, redoStack } = get();
        if (undoStack.length === 0) return;

        // Save current state to redo stack
        redoStack.unshift(JSON.stringify(mapToJson(grid)));

        // Restore from undo stack
        const previousState = JSON.parse(undoStack[0]);
        const previousGrid = jsonToMap(previousState);

        set({ grid: previousGrid, undoStack: undoStack.slice(1), redoStack });
      },

      redo: () => {
        const { grid, undoStack, redoStack } = get();
        if (redoStack.length === 0) return;

        // Save current state to undo stack
        undoStack.unshift(JSON.stringify(mapToJson(grid)));

        // Restore from redo stack
        const nextState = JSON.parse(redoStack[0]);
        const nextGrid = jsonToMap(nextState);

        set({ grid: nextGrid, undoStack, redoStack: redoStack.slice(1) });
      },

      clearCanvas: () => {
        const { pushToUndoStack, grid } = get();
        pushToUndoStack(grid);
        set({ grid: new Map() });
      },

      setImportedImage: (uri) => {
        set({ importedImage: uri });
      },
    }),
    {
      name: 'canvas-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        // Persist only these fields (don't persist isDrawing, redoStack)
        grid: Array.from(state.grid.entries()), // Convert Map to array for JSON serialization
        gridSize: state.gridSize,
        currentTool: state.currentTool,
        brushSize: state.brushSize,
        selectedColor: state.selectedColor,
        zoom: state.zoom,
        panOffset: state.panOffset,
        showGridLines: state.showGridLines,
        undoStack: state.undoStack,
      }),
      merge: (persistedState: any, currentState: CanvasState) => {
        // Merge persisted grid array back to Map
        const mergedState = { ...currentState, ...persistedState };
        if (Array.isArray(persistedState.grid)) {
          mergedState.grid = new Map(persistedState.grid);
        }
        return mergedState;
      },
    }
  )
);
