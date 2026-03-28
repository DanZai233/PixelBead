import { useMemo } from 'react';
import { useCanvasStore } from '../stores/canvasStore';
import { getCanvasMetrics, type CanvasMetrics } from '../utils/canvasViewport';

export interface RenderedCell {
  x: number;
  y: number;
  color: string;
  key: string;
}

export function useCanvasRenderer() {
  const grid = useCanvasStore((state) => state.grid);
  const gridSize = useCanvasStore((state) => state.gridSize);
  const zoom = useCanvasStore((state) => state.zoom);
  const panOffset = useCanvasStore((state) => state.panOffset);
  const showGridLines = useCanvasStore((state) => state.showGridLines);

  // Memoize canvas metrics to prevent recalculation on every render
  const metrics = useMemo<CanvasMetrics>(() => {
    return getCanvasMetrics(
      gridSize.width,
      gridSize.height,
      zoom,
      panOffset
    );
  }, [gridSize, zoom, panOffset]);

  // Memoize visible cells with viewport culling
  const visibleCells = useMemo<RenderedCell[]>(() => {
    const { visibleRange } = metrics;
    const cells: RenderedCell[] = [];

    // Only iterate over visible range (not entire grid)
    for (let x = visibleRange.startX; x < visibleRange.endX; x++) {
      for (let y = visibleRange.startY; y < visibleRange.endY; y++) {
        const key = `${x},${y}`;
        const color = grid.get(key);

        if (color) {
          cells.push({
            x,
            y,
            color,
            key,
          });
        }
      }
    }

    return cells;
  }, [grid, metrics]);

  return {
    metrics,
    visibleCells,
    showGridLines,
  };
}
