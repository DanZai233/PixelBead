export type ColorSystem = 'MARD' | 'COCO' | '漫漫' | '盼盼' | '咪小窝';

export const colorSystemOptions = [
  { key: 'MARD', name: 'MARD' },
  { key: 'COCO', name: 'COCO' },
  { key: '漫漫', name: '漫漫' },
  { key: '盼盼', name: '盼盼' },
  { key: '咪小窝', name: '咪小窝' },
];

export interface PaletteColor {
  hex: string;
  key: string;
  count?: number;
}

export interface ColorMapping {
  [hex: string]: Record<ColorSystem, string>;
}

// RGB 颜色转换
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// RGB 转 HSL
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * 感知加权 RGB 欧几里得颜色距离
 *
 * 采用人眼对不同波长的敏感度权重（类似 BT.601 亮度系数）：
 * - 绿色最敏感 (0.587)，红色次之 (0.299)，蓝色最弱 (0.114)
 * - 归一化到 0–100 范围，与 UI 滑条百分比直接对应
 * - 0 = 完全相同, ~100 = 最大色差（黑 vs 白 ≈ 100）
 */
export function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return Infinity;

  const dr = (rgb1.r - rgb2.r) * 0.299;
  const dg = (rgb1.g - rgb2.g) * 0.587;
  const db = (rgb1.b - rgb2.b) * 0.114;

  // 归一化到 0–100
  return Math.sqrt(dr * dr + dg * dg + db * db) * (100 / 255);
}

/**
 * K-Means 聚类：将颜色列表归约为 targetK 个代表性颜色
 *
 * 优势：结果与输入顺序无关，每个颜色都找到最优归属，
 * 避免贪心单链聚合导致的"A 并 B、B 并 C、但 A 不并 C"问题。
 */
export function kMeansClustering(
  colors: Map<string, number>, // hex -> pixel count
  targetK: number,
  maxIterations: number = 20,
): PaletteColor[] {
  const entries = Array.from(colors.entries());
  if (entries.length === 0) return [];

  // 颜色太少，直接返回
  if (entries.length <= targetK) {
    return entries.map(([hex, count]) => ({ hex, key: hex, count }));
  }

  // 将颜色转换为 RGB 向量
  type Vec3 = { r: number; g: number; b: number; hex: string; count: number };
    const vectors: Vec3[] = [];
  for (const [hex, count] of entries) {
    const rgb = hexToRgb(hex);
    if (rgb) vectors.push({ ...rgb, hex, count });
  }

  if (vectors.length <= targetK) {
    return vectors.map(v => ({ hex: v.hex, key: v.hex, count: v.count }));
  }

  // 初始化质心：用 k-means++ 思路，选分布最广的 k 个点
  const centroids: { r: number; g: number; b: number }[] = [];
  const used = new Set<number>();

  // 第一个质心：数量最多的颜色
  centroids.push({ r: vectors[0].r, g: vectors[0].g, b: vectors[0].b });
  used.add(0);

  // 后续质心：选离已有质心最远的
  for (let k = 1; k < targetK; k++) {
    let farthestIdx = -1;
    let maxDist = -1;
    for (let i = 0; i < vectors.length; i++) {
      if (used.has(i)) continue;
      let minDist = Infinity;
      for (const c of centroids) {
        const dr = (vectors[i].r - c.r) * 0.299;
        const dg = (vectors[i].g - c.g) * 0.587;
        const db = (vectors[i].b - c.b) * 0.114;
        const d = dr * dr + dg * dg + db * db;
        if (d < minDist) minDist = d;
      }
      if (minDist > maxDist) {
        maxDist = minDist;
        farthestIdx = i;
      }
    }
    if (farthestIdx >= 0) {
      centroids.push({ r: vectors[farthestIdx].r, g: vectors[farthestIdx].g, b: vectors[farthestIdx].b });
      used.add(farthestIdx);
    }
  }

  // 迭代
  for (let iter = 0; iter < maxIterations; iter++) {
    // 分配每个颜色到最近的质心
    const clusters: Vec3[][] = centroids.map(() => []);
    for (const v of vectors) {
      let bestC = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const dr = (v.r - centroids[c].r) * 0.299;
        const dg = (v.g - centroids[c].g) * 0.587;
        const db = (v.b - centroids[c].b) * 0.114;
        const d = dr * dr + dg * dg + db * db;
        if (d < bestDist) {
          bestDist = d;
          bestC = c;
        }
      }
      clusters[bestC].push(v);
    }

    // 更新质心为簇内均值
    let changed = false;
    for (let c = 0; c < centroids.length; c++) {
      const cluster = clusters[c];
      if (cluster.length === 0) continue;
      const sumR = cluster.reduce((s, v) => s + v.r, 0);
      const sumG = cluster.reduce((s, v) => s + v.g, 0);
      const sumB = cluster.reduce((s, v) => s + v.b, 0);
      const nr = Math.round(sumR / cluster.length);
      const ng = Math.round(sumG / cluster.length);
      const nb = Math.round(sumB / cluster.length);
      if (nr !== centroids[c].r || ng !== centroids[c].g || nb !== centroids[c].b) {
        centroids[c] = { r: nr, g: ng, b: nb };
        changed = true;
      }
    }
    if (!changed) break;
  }

  // 输出结果：每个质心找到簇内数量最多的颜色作为代表色
  const finalClusters: Vec3[][] = centroids.map(() => []);
  for (const v of vectors) {
    let bestC = 0;
    let bestDist = Infinity;
    for (let c = 0; c < centroids.length; c++) {
      const dr = (v.r - centroids[c].r) * 0.299;
      const dg = (v.g - centroids[c].g) * 0.587;
      const db = (v.b - centroids[c].b) * 0.114;
      const d = dr * dr + dg * dg + db * db;
      if (d < bestDist) { bestDist = d; bestC = c; }
    }
    finalClusters[bestC].push(v);
  }

  const result: PaletteColor[] = [];
  for (const cluster of finalClusters) {
    if (cluster.length === 0) continue;
    cluster.sort((a, b) => b.count - a.count);
    const dominant = cluster[0];
    const totalCount = cluster.reduce((s, v) => s + v.count, 0);
    result.push({ hex: dominant.hex, key: dominant.hex, count: totalCount });
  }

  return result.sort((a, b) => (b.count || 0) - (a.count || 0));
}

