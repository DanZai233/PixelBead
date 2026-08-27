import { Selection } from '../types';
import { colorDistance } from './colorSystemUtils';

const cellKey = (r: number, c: number) => `${r},${c}`;

/**
 * 解析选区覆盖的所有单元格（"row,col" 键集合）。
 * - 不规则选区（cells 非空）:直接使用 cells
 * - 矩形选区:按包围盒生成
 */
export function getSelectionCellSet(
  selection: Selection,
  gridWidth: number,
  gridHeight: number,
): Set<string> {
  const set = new Set<string>();

  if (selection.cells && selection.cells.length > 0) {
    for (const key of selection.cells) {
      const [r, c] = key.split(',').map(Number);
      if (Number.isInteger(r) && Number.isInteger(c) && r >= 0 && r < gridHeight && c >= 0 && c < gridWidth) {
        set.add(key);
      }
    }
    return set;
  }

  const { startRow, startCol, endRow, endCol } = selection;
  const rMin = Math.min(startRow, endRow);
  const rMax = Math.max(startRow, endRow);
  const cMin = Math.min(startCol, endCol);
  const cMax = Math.max(startCol, endCol);

  for (let r = rMin; r <= rMax; r++) {
    for (let c = cMin; c <= cMax; c++) {
      if (r >= 0 && r < gridHeight && c >= 0 && c < gridWidth) {
        set.add(cellKey(r, c));
      }
    }
  }
  return set;
}

/**
 * 魔棒选区：从起点做 4 连通泛洪，选中与起点颜色距离 <= tolerance 的所有相连格子。
 *
 * 返回 "row,col" 键数组（即不规则选区 cells）。
 * 白色视为透明/背景色，点击白格只会选中相近的白格。
 */
export function wandSelectCells(
  grid: string[][],
  startRow: number,
  startCol: number,
  tolerance: number,
): string[] {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  if (startRow < 0 || startRow >= height || startCol < 0 || startCol >= width) return [];

  const target = grid[startRow][startCol];
  const visited = new Set<string>();
  const queue: Array<[number, number]> = [[startRow, startCol]];
  visited.add(cellKey(startRow, startCol));

  while (queue.length > 0) {
    const [r, c] = queue.pop()!;
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue;
      const key = cellKey(nr, nc);
      if (visited.has(key)) continue;
      if (colorDistance(target, grid[nr][nc]) <= tolerance) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }

  return Array.from(visited);
}
