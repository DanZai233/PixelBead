import { Selection, SelectionMode } from '../types';
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
 * contiguous=false 时忽略连通性，选中全画布所有相近颜色（PS 魔棒取消勾选 Contiguous 的效果）。
 */
export function wandSelectCells(
  grid: string[][],
  startRow: number,
  startCol: number,
  tolerance: number,
  contiguous: boolean = true,
): string[] {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  if (startRow < 0 || startRow >= height || startCol < 0 || startCol >= width) return [];

  const target = grid[startRow][startCol];

  if (!contiguous) {
    const result: string[] = [];
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (colorDistance(target, grid[r][c]) <= tolerance) {
          result.push(cellKey(r, c));
        }
      }
    }
    return result;
  }

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

/**
 * 识别背景：从画布四边均匀采样种子点，各自做连续泛洪后合并，
 * 得到与边缘颜色相连的背景区域（类似 PS 点背景 + 魔棒的连招）。
 * 主体不贴边时能一次选中整块背景，配合 Delete 即可抠图。
 */
export function detectBackgroundCells(grid: string[][], tolerance: number): Set<string> {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  if (height === 0 || width === 0) return new Set();

  const result = new Set<string>();
  const stepX = Math.max(1, Math.floor(width / 8));
  const stepY = Math.max(1, Math.floor(height / 8));

  for (let x = 0; x < width; x += stepX) {
    wandSelectCells(grid, 0, x, tolerance).forEach(k => result.add(k));
    wandSelectCells(grid, height - 1, x, tolerance).forEach(k => result.add(k));
  }
  for (let y = 0; y < height; y += stepY) {
    wandSelectCells(grid, y, 0, tolerance).forEach(k => result.add(k));
    wandSelectCells(grid, y, width - 1, tolerance).forEach(k => result.add(k));
  }

  return result;
}

/** 选区反选：画布中所有未被当前选区覆盖的格子（PS Ctrl+Shift+I） */
export function invertSelectionCells(
  current: Selection,
  gridWidth: number,
  gridHeight: number,
): Set<string> {
  const base = getSelectionCellSet(current, gridWidth, gridHeight);
  const inverted = new Set<string>();
  for (let r = 0; r < gridHeight; r++) {
    for (let c = 0; c < gridWidth; c++) {
      const k = cellKey(r, c);
      if (!base.has(k)) inverted.add(k);
    }
  }
  return inverted;
}

/** 由单元格集合构建选区（自动计算包围盒），空集合返回 null */
export function selectionFromCells(cells: Set<string>): Selection | null {
  if (cells.size === 0) return null;
  let rMin = Infinity, rMax = -Infinity, cMin = Infinity, cMax = -Infinity;
  for (const key of cells) {
    const [r, c] = key.split(',').map(Number);
    if (r < rMin) rMin = r;
    if (r > rMax) rMax = r;
    if (c < cMin) cMin = c;
    if (c > cMax) cMax = c;
  }
  return {
    startRow: rMin,
    startCol: cMin,
    endRow: rMax,
    endCol: cMax,
    cells: Array.from(cells),
  };
}

/** 精确判断某个格子是否在当前选区内，避免为单次判断生成整个包围盒。 */
export function isCellInSelection(selection: Selection, row: number, col: number): boolean {
  const key = cellKey(row, col);
  if (selection.cells && selection.cells.length > 0) {
    return selection.cells.includes(key);
  }

  const rMin = Math.min(selection.startRow, selection.endRow);
  const rMax = Math.max(selection.startRow, selection.endRow);
  const cMin = Math.min(selection.startCol, selection.endCol);
  const cMax = Math.max(selection.startCol, selection.endCol);
  return row >= rMin && row <= rMax && col >= cMin && col <= cMax;
}

interface MoveSelectionResult {
  grid: string[][];
  selection: Selection;
  movedRow: number;
  movedCol: number;
}

/**
 * 移动选区内容并同步移动选区。位移会按画布边界裁剪，
 * 选区外的内容保持不变；来源格始终从拖动开始前的原始画布读取。
 */
export function moveSelectionContent(
  selection: Selection,
  sourceGrid: string[][],
  deltaRow: number,
  deltaCol: number,
  gridWidth: number,
  gridHeight: number,
): MoveSelectionResult {
  const selectedCells = getSelectionCellSet(selection, gridWidth, gridHeight);
  const nextGrid = sourceGrid.map(row => [...row]);

  if (selectedCells.size === 0) {
    return {
      grid: nextGrid,
      selection: {
        ...selection,
        cells: selection.cells ? [...selection.cells] : undefined,
      },
      movedRow: 0,
      movedCol: 0,
    };
  }

  let rMin = Infinity, rMax = -Infinity, cMin = Infinity, cMax = -Infinity;
  for (const key of selectedCells) {
    const [r, c] = key.split(',').map(Number);
    rMin = Math.min(rMin, r);
    rMax = Math.max(rMax, r);
    cMin = Math.min(cMin, c);
    cMax = Math.max(cMax, c);
  }

  const movedRow = Math.max(-rMin, Math.min(gridHeight - 1 - rMax, deltaRow));
  const movedCol = Math.max(-cMin, Math.min(gridWidth - 1 - cMax, deltaCol));

  if (movedRow === 0 && movedCol === 0) {
    return {
      grid: nextGrid,
      selection: {
        ...selection,
        cells: selection.cells ? [...selection.cells] : undefined,
      },
      movedRow,
      movedCol,
    };
  }

  for (const key of selectedCells) {
    const [r, c] = key.split(',').map(Number);
    nextGrid[r][c] = '#FFFFFF';
  }

  const movedCells = new Set<string>();
  for (const key of selectedCells) {
    const [r, c] = key.split(',').map(Number);
    const nextRow = r + movedRow;
    const nextCol = c + movedCol;
    nextGrid[nextRow][nextCol] = sourceGrid[r][c];
    movedCells.add(cellKey(nextRow, nextCol));
  }

  const nextSelection: Selection = selection.cells && selection.cells.length > 0
    ? selectionFromCells(movedCells)!
    : {
        startRow: selection.startRow + movedRow,
        startCol: selection.startCol + movedCol,
        endRow: selection.endRow + movedRow,
        endCol: selection.endCol + movedCol,
      };

  return {
    grid: nextGrid,
    selection: nextSelection,
    movedRow,
    movedCol,
  };
}

/**
 * 按叠加模式合并选区：
 * - replace:直接采用新选区
 * - add:新区域并入现有选区（并集），生成不规则选区
 * - subtract:从现有选区减去新区域（差集），减空返回 null
 */
export function mergeSelectionCells(
  current: Selection | null,
  newCells: Set<string>,
  mode: SelectionMode,
  gridWidth: number,
  gridHeight: number,
): Selection | null {
  if (mode === 'replace' || !current) {
    if (mode === 'replace' && !newCells.size) return null;
    return selectionFromCells(newCells);
  }

  const base = new Set(getSelectionCellSet(current, gridWidth, gridHeight));

  if (mode === 'add') {
    for (const key of newCells) base.add(key);
    return selectionFromCells(base);
  }

  // subtract
  for (const key of newCells) base.delete(key);
  return selectionFromCells(base);
}