/**
 * 用 K-Means 将画布颜色归约到 targetColorCount 种颜色。
 * 这是新版"合并相似颜色"的核心入口。
 */
export function reduceGridColors(
  grid: string[][],
  targetColorCount: number,
): string[][] {
  // 统计画布上所有颜色
  const colorCounts = new Map<string, number>();
  for (const row of grid) {
    for (const color of row) {
      if (color && color !== '#FFFFFF') {
        colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
      }
    }
  }

  if (colorCounts.size === 0 || colorCounts.size <= targetColorCount) return grid;

  // K-Means 聚类
  const palette = kMeansClustering(colorCounts, targetColorCount);

  // 构建查找表加速映射
  const lookup = new Map<string, string>();
  for (const [color] of colorCounts) {
    let bestPalette = palette[0];
    let bestDist = Infinity;
    for (const p of palette) {
      const d = colorDistance(color, p.hex);
      if (d < bestDist) {
        bestDist = d;
        bestPalette = p;
      }
    }
    lookup.set(color, bestPalette.hex);
  }

  return grid.map(row =>
    row.map(color => {
      if (!color || color === '#FFFFFF') return '#FFFFFF';
      return lookup.get(color) || color;
    }),
  );
}

// 寻找最近的颜色
export function findClosestColor(
  targetHex: string,
  palette: PaletteColor[]
): PaletteColor | null {
  if (!palette || palette.length === 0) {
    console.warn('findClosestColor: palette is empty');
    return null;
  }

  let minDistance = Infinity;
  let closestColor: PaletteColor | null = null;

  for (const color of palette) {
    const distance = colorDistance(targetHex, color.hex);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }

  return closestColor;
}

/**
 * @deprecated 保留旧接口兼容性，内部改用 K-Means 逻辑。
 * 推荐直接使用 reduceGridColors(grid, targetColorCount)。
 */
export function mergeSimilarColors(
  colors: PaletteColor[],
  threshold: number = 0.15
): PaletteColor[] {
  if (colors.length === 0) return [];

  const colorMap = new Map<string, number>();
  for (const c of colors) colorMap.set(c.hex, (c.count || 0) + (colorMap.get(c.hex) || 0));

  // 估算目标聚类数：颜色之间最小距离的启发式
  const uniqueHexes = Array.from(colorMap.keys());
  let minPairDist = Infinity;
  for (let i = 0; i < uniqueHexes.length && i < 50; i++) {
    for (let j = i + 1; j < uniqueHexes.length && j < 50; j++) {
      const d = colorDistance(uniqueHexes[i], uniqueHexes[j]);
      if (d > 0 && d < minPairDist) minPairDist = d;
    }
  }
  const normalizedThreshold = threshold * 100;
  const estK = Math.max(1, Math.round(
    colorMap.size / Math.max(1, Math.floor(normalizedThreshold / Math.max(minPairDist, 0.5)))
  ));
  const targetK = Math.min(colorMap.size, Math.max(1, estK));

  return kMeansClustering(colorMap, targetK);
}

// 将画布颜色映射到指定色板
export function mapColorsToPalette(
  grid: string[][],
  targetPalette: PaletteColor[]
): string[][] {
  return grid.map(row =>
    row.map(color => {
      if (color === '#FFFFFF' || !color) return color;
      const closest = findClosestColor(color, targetPalette);
      return closest ? closest.hex : color;
    })
  );
}

