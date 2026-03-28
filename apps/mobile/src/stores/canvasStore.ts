// Canvas state management with MMKV persistence
// Use selector-based subscriptions: useCanvasStore(state => state.selectedColor)
// Avoid subscribing to entire store: useCanvasStore() ❌

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkvStorage';
import type { ColorHex, ToolType } from '@pixelbead/shared-types';

interface CanvasState {
  // Grid state
  grid: ColorHex[][];
  gridSize: number;

  // Tool selection
  selectedTool: ToolType;
  brushSize: number;
  selectedColor: ColorHex;

  // Drawing state
  isDrawing: boolean;

  // History (undo/redo)
  undoStack: string[]; // JSON-serialized grids
  redoStack: string[];

  // Actions
  setGrid: (grid: ColorHex[][]) => void;
  setSelectedTool: (tool: ToolType) => void;
  setSelectedColor: (color: ColorHex) => void;
  setBrushSize: (size: number) => void;
  setDrawing: (isDrawing: boolean) => void;
  pushToUndoStack: (grid: ColorHex[][]) => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      // Initial state
      grid: Array(20).fill(null).map(() => Array(20).fill('#FFFFFF')),
      gridSize: 20,
      selectedTool: 'PENCIL' as ToolType,
      brushSize: 1,
      selectedColor: '#000000',
      isDrawing: false,
      undoStack: [],
      redoStack: [],

      setGrid: (grid) => set({ grid }),

      setSelectedTool: (tool) => set({ selectedTool: tool }),

      setSelectedColor: (color) => set({ selectedColor: color }),

      setBrushSize: (size) => set({ brushSize: size }),

      setDrawing: (isDrawing) => set({ isDrawing }),

      pushToUndoStack: (grid) => {
        const { undoStack, gridSize } = get();
        // Limit undo stack to 20 items
        const newUndoStack = [JSON.stringify({ grid, gridSize }), ...undoStack].slice(0, 20);
        set({ undoStack: newUndoStack, redoStack: [] });
      },

      undo: () => {
        const { grid, undoStack, redoStack, setGrid, gridSize } = get();
        if (undoStack.length === 0) return;

        // Save current state to redo stack
        redoStack.unshift(JSON.stringify({ grid, gridSize }));

        // Restore from undo stack
        const previousState = JSON.parse(undoStack[0]);
        setGrid(previousState.grid);

        // Remove from undo stack
        set({ undoStack: undoStack.slice(1), redoStack });
      },

      redo: () => {
        const { grid, undoStack, redoStack, setGrid, gridSize } = get();
        if (redoStack.length === 0) return;

        // Save current state to undo stack
        undoStack.unshift(JSON.stringify({ grid, gridSize }));

        // Restore from redo stack
        const nextState = JSON.parse(redoStack[0]);
        setGrid(nextState.grid);

        // Remove from redo stack
        set({ undoStack, redoStack: redoStack.slice(1) });
      },

      clearCanvas: () => {
        const { gridSize, pushToUndoStack } = get();
        const { grid } = get();
        pushToUndoStack(grid);
        set({ grid: Array(gridSize).fill(null).map(() => Array(gridSize).fill('#FFFFFF')) });
      },
    }),
    {
      name: 'canvas-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        // Persist only these fields (don't persist isDrawing, redoStack)
        grid: state.grid,
        gridSize: state.gridSize,
        selectedTool: state.selectedTool,
        brushSize: state.brushSize,
        selectedColor: state.selectedColor,
        undoStack: state.undoStack,
      }),
    }
  )
);
