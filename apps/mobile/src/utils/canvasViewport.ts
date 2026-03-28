import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface ViewportRange {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
}

export interface CanvasMetrics {
  cellSize: number;
  totalWidth: number;
  totalHeight: number;
  visibleRange: ViewportRange;
}

/**
 * Calculate cell size based on zoom level to fit grid on screen
 * Minimum 10px per cell for usability
 */
export function getCellSize(
  gridWidth: number,
  gridHeight: number,
  zoom: number,
  padding: number = 50
): number {
  const availableWidth = screenWidth - padding * 2;
  const availableHeight = screenHeight - padding * 2;
  const baseSize = Math.min(
    availableWidth / gridWidth,
    availableHeight / gridHeight
  );
  return Math.max(baseSize * zoom, 10);
}

/**
 * Calculate range of visible cells based on pan offset and zoom
 * Used for viewport culling - only render cells within this range
 */
export function calculateVisibleRange(
  gridWidth: number,
  gridHeight: number,
  cellSize: number,
  panOffset: { x: number; y: number }
): ViewportRange {
  const startX = Math.max(0, Math.floor(-panOffset.x / cellSize));
  const startY = Math.max(0, Math.floor(-panOffset.y / cellSize));
  const endX = Math.min(
    gridWidth,
    Math.ceil((-panOffset.x + screenWidth) / cellSize) + 1
  );
  const endY = Math.min(
    gridHeight,
    Math.ceil((-panOffset.y + screenHeight) / cellSize) + 1
  );

  return { startX, endX, startY, endY };
}

/**
 * Calculate canvas dimensions for rendering bounds
 */
export function getCanvasMetrics(
  gridWidth: number,
  gridHeight: number,
  zoom: number,
  panOffset: { x: number; y: number }
): CanvasMetrics {
  const cellSize = getCellSize(gridWidth, gridHeight, zoom);
  const totalWidth = gridWidth * cellSize;
  const totalHeight = gridHeight * cellSize;
  const visibleRange = calculateVisibleRange(
    gridWidth,
    gridHeight,
    cellSize,
    panOffset
  );

  return { cellSize, totalWidth, totalHeight, visibleRange };
}
