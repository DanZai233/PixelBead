// useColorStatistics hook for color statistics and merging

import { useMemo } from 'react';
import { useCanvasStore } from '../stores/canvasStore';
import { getColorCounts, mergeSimilarColors } from '../types/shared';
import type { PaletteColor } from '../types/shared';

export function useColorStatistics() {
  const grid = useCanvasStore((state) => state.grid);
  const setHighlightedColor = useCanvasStore((state) => state.setHighlightedColor);

  // Calculate color counts from grid
  const colorCounts = useMemo(() => {
    // Convert Map to 2D array for getColorCounts
    const gridSize = useCanvasStore.getState().gridSize;
    const gridArray: string[][] = [];

    for (let y = 0; y < gridSize.height; y++) {
      const row: string[] = [];
      for (let x = 0; x < gridSize.width; x++) {
        row.push(grid.get(`${x},${y}`) || '#FFFFFF');
      }
      gridArray.push(row);
    }

    return getColorCounts(gridArray);
  }, [grid]);

  // Merge similar colors
  const handleMergeSimilarColors = (threshold: number) => {
    const mergedColors = mergeSimilarColors(colorCounts, threshold);

    // For each merged color, update the grid to use the dominant color
    mergedColors.forEach((mergedColor: PaletteColor) => {
      // Find pixels that should be merged to this color
      colorCounts.forEach((originalColor: PaletteColor) => {
        if (originalColor.hex !== mergedColor.hex) {
          // Check if this color should be merged
          // For now, we won't implement full merging logic
          // In a full implementation, we would:
          // 1. Calculate color distance
          // 2. If distance <= threshold, update all pixels
        }
      });
    });
  };

  // Highlight all pixels of a specific color
  const highlightColor = (hex: string | null) => {
    setHighlightedColor(hex);
  };

  return {
    colorCounts,
    handleMergeSimilarColors,
    highlightColor,
    totalBeads: colorCounts.reduce((sum: number, color: PaletteColor) => sum + (color.count || 0), 0),
  };
}
