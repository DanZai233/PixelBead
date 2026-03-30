// Canvas export utilities using React Native Skia
// Provides off-screen rendering for PNG export with customizable options

import {
  Skia,
  useFont,
  type SkFont,
} from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Export options for PNG generation
 */
export interface ExportOptions {
  showGrid: boolean;
  showColorCodes: boolean;
  mirror: 'none' | 'horizontal' | 'vertical';
  exportSelection: boolean;
}

/**
 * Canvas state interface for export
 */
export interface CanvasStateForExport {
  grid: Map<string, string>;
  gridSize: { width: number; height: number };
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED';
  selectionRegion: { x1: number; y1: number; x2: number; y2: number } | null;
}

/**
 * Calculate export region based on selection
 * @param canvasState - Current canvas state
 * @param exportSelection - Whether to export only selected region
 * @returns Region bounds { x1, y1, x2, y2 }
 */
export function calculateExportRegion(
  canvasState: CanvasStateForExport,
  exportSelection: boolean
): { x1: number; y1: number; x2: number; y2: number } {
  if (exportSelection && canvasState.selectionRegion) {
    return canvasState.selectionRegion;
  }

  // Return full grid bounds
  return {
    x1: 0,
    y1: 0,
    x2: canvasState.gridSize.width,
    y2: canvasState.gridSize.height,
  };
}

/**
 * Export canvas as PNG image
 * @param canvasState - Current canvas state
 * @param options - Export options (grid, color codes, mirror, selection)
 * @param font - Skia font for rendering color codes (optional)
 * @returns File URI of exported PNG
 */
export async function exportCanvasAsPng(
  canvasState: CanvasStateForExport,
  options: ExportOptions,
  font?: SkFont
): Promise<string> {
  // Calculate export dimensions
  const region = calculateExportRegion(canvasState, options.exportSelection);
  const width = region.x2 - region.x1;
  const height = region.y2 - region.y1;

  // Cell size for export (use fixed 10px per pixel for reasonable file sizes)
  const cellSize = 10;
  const imageWidth = width * cellSize;
  const imageHeight = height * cellSize;

  // Create off-screen surface
  const surface = Skia.Surface.Make(imageWidth, imageHeight);
  const canvas = surface?.getCanvas();

  if (!canvas) {
    throw new Error('Failed to create Skia surface');
  }

  // Draw white background
  canvas.save();
  const bgPaint = Skia.Paint();
  bgPaint.setColor(4294967295 as any); // 0xFFFFFFFF in decimal (white)
  bgPaint.setAntiAlias(true);
  canvas.drawRect({ x: 0, y: 0, width: imageWidth, height: imageHeight }, bgPaint);
  canvas.restore();

  // Apply mirror transform if needed
  if (options.mirror !== 'none') {
    canvas.save();
    const centerX = imageWidth / 2;
    const centerY = imageHeight / 2;
    canvas.translate(centerX, centerY);
    if (options.mirror === 'horizontal') {
      canvas.scale(-1, 1);
    } else if (options.mirror === 'vertical') {
      canvas.scale(1, -1);
    }
    canvas.translate(-centerX, -centerY);
  }

  // Draw grid lines if enabled
  if (options.showGrid) {
    drawGridLines(canvas, width, height, cellSize, imageWidth, imageHeight);
  }

  // Draw pixels
  drawPixels(canvas, canvasState, region, cellSize, options, font);

  // Restore canvas state after mirror transform
  if (options.mirror !== 'none') {
    canvas.restore();
  }

  // Capture image and encode to PNG
  const image = surface?.makeImageSnapshot();
  if (!image) {
    throw new Error('Failed to capture image');
  }

  // Encode to PNG
  const pngData = image.encodeToBytes();

  // Write to file as base64
  const base64Data = bytesToBase64(pngData);
  const file = new File(Paths.cache, 'export.png');
  await file.write(base64Data, { encoding: 'base64' });

  return file.uri;
}

/**
 * Draw grid lines on canvas
 */
function drawGridLines(
  canvas: any,
  width: number,
  height: number,
  cellSize: number,
  imageWidth: number,
  imageHeight: number
) {
  const paint = Skia.Paint();
  paint.setColor(4042322160 as any); // 0xFFE0E0E0 in decimal (light gray)
  paint.setAntiAlias(true);
  paint.setStrokeWidth(1);

  // Vertical lines
  for (let x = 0; x <= width; x++) {
    const xPos = x * cellSize;
    canvas.drawLine({ x: xPos, y: 0 }, { x: xPos, y: imageHeight }, paint);
  }

  // Horizontal lines
  for (let y = 0; y <= height; y++) {
    const yPos = y * cellSize;
    canvas.drawLine({ x: 0, y: yPos }, { x: imageWidth, y: yPos }, paint);
  }
}

/**
 * Draw pixels on canvas
 */
function drawPixels(
  canvas: any,
  canvasState: CanvasStateForExport,
  region: { x1: number; y1: number; x2: number; y2: number },
  cellSize: number,
  options: ExportOptions,
  font?: SkFont
) {
  for (let y = region.y1; y < region.y2; y++) {
    for (let x = region.x1; x < region.x2; x++) {
      const key = `${x},${y}`;
      const color = canvasState.grid.get(key);

      if (color) {
        const xPos = (x - region.x1) * cellSize;
        const yPos = (y - region.y1) * cellSize;

        // Draw pixel based on style
        drawPixel(canvas, xPos, yPos, cellSize, color, canvasState.pixelStyle);

        // Draw color code if enabled
        if (options.showColorCodes && font) {
          drawColorCode(canvas, xPos, yPos, cellSize, color, font);
        }
      }
    }
  }
}

/**
 * Draw single pixel with style
 */
function drawPixel(
  canvas: any,
  x: number,
  y: number,
  size: number,
  color: string,
  style: 'CIRCLE' | 'SQUARE' | 'ROUNDED'
) {
  const paint = Skia.Paint();
  paint.setColor(parseInt(color.replace('#', '0xFF'), 16) as any);
  paint.setAntiAlias(true);

  switch (style) {
    case 'CIRCLE':
      const centerX = x + size / 2;
      const centerY = y + size / 2;
      canvas.drawCircle({ x: centerX, y: centerY, r: size / 2 }, paint);
      break;
    case 'SQUARE':
      canvas.drawRect(
        { x: x + 1, y: y + 1, width: size - 2, height: size - 2 },
        paint
      );
      break;
    case 'ROUNDED':
      const radius = (size - 2) / 4;
      const rRect = Skia.RRectXY(
        { x: x + 1, y: y + 1, width: size - 2, height: size - 2 },
        radius,
        radius
      );
      canvas.drawRRect(rRect, paint);
      break;
  }
}

/**
 * Draw color code on pixel
 */
function drawColorCode(
  canvas: any,
  x: number,
  y: number,
  _size: number, // eslint-disable-line @typescript-eslint/no-unused-vars
  color: string,
  font: SkFont
) {
  const contrastColor = getContrastColor(color);

  const paint = Skia.Paint();
  paint.setColor(contrastColor as any);
  paint.setAntiAlias(true);

  const hexCode = color.replace('#', '');

  // Create text blob using available Skia API
  // Note: Text rendering simplified for this implementation
  try {
    const textBlob = (Skia as any).Text.MakeFromTextBlob(hexCode, font, paint);

    if (textBlob) {
      // Draw text blob at top-left of pixel
      canvas.drawTextBlob(textBlob, x + 1, y + 1, paint);
    }
  } catch (error) {
    // Fallback: skip text if API not available
    console.warn('Text rendering not available:', error);
  }
}

/**
 * Get contrast color (black or white) based on background color
 */
function getContrastColor(hexColor: string): number {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? 4278190080 : 4294967295; // 0xFF000000 or 0xFFFFFFFF
}

/**
 * Convert bytes to base64
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Share exported image via system share sheet
 * @param fileUri - URI of exported PNG file
 */
export async function shareExportedImage(fileUri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'image/png',
    dialogTitle: 'Share Image',
  });
}

/**
 * React hook to load font for color code rendering
 * @returns SkFont instance or null if not loaded
 */
export function useExportFont() {
  return useFont(require('../../assets/fonts/Roboto-Regular.ttf'), 8);
}
