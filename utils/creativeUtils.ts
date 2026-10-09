import type { ColorHex } from '../types';
import { hexToRgb } from './colorUtils';
import { getBitmapFont, getGlyph, measureGlyphLine } from './pixelFonts';
import { createQrMatrix } from './qrCode';

/** 空白格统一使用 #FFFFFF，与画布/导出逻辑保持一致 */
export const EMPTY_CELL: ColorHex = '#FFFFFF';

export type GradientDirection = 'horizontal' | 'vertical' | 'diagonal';
export type ColorMode = 'solid' | 'gradient';
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface GradientConfig {
  mode: ColorMode;
  foreground: ColorHex;
  stops: ColorHex[];
  direction: GradientDirection;
}

export interface CreativeGrid {
  grid: ColorHex[][];
  width: number;
  height: number;
  /** 生成过程中的提示，例如自动加宽画布 */
  note?: string;
}

export type BuildResult =
  | { ok: true; value: CreativeGrid }
  | { ok: false; error: string };

export interface QrBuildOptions {
  content: string;
  errorCorrectionLevel: ErrorCorrectionLevel;
  /** 静区宽度（码点）：保证可扫性 */
  quietZone: number;
  /** 每个码点占几颗豆 */
  scale: number;
  foreground: GradientConfig;
  background: ColorHex;
}

export interface TextBuildOptions {
  text: string;
  font: TextFontOption;
  bold: boolean;
  widthBeads: number;
  lineHeight: number;
  /** 覆盖度阈值，越高字越细 */
  threshold: number;
  foreground: GradientConfig;
  background: ColorHex;
}

export type TextFontKind = 'bitmap' | 'canvas';
export type TextFontGroup = '像素字' | '系统字体';

export interface TextFontOption {
  id: string;
  label: string;
  group: TextFontGroup;
  kind: TextFontKind;
  /** 点阵字体：对应内置字形表 id */
  bitmapId?: string;
  /** canvas 字体：CSS font-family */
  family?: string;
  /** canvas 字体：按豆格硬阈值渲染，边缘方正、适合拼豆 */
  pixelated?: boolean;
}

export const TEXT_FONT_OPTIONS: TextFontOption[] = [
  { id: 'pixel-5x7', label: '像素 5×7', group: '像素字', kind: 'bitmap', bitmapId: 'pixel-5x7' },
  { id: 'pixel-3x5', label: '像素 3×5', group: '像素字', kind: 'bitmap', bitmapId: 'pixel-3x5' },
  {
    id: 'pixel-sans',
    label: '中文像素·黑体',
    group: '像素字',
    kind: 'canvas',
    pixelated: true,
    family: '"PingFang SC","Microsoft YaHei","Noto Sans SC",system-ui,sans-serif',
  },
  {
    id: 'pixel-serif',
    label: '中文像素·宋体',
    group: '像素字',
    kind: 'canvas',
    pixelated: true,
    family: '"Songti SC","SimSun","Noto Serif SC",serif',
  },
  {
    id: 'sans',
    label: '黑体',
    group: '系统字体',
    kind: 'canvas',
    family: '"PingFang SC","Microsoft YaHei","Noto Sans SC",system-ui,sans-serif',
  },
  {
    id: 'serif',
    label: '宋体',
    group: '系统字体',
    kind: 'canvas',
    family: '"Songti SC","SimSun","Noto Serif SC",serif',
  },
  {
    id: 'kai',
    label: '楷体',
    group: '系统字体',
    kind: 'canvas',
    family: '"Kaiti SC",KaiTi,"STKaiti",cursive',
  },
  {
    id: 'mono',
    label: '等宽',
    group: '系统字体',
    kind: 'canvas',
    family: '"Menlo","Consolas","Courier New",monospace',
  },
];

export function getTextFont(id: string): TextFontOption {
  return TEXT_FONT_OPTIONS.find((option) => option.id === id) ?? TEXT_FONT_OPTIONS[0];
}

