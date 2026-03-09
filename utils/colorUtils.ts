import { ColorHex } from '../types';

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

export function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  if (!rgb1 || !rgb2) return Infinity;

  const hsl1 = rgbToHsl(rgb1.r, rgb1.g, rgb1.b);
  const hsl2 = rgbToHsl(rgb2.r, rgb2.g, rgb2.b);

  const dh = Math.min(Math.abs(hsl1.h - hsl2.h), 360 - Math.abs(hsl1.h - hsl2.h)) / 180;
  const ds = Math.abs(hsl1.s - hsl2.s) / 100;
  const dl = Math.abs(hsl1.l - hsl2.l) / 100;

  return dh * 2 + ds * 1 + dl * 3;
}

export const SYMBOLS = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕㉖㉗㉘㉙㉚㉛㉜㉝㉞㉟㊱㊲㊳㊴㊵㊶㊷㊸㊹㊺㊻㊼㊽㊾㊿ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ';

export function getSymbol(index: number): string {
  if (index < SYMBOLS.length) {
    return SYMBOLS[index];
  }
  return String.fromCharCode(0x2460 + (index % 50));
}

export function getUniqueColors(grid: ColorHex[][]): ColorHex[] {
  const colorSet = new Set<ColorHex>();
  grid.forEach(row => {
    row.forEach(color => {
      if (color && color !== '#FFFFFF') {
        colorSet.add(color);
      }
    });
  });
  return Array.from(colorSet);
}

export interface ExportImageData {
  grid: ColorHex[][];
  gridSize: number;
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED';
  colorSystem?: string;
  colorSystemMapping?: Record<string, Record<string, string>>;
}

export function generateExportImage(data: ExportImageData): HTMLCanvasElement {
  const { grid, gridSize, pixelStyle, colorSystem, colorSystemMapping } = data;
  
  const uniqueColors = getUniqueColors(grid);
  
  const cellSize = 30;
  const canvasWidth = gridSize * cellSize;
  const canvasHeight = gridSize * cellSize + 80;
  
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  
  const colorToSymbolIndex = new Map<ColorHex, number>();
  uniqueColors.forEach((color, index) => {
    colorToSymbolIndex.set(color, index);
  });
  
  const allColorsAreHex = !colorSystem || !colorSystemMapping || uniqueColors.every(color => {
    const mapping = colorSystemMapping[color.toUpperCase()];
    return !mapping || !mapping[colorSystem] || mapping[colorSystem].startsWith('#');
  });
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const color = grid[row][col];
      const x = col * cellSize;
      const y = row * cellSize;
      
      if (color && color !== '#FFFFFF') {
        ctx.fillStyle = color;
        
        if (pixelStyle === 'CIRCLE') {
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2 - 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (pixelStyle === 'ROUNDED') {
          roundRect(ctx, x + 2, y + 2, cellSize - 4, cellSize - 4, 6);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        }
        
        let label: string;
        if (allColorsAreHex) {
          const symbolIndex = colorToSymbolIndex.get(color) || 0;
          label = getSymbol(symbolIndex);
        } else {
          let colorLabel = color;
          if (colorSystem && colorSystemMapping) {
            const mapping = colorSystemMapping[color.toUpperCase()];
            if (mapping && mapping[colorSystem]) {
              colorLabel = mapping[colorSystem];
            }
          }
          label = colorLabel;
        }
        
        ctx.fillStyle = getContrastColor(color);
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + cellSize / 2, y + cellSize / 2);
      } else {
        ctx.strokeStyle = '#F3F4F6';
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }
  }
  
  const legendY = gridSize * cellSize + 10;
  const legendHeight = 50;
  const barWidth = canvasWidth - 20;
  const barX = 10;
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(barX, legendY, barWidth, legendHeight);
  
  if (uniqueColors.length > 0) {
    const segmentWidth = barWidth / uniqueColors.length;
    const colorCountMap = new Map<ColorHex, number>();
    
    grid.forEach(row => {
      row.forEach(color => {
        if (color && color !== '#FFFFFF') {
          colorCountMap.set(color, (colorCountMap.get(color) || 0) + 1);
        }
      });
    });
    
    uniqueColors.forEach((color, index) => {
      const x = barX + index * segmentWidth;
      const y = legendY;
      const count = colorCountMap.get(color) || 0;
      
      ctx.fillStyle = color;
      ctx.fillRect(x, y, segmentWidth, legendHeight);
      
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, segmentWidth, legendHeight);
      
      if (segmentWidth > 25) {
        ctx.fillStyle = getContrastColor(color);
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(count.toString(), x + segmentWidth / 2, y + 8);
      }
    });
  }
  
  return canvas;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function getContrastColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return '#000000';
  
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}