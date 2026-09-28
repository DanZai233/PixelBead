import type { ColorHex } from '../types';

const TRANSPARENT = '#FFFFFF';

function cloneEmptyGrid(width: number, height: number): ColorHex[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => TRANSPARENT));
}

export function flipGridHorizontal(grid: ColorHex[][]): ColorHex[][] {
  return grid.map(row => [...row].reverse());
}

export function flipGridVertical(grid: ColorHex[][]): ColorHex[][] {
  return [...grid].reverse();
}

export function rotateGridClockwise(grid: ColorHex[][]): ColorHex[][] {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  if (height === 0 || width === 0) return grid;
  const result = cloneEmptyGrid(height, width);
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      result[col][height - 1 - row] = grid[row][col];
    }
  }
  return result;
}

export function rotateGridCounterClockwise(grid: ColorHex[][]): ColorHex[][] {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  if (height === 0 || width === 0) return grid;
  const result = cloneEmptyGrid(height, width);
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      result[width - 1 - col][row] = grid[row][col];
    }
  }
  return result;
}

/** Nearest-neighbor scaling is intentional: bead artwork keeps hard pixel edges. */
export function scaleGrid(grid: ColorHex[][], targetWidth: number, targetHeight: number): ColorHex[][] {
  const sourceHeight = grid.length;
  const sourceWidth = grid[0]?.length ?? 0;
  if (sourceWidth === 0 || sourceHeight === 0) {
    return cloneEmptyGrid(Math.max(1, targetWidth), Math.max(1, targetHeight));
  }
  const result = cloneEmptyGrid(Math.max(1, targetWidth), Math.max(1, targetHeight));
  for (let row = 0; row < result.length; row++) {
    const sourceRow = Math.min(sourceHeight - 1, Math.floor(row * sourceHeight / result.length));
    for (let col = 0; col < result[0].length; col++) {
      const sourceCol = Math.min(sourceWidth - 1, Math.floor(col * sourceWidth / result[0].length));
      result[row][col] = grid[sourceRow][sourceCol];
    }
  }
  return result;
}

export function mirrorCell(row: number, col: number, mode: string, width: number, height: number): Array<[number, number]> {
  const cells: Array<[number, number]> = [[row, col]];
  if (mode === 'horizontal' || mode === 'both') cells.push([row, width - 1 - col]);
  if (mode === 'vertical' || mode === 'both') cells.push([height - 1 - row, col]);
  if (mode === 'both') cells.push([height - 1 - row, width - 1 - col]);
  return cells.filter(([r, c], index, list) => r >= 0 && r < height && c >= 0 && c < width && list.findIndex(([lr, lc]) => lr === r && lc === c) === index);
}
