import type { ColorHex } from '../types';

export const TRANSPARENT_COLOR = '#FFFFFF';

/**
 * Add a single-bead black outline around the outer silhouette of the artwork.
 * Enclosed transparent holes are intentionally preserved.
 */
export function addOuterBlackOutline(grid: ColorHex[][]): {
  grid: ColorHex[][];
  addedCount: number;
} {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const result = grid.map(row => [...row]);
  if (height === 0 || width === 0) {
    return { grid: result, addedCount: 0 };
  }

  const isTransparent = (row: number, col: number) =>
    row >= 0 && row < height && col >= 0 && col < width && grid[row][col] === TRANSPARENT_COLOR;

  // Flood the background connected to the canvas border so enclosed holes do not
  // accidentally become part of the outline.
  const outside = new Set<string>();
  const queue: Array<[number, number]> = [];

  const visit = (row: number, col: number) => {
    if (!isTransparent(row, col)) return;
    const key = `${row},${col}`;
    if (outside.has(key)) return;
    outside.add(key);
    queue.push([row, col]);
  };

  for (let col = 0; col < width; col++) {
    visit(0, col);
    visit(height - 1, col);
  }
  for (let row = 1; row < height - 1; row++) {
    visit(row, 0);
    visit(row, width - 1);
  }

  while (queue.length > 0) {
    const [row, col] = queue.pop()!;
    visit(row + 1, col);
    visit(row - 1, col);
    visit(row, col + 1);
    visit(row, col - 1);
  }

  const neighborOffsets: Array<[number, number]> = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  let addedCount = 0;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (grid[row][col] === TRANSPARENT_COLOR) continue;

      for (const [rowOffset, colOffset] of neighborOffsets) {
        const targetRow = row + rowOffset;
        const targetCol = col + colOffset;
        if (targetRow < 0 || targetRow >= height || targetCol < 0 || targetCol >= width) continue;

        const key = `${targetRow},${targetCol}`;
        if (result[targetRow][targetCol] === TRANSPARENT_COLOR && outside.has(key)) {
          result[targetRow][targetCol] = '#000000';
          addedCount++;
        }
      }
    }
  }

  return { grid: result, addedCount };
}
