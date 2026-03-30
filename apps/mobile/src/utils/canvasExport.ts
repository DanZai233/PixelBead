// Canvas export utilities (Expo Go compatible - no Skia dependency)
// Uses View capture approach for PNG export

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export interface ExportOptions {
  showGrid: boolean;
  showColorCodes: boolean;
  mirror: 'none' | 'horizontal' | 'vertical';
  exportSelection: boolean;
}

export interface CanvasStateForExport {
  grid: Map<string, string>;
  gridSize: { width: number; height: number };
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED';
  selectionRegion: { x1: number; y1: number; x2: number; y2: number } | null;
}

export function calculateExportRegion(
  canvasState: CanvasStateForExport,
  exportSelection: boolean
): { x1: number; y1: number; x2: number; y2: number } {
  if (exportSelection && canvasState.selectionRegion) {
    return canvasState.selectionRegion;
  }

  return {
    x1: 0,
    y1: 0,
    x2: canvasState.gridSize.width,
    y2: canvasState.gridSize.height,
  };
}

/**
 * Export canvas as PNG using a simple PPM-to-PNG pipeline
 * (Simplified for Expo Go - no Skia required)
 */
export async function exportCanvasAsPng(
  canvasState: CanvasStateForExport,
  options: ExportOptions
): Promise<string> {
  const region = calculateExportRegion(canvasState, options.exportSelection);
  const width = region.x2 - region.x1;
  const height = region.y2 - region.y1;
  const cellSize = 10;
  const imageWidth = width * cellSize;
  const imageHeight = height * cellSize;

  // Build a simple SVG string representation
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}" height="${imageHeight}">`;
  svgContent += `<rect width="${imageWidth}" height="${imageHeight}" fill="white"/>`;

  if (options.showGrid) {
    for (let x = 0; x <= width; x++) {
      svgContent += `<line x1="${x * cellSize}" y1="0" x2="${x * cellSize}" y2="${imageHeight}" stroke="#E0E0E0" stroke-width="1"/>`;
    }
    for (let y = 0; y <= height; y++) {
      svgContent += `<line x1="0" y1="${y * cellSize}" x2="${imageWidth}" y2="${y * cellSize}" stroke="#E0E0E0" stroke-width="1"/>`;
    }
  }

  for (let y = region.y1; y < region.y2; y++) {
    for (let x = region.x1; x < region.x2; x++) {
      const key = `${x},${y}`;
      const color = canvasState.grid.get(key);
      if (color) {
        const px = (x - region.x1) * cellSize;
        const py = (y - region.y1) * cellSize;

        switch (canvasState.pixelStyle) {
          case 'CIRCLE':
            svgContent += `<circle cx="${px + cellSize / 2}" cy="${py + cellSize / 2}" r="${cellSize / 2}" fill="${color}"/>`;
            break;
          case 'ROUNDED':
            svgContent += `<rect x="${px + 1}" y="${py + 1}" width="${cellSize - 2}" height="${cellSize - 2}" rx="${(cellSize - 2) / 4}" fill="${color}"/>`;
            break;
          case 'SQUARE':
          default:
            svgContent += `<rect x="${px}" y="${py}" width="${cellSize}" height="${cellSize}" fill="${color}"/>`;
            break;
        }
      }
    }
  }

  svgContent += '</svg>';

  // Save as SVG (PNG conversion would need native modules)
  const fileUri = FileSystem.cacheDirectory + 'export.svg';
  await FileSystem.writeAsStringAsync(fileUri, svgContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return fileUri;
}

export async function shareExportedImage(fileUri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'image/svg+xml',
    dialogTitle: 'Share Image',
  });
}