export const GRADIENT_PRESETS: Array<{ name: string; stops: ColorHex[] }> = [
  { name: '日落', stops: ['#F97316', '#EF4444'] },
  { name: '海洋', stops: ['#38BDF8', '#4F46E5'] },
  { name: '莓果', stops: ['#F472B6', '#7C3AED'] },
  { name: '抹茶', stops: ['#84CC16', '#059669'] },
  { name: '霓虹', stops: ['#22D3EE', '#A855F7', '#EC4899'] },
  { name: '彩虹', stops: ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6'] },
  { name: '极光', stops: ['#2DD4BF', '#6366F1', '#E879F9'] },
];

export const SOLID_SWATCHES: ColorHex[] = [
  '#111827', '#475569', '#EF4444', '#F97316',
  '#F59E0B', '#22C55E', '#14B8A6', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
];

export function normalizeHex(input: string, fallback: ColorHex = '#000000'): ColorHex {
  const match = /^#?([0-9a-f]{6})$/i.exec((input ?? '').trim());
  return match ? `#${match[1]}`.toUpperCase() : fallback;
}

function mixHex(a: ColorHex, b: ColorHex, t: number): ColorHex {
  const ca = hexToRgb(a) ?? { r: 0, g: 0, b: 0 };
  const cb = hexToRgb(b) ?? { r: 255, g: 255, b: 255 };
  const ratio = Math.max(0, Math.min(1, t));
  const channel = (x: number, y: number) =>
    Math.round(x + (y - x) * ratio).toString(16).padStart(2, '0');
  return `#${channel(ca.r, cb.r)}${channel(ca.g, cb.g)}${channel(ca.b, cb.b)}`.toUpperCase();
}

export function gradientColorAt(stops: ColorHex[], t: number): ColorHex {
  const clean = stops.filter(Boolean).map((s) => normalizeHex(s));
  if (clean.length === 0) return '#000000';
  if (clean.length === 1) return clean[0];
  const clamped = Math.max(0, Math.min(1, t));
  const scaled = clamped * (clean.length - 1);
  const index = Math.min(Math.floor(scaled), clean.length - 2);
  return mixHex(clean[index], clean[index + 1], scaled - index);
}

export function gradientProgress(
  row: number,
  col: number,
  width: number,
  height: number,
  direction: GradientDirection,
): number {
  if (direction === 'vertical') {
    return height <= 1 ? 0 : row / (height - 1);
  }
  if (direction === 'diagonal') {
    const span = width + height - 2;
    return span <= 0 ? 0 : (row + col) / span;
  }
  return width <= 1 ? 0 : col / (width - 1);
}

/** 依据前景配置取某个格子应使用的颜色 */
export function resolveStrokeColor(
  config: GradientConfig,
  row: number,
  col: number,
  width: number,
  height: number,
): ColorHex {
  if (config.mode === 'gradient' && config.stops.length > 0) {
    return gradientColorAt(
      config.stops,
      gradientProgress(row, col, width, height, config.direction),
    );
  }
  return normalizeHex(config.foreground, '#111827');
}

function relativeLuminance(hex: ColorHex): number {
  const rgb = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
  const linear = [rgb.r, rgb.g, rgb.b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/** WCAG 对比度，用于提示二维码是否可能扫不出来 */
export function contrastRatio(a: ColorHex, b: ColorHex): number {
  const l1 = relativeLuminance(normalizeHex(a));
  const l2 = relativeLuminance(normalizeHex(b));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** 二维码中所有前景色的平均对比度 */
export function averageForegroundContrast(config: GradientConfig, background: ColorHex): number {
  const samples =
    config.mode === 'gradient' && config.stops.length > 1
      ? config.stops
      : [config.mode === 'gradient' ? config.stops[0] ?? config.foreground : config.foreground];
  if (samples.length === 0) return 0;
  const total = samples.reduce((sum, color) => sum + contrastRatio(color, background), 0);
  return total / samples.length;
}

export function buildQrGrid(options: QrBuildOptions): BuildResult {
  const content = options.content.trim();
  if (!content) return { ok: false, error: '先输入网址或文字内容' };

  try {
    const matrix = createQrMatrix(content, options.errorCorrectionLevel);
    const moduleCount = matrix.count;
    const quiet = Math.max(0, Math.min(8, Math.round(options.quietZone)));
    const scale = Math.max(1, Math.min(8, Math.round(options.scale)));
    const modules = moduleCount + quiet * 2;
    const size = modules * scale;
    if (size > 400) return { ok: false, error: '尺寸过大，请降低豆数或静区宽度' };

    const background = normalizeHex(options.background, EMPTY_CELL);
    const grid: ColorHex[][] = [];
    for (let y = 0; y < size; y++) {
      const row: ColorHex[] = [];
      const moduleRow = Math.floor(y / scale) - quiet;
      for (let x = 0; x < size; x++) {
        const moduleCol = Math.floor(x / scale) - quiet;
        const isDark =
          moduleRow >= 0 && moduleRow < moduleCount &&
          moduleCol >= 0 && moduleCol < moduleCount &&
          matrix.isDark(moduleRow, moduleCol);
        row.push(
          isDark
            ? resolveStrokeColor(options.foreground, y, x, size, size)
            : background,
        );
      }
      grid.push(row);
    }
    return { ok: true, value: { grid, width: size, height: size } };
  } catch (error) {
    console.error('二维码生成失败:', error);
    return { ok: false, error: '内容太长，无法生成二维码，请精简后重试' };
  }
}

export function buildTextGrid(options: TextBuildOptions): BuildResult {
  if (options.font.kind === 'bitmap') {
    return buildBitmapTextGrid(options);
  }
  return buildCanvasTextGrid(options);
}

/** 内置点阵字体：字形直接按豆格盖章，边缘天然对齐 */
function buildBitmapTextGrid(options: TextBuildOptions): BuildResult {
  const font = getBitmapFont(options.font.bitmapId ?? '');
  if (!font) return { ok: false, error: '像素字体数据缺失' };
  if (!options.text.trim()) return { ok: false, error: '先输入要生成的字' };

  const lines = options.text.replace(/\r/g, '').split('\n');
  let widthBeads = Math.max(4, Math.min(200, Math.round(options.widthBeads)));
  const paddingBeads = 1;
  let contentWidthBeads = Math.max(1, widthBeads - paddingBeads * 2);

  const widestLine = Math.max(
    1,
    ...lines.map((line) => measureGlyphLine(font, line)),
  );
  // 字形可以整体放大，保证铺满设定宽度；始终保持整数倍，边缘依旧是方块
  const scale = Math.max(1, Math.floor(contentWidthBeads / widestLine));
  let note: string | undefined;
  if (widestLine * scale > contentWidthBeads) {
    // 1 颗豆 1 个点都放不下时自动加宽，避免文字被裁掉
    const neededWidth = widestLine + paddingBeads * 2;
    if (neededWidth > 200) {
      return { ok: false, error: '文字太长放不下，请减少文字或换成多行' };
    }
    widthBeads = Math.max(widthBeads, neededWidth);
    contentWidthBeads = Math.max(1, widthBeads - paddingBeads * 2);
    note = `文字较宽，画布已自动加宽到 ${widthBeads} 颗豆`;
  }
  const lineGapPixels = Math.round(font.glyphHeight * Math.max(0, options.lineHeight - 1));
  const blockRows =
    lines.length * font.glyphHeight + Math.max(0, lines.length - 1) * lineGapPixels;
  const heightBeads = blockRows * scale + paddingBeads * 2;

  if (heightBeads > 280 || widthBeads * heightBeads > 60000) {
    return { ok: false, error: '内容太多，请减少文字或调小宽度' };
  }

  const background = normalizeHex(options.background, EMPTY_CELL);
  const grid: ColorHex[][] = Array.from({ length: heightBeads }, () =>
    Array<ColorHex>(widthBeads).fill(background),
  );

  let drawnGlyphs = 0;
  lines.forEach((line, lineIndex) => {
    const lineBeadWidth = measureGlyphLine(font, line) * scale;
    const startCol = paddingBeads + Math.floor((contentWidthBeads - lineBeadWidth) / 2);
    const startRow =
      paddingBeads + lineIndex * (font.glyphHeight + lineGapPixels) * scale;
    let cursorCol = startCol;

    for (const char of line) {
      const glyph = getGlyph(font, char);
      if (!glyph) {
        cursorCol += (font.glyphWidth + font.spacing) * scale;
        continue;
      }
      drawnGlyphs += 1;
      for (let gy = 0; gy < font.glyphHeight; gy++) {
        const glyphRow = glyph[gy] ?? '';
        for (let gx = 0; gx < font.glyphWidth; gx++) {
          if (glyphRow[gx] !== '#') continue;
          for (let sy = 0; sy < scale; sy++) {
            const row = startRow + gy * scale + sy;
            if (row < 0 || row >= heightBeads) continue;
            for (let sx = 0; sx < scale; sx++) {
              const col = cursorCol + gx * scale + sx;
              if (col < 0 || col >= widthBeads) continue;
              grid[row][col] = resolveStrokeColor(
                options.foreground,
                row,
                col,
                heightBeads,
                widthBeads,
              );
            }
          }
        }
      }
      cursorCol += (font.glyphWidth + font.spacing) * scale;
    }
  });

  if (drawnGlyphs === 0) {
    return {
      ok: false,
      error: '这套像素字只有英文和数字，中文请选「中文像素·黑体 / 宋体」',
    };
  }

  return { ok: true, value: { grid, width: widthBeads, height: heightBeads, note } };
}

/** canvas 字体：平滑模式做高倍超采样，像素模式按豆格硬阈值切边 */
function buildCanvasTextGrid(options: TextBuildOptions): BuildResult {
  const lines = options.text.replace(/\r/g, '').split('\n');
  if (!options.text.trim()) return { ok: false, error: '先输入要生成的字' };

  const widthBeads = Math.max(4, Math.min(200, Math.round(options.widthBeads)));
  const family = options.font.family ?? 'sans-serif';
  const pixelated = Boolean(options.font.pixelated);
  // 超采样：先高分辨率绘制文字，再按豆格求平均覆盖度。
  // 像素模式用较低倍率，让每个豆格只落到少数几个采样点，边缘更方正。
  const supersample = pixelated ? 4 : widthBeads <= 72 ? 8 : 4;
  const paddingBeads = 1;
  const lineHeightMul = Math.max(0.8, Math.min(2.4, options.lineHeight));
  const threshold = Math.max(0.05, Math.min(0.9, options.threshold));
  // 像素模式要求多数采样点命中，避免抗锯齿灰边把字形糊大
  const coverageCut = pixelated ? Math.max(threshold, 0.5) : threshold;
  const weightPrefix = options.bold ? 'bold ' : '';

  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  if (!measureCtx) return { ok: false, error: '当前环境不支持文字绘图' };

  const REFERENCE_SIZE = 100;
  measureCtx.font = `${weightPrefix}${REFERENCE_SIZE}px ${family}`;
  const widest = Math.max(
    1,
    ...lines.map((line) => measureCtx.measureText(line.length ? line : ' ').width),
  );

  const contentWidthBeads = Math.max(1, widthBeads - paddingBeads * 2);
  const fontSize = Math.max(4, (REFERENCE_SIZE * contentWidthBeads * supersample) / widest);
  const lineGap = fontSize * (lineHeightMul - 1);
  const gap = Math.max(0, lineGap);
  const blockHeight = lines.length * fontSize + Math.max(0, lines.length - 1) * gap;
  const padPx = paddingBeads * supersample;
  const heightBeads = Math.max(2, Math.ceil((blockHeight + padPx * 2) / supersample));

  if (heightBeads > 260 || widthBeads * heightBeads > 40000) {
    return { ok: false, error: '内容太多，请减少文字或调小宽度' };
  }

  const canvas = document.createElement('canvas');
  canvas.width = widthBeads * supersample;
  canvas.height = heightBeads * supersample;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { ok: false, error: '当前环境不支持文字绘图' };

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${weightPrefix}${fontSize}px ${family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';

  const startY =
    padPx +
    Math.max(0, (canvas.height - padPx * 2 - blockHeight) / 2) +
    fontSize / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, startY + index * (fontSize + gap));
  });

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const background = normalizeHex(options.background, EMPTY_CELL);
  const blockArea = supersample * supersample;
  const grid: ColorHex[][] = [];

  for (let by = 0; by < heightBeads; by++) {
    const row: ColorHex[] = [];
    for (let bx = 0; bx < widthBeads; bx++) {
      let alphaSum = 0;
      for (let y = 0; y < supersample; y++) {
        const py = by * supersample + y;
        const rowOffset = py * canvas.width;
        for (let x = 0; x < supersample; x++) {
          alphaSum += pixels[(rowOffset + bx * supersample + x) * 4 + 3];
        }
      }
      const coverage = alphaSum / (blockArea * 255);
      row.push(
        coverage >= coverageCut
          ? resolveStrokeColor(options.foreground, by, bx, heightBeads, widthBeads)
          : background,
      );
    }
    grid.push(row);
  }

  return { ok: true, value: { grid, width: widthBeads, height: heightBeads } };
}

/** 把拼豆网格画到预览画布上，按给定像素框等比缩放 */
export function renderGridPreview(
  canvas: HTMLCanvasElement,
  grid: ColorHex[][],
  boxSize: number,
): void {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (!rows || !cols) return;

  const cell = Math.max(1, Math.floor(boxSize / Math.max(rows, cols)));
  const cssWidth = cols * cell;
  const cssHeight = rows * cell;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = grid[r][c];
      if (!color || color === EMPTY_CELL || color === 'transparent') continue;
      ctx.fillStyle = color;
      ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  }
}

/** 导出当前生成的图纸为 PNG，方便直接打印 */
export function exportGridToPng(grid: ColorHex[][], fileName: string, cellSize = 16): void {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (!rows || !cols) return;

  const canvas = document.createElement('canvas');
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = grid[r][c];
      if (!color || color === EMPTY_CELL || color === 'transparent') continue;
      ctx.fillStyle = color;
      ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
    }
  }

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = fileName;
  link.click();
}
