// Color state management with MMKV persistence
// Manages palette selection, brand selection, and color highlighting

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkvStorage';
// @ts-ignore - Workaround for path resolution
import type { ColorHex, PaletteColor } from '../../../../packages/shared-types/src';
// @ts-ignore - Workaround for path resolution
import { createPaletteFromSystem, groupColorsByLetter } from '../../data/palettes';

type PaletteSize = 48 | 96 | 144 | 168;
type ColorSystem = 'MARD' | 'COCO' | '漫漫' | '盼盼' | '咪小窝';

interface PaletteGroup {
  letter: string;
  colors: PaletteColor[];
}

interface ColorState {
  // Palette selection
  selectedPaletteSize: PaletteSize;
  selectedBrand: ColorSystem;

  // Current palette
  currentPalette: PaletteColor[];
  paletteGroups: PaletteGroup[];

  // Highlighted color for COLR-09
  highlightedColor: ColorHex | null;

  // Actions
  setSelectedPaletteSize: (size: PaletteSize) => void;
  setSelectedBrand: (brand: ColorSystem) => void;
  selectColor: (color: ColorHex) => void;
  setHighlightedColor: (hex: ColorHex | null) => void;

  // Internal function to regenerate palette
  generatePalette: () => void;
}

// Internal function to generate palette from current settings
function generatePaletteInternal(
  brand: ColorSystem,
  size: PaletteSize
): { palette: PaletteColor[]; groups: PaletteGroup[] } {
  const palette = createPaletteFromSystem(brand, size);
  const groupsMap = groupColorsByLetter(palette);
  const groups: PaletteGroup[] = [];

  groupsMap.forEach((colors, letter) => {
    groups.push({ letter, colors });
  });

  return { palette, groups };
}

export const useColorStore = create<ColorState>()(
  persist(
    (set, get) => {
      // Initialize palette on store creation
      const initialPalette = generatePaletteInternal('MARD', 48);

      return {
        // Initial state
        selectedPaletteSize: 48,
        selectedBrand: 'MARD',
        currentPalette: initialPalette.palette,
        paletteGroups: initialPalette.groups,
        highlightedColor: null,

        // Actions
        setSelectedPaletteSize: (size) => {
          const { selectedBrand } = get();
          const newPalette = generatePaletteInternal(selectedBrand, size);
          set({
            selectedPaletteSize: size,
            currentPalette: newPalette.palette,
            paletteGroups: newPalette.groups,
          });
        },

        setSelectedBrand: (brand) => {
          const { selectedPaletteSize } = get();
          const newPalette = generatePaletteInternal(brand, selectedPaletteSize);
          set({
            selectedBrand: brand,
            currentPalette: newPalette.palette,
            paletteGroups: newPalette.groups,
          });
        },

        selectColor: (color) => {
          // This will update canvasStore.selectedColor
          // Import canvasStore dynamically to avoid circular dependency
          const { useCanvasStore } = require('../stores/canvasStore');
          useCanvasStore.getState().setSelectedColor(color);
        },

        setHighlightedColor: (hex) => {
          set({ highlightedColor: hex });
        },

        generatePalette: () => {
          const { selectedBrand, selectedPaletteSize } = get();
          const newPalette = generatePaletteInternal(selectedBrand, selectedPaletteSize);
          set({
            currentPalette: newPalette.palette,
            paletteGroups: newPalette.groups,
          });
        },
      };
    },
    {
      name: 'color-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