/**
 * 泛洪填充去背景：从图片边缘出发，将连通背景区域的像素设为透明。
 *
 * 适用于纯色/柔和渐变背景。从图片四边采样多个种子点做 flood fill，
 * 相邻像素色差小于 bgThreshold 的视为背景，标记 alpha=0（透明）。
 *
 * @param imageData - canvas getImageData 返回的像素数据
 * @param bgThreshold - 背景容差，默认 12（归一化距离，大致等于 ~30 RGB 欧氏单位）
 * @returns 修改后的 ImageData（背景区域 alpha=0）
 */
export function removeBackground(
  imageData: ImageData,
  bgThreshold: number = 12,
): ImageData {
  const { data, width, height } = imageData;
  const visited = new Uint8Array(width * height);
  const queue: [number, number][] = [];

  function getPixel(x: number, y: number): { r: number; g: number; b: number; a: number } {
    const i = (y * width + x) * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  }

  function setAlpha(x: number, y: number, a: number) {
    data[(y * width + x) * 4 + 3] = a;
  }

  function colorDiff(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number,
  ): number {
    const dr = (r1 - r2) * 0.299;
    const dg = (g1 - g2) * 0.587;
    const db = (b1 - b2) * 0.114;
    return Math.sqrt(dr * dr + dg * dg + db * db) * (100 / 255);
  }

  // 种子点：四边均匀采样
  const seedPoints: [number, number][] = [];
  const stepX = Math.max(1, Math.floor(width / 8));
  const stepY = Math.max(1, Math.floor(height / 8));
  for (let x = 0; x < width; x += stepX) {
    seedPoints.push([x, 0], [x, height - 1]);
  }
  for (let y = 0; y < height; y += stepY) {
    seedPoints.push([0, y], [width - 1, y]);
  }

  for (const [sx, sy] of seedPoints) {
    const idx = sy * width + sx;
    if (visited[idx]) continue;

    const seed = getPixel(sx, sy);
    if (seed.a < 128) continue;

    queue.push([sx, sy]);
    visited[idx] = 1;

    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      setAlpha(x, y, 0);

      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const nidx = ny * width + nx;
        if (visited[nidx]) continue;
        const np = getPixel(nx, ny);
        if (np.a < 128) continue;
        if (colorDiff(seed.r, seed.g, seed.b, np.r, np.g, np.b) <= bgThreshold) {
          visited[nidx] = 1;
          queue.push([nx, ny]);
        }
      }
    }
  }

  return imageData;
}

// 统计颜色使用量
export function getColorCounts(grid: string[][]): PaletteColor[] {
  const counts: Record<string, number> = {};

  grid.forEach(row => {
    row.forEach(color => {
      if (color && color !== '#FFFFFF') {
        counts[color] = (counts[color] || 0) + 1;
      }
    });
  });

  return Object.entries(counts).map(([hex, count]) => ({
    hex,
    key: hex,
    count,
  })).sort((a, b) => b.count - a.count);
}

// 从画布创建色板
export function createPaletteFromGrid(grid: string[][], maxColors?: number): PaletteColor[] {
  let colors = getColorCounts(grid);

  if (maxColors && colors.length > maxColors) {
    colors = colors.slice(0, maxColors);
  }

  return colors;
}

// 从映射数据创建完整色板
export function createFullPaletteFromMapping(
  mapping: ColorMapping,
  colorSystem?: ColorSystem,
  maxColors?: number
): PaletteColor[] {
  const allColors = Object.entries(mapping).map(([hex, colorData]) => ({
    hex,
    key: colorSystem ? colorData[colorSystem] : hex,
  }));

  if (maxColors && allColors.length > maxColors) {
    return allColors.slice(0, maxColors);
  }

  return allColors;
}

// 按色相排序颜色
export function sortColorsByHue<T extends { color: string }>(colors: T[]): T[] {
  return colors.slice().sort((a, b) => {
    const rgbA = hexToRgb(a.color);
    const rgbB = hexToRgb(b.color);

    if (!rgbA || !rgbB) return 0;

    const hslA = rgbToHsl(rgbA.r, rgbA.g, rgbA.b);
    const hslB = rgbToHsl(rgbB.r, rgbB.g, rgbB.b);

    // 首先按色相排序
    if (Math.abs(hslA.h - hslB.h) > 5) {
      return hslA.h - hslB.h;
    }

    // 色相相同，按明度排序（从浅到深）
    if (Math.abs(hslA.l - hslB.l) > 3) {
      return hslB.l - hslA.l;
    }

    // 明度也相同，按饱和度排序（高饱和度优先）
    return hslB.s - hslA.s;
  });
}
