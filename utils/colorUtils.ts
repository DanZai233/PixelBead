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
  gridWidth: number;
  gridHeight: number;
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED';
  colorSystem?: string;
  colorSystemMapping?: Record<string, Record<string, string>>;
  showGuideLines?: boolean;
  mirror?: boolean;
}

function loadLogo(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load logo'));
    img.src = '/logo.jpg';
  });
}

export async function generateExportImage(data: ExportImageData): Promise<HTMLCanvasElement> {
  const { grid, gridWidth, gridHeight, pixelStyle, colorSystem, colorSystemMapping, showGuideLines, mirror } = data;

  const mirroredGrid = mirror ? grid.map(row => [...row].reverse()) : grid;
  const uniqueColors = getUniqueColors(mirroredGrid);
  
  const cellSize = 30;
  const headerHeight = 60;
  const gridOffsetY = headerHeight;
  const canvasWidth = gridWidth * cellSize;
  const canvasHeight = gridHeight * cellSize + 60 + headerHeight;
  
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
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasWidth, headerHeight);
  
  ctx.strokeStyle = '#E5E7EB';
  ctx.beginPath();
  ctx.moveTo(0, headerHeight);
  ctx.lineTo(canvasWidth, headerHeight);
  ctx.stroke();
  
  let logo: HTMLImageElement | null = null;
  try {
    logo = await loadLogo();
  } catch (error) {
    console.warn('Failed to load logo:', error);
  }
  
  if (logo) {
    const logoSize = 40;
    ctx.drawImage(logo, 15, 10, logoSize, logoSize);
  }
  
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('拼豆糕手', logo ? 65 : 15, 30);
  
  ctx.fillStyle = '#64748B';
  ctx.font = '12px Arial';
  ctx.fillText('pindou.danzaii.cn', logo ? 65 : 15, 48);
  
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      const color = mirroredGrid[row][col];
      const x = col * cellSize;
      const y = gridOffsetY + row * cellSize;
      
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
  
  if (showGuideLines) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    for (let i = 5; i < gridWidth; i += 5) {
      const pos = i * cellSize;
      ctx.beginPath();
      ctx.moveTo(pos, gridOffsetY);
      ctx.lineTo(pos, gridOffsetY + gridHeight * cellSize);
      ctx.stroke();
    }

    for (let i = 5; i < gridHeight; i += 5) {
      const pos = i * cellSize;
      ctx.beginPath();
      ctx.moveTo(0, gridOffsetY + pos);
      ctx.lineTo(gridWidth * cellSize, gridOffsetY + pos);
      ctx.stroke();
    }
  }

  const legendY = gridOffsetY + gridHeight * cellSize + 15;
  const legendHeight = 22;
  const itemGap = 5;
  const barPadding = 15;
  const barWidth = canvasWidth - barPadding * 2;
  const barX = barPadding;
  
  if (uniqueColors.length > 0) {
    const colorCountMap = new Map<ColorHex, number>();
    
    grid.forEach(row => {
      row.forEach(color => {
        if (color && color !== '#FFFFFF') {
          colorCountMap.set(color, (colorCountMap.get(color) || 0) + 1);
        }
      });
    });
    
    const itemsWithCounts = uniqueColors.map(color => ({
      color,
      count: colorCountMap.get(color) || 0,
      label: allColorsAreHex ? '' : colorSystem && colorSystemMapping && colorSystemMapping[color.toUpperCase()]?.[colorSystem] || color
    })).filter(item => item.count > 0);
    
    const itemWidth = Math.min(85, Math.max(55, (barWidth - (itemsWithCounts.length - 1) * itemGap) / itemsWithCounts.length));
    const itemsPerRow = Math.floor((barWidth + itemGap) / (itemWidth + itemGap));
    const rowsCount = Math.ceil(itemsWithCounts.length / itemsPerRow);
    
    const itemsPerActualRow = itemsPerRow > 0 ? Math.ceil(itemsWithCounts.length / rowsCount) : itemsWithCounts.length;
    const rowWidth = itemsPerActualRow * itemWidth + (itemsPerActualRow - 1) * itemGap;
    const startX = barX + (barWidth - rowWidth) / 2;
    
    for (let row = 0; row < rowsCount; row++) {
      const y = legendY + row * (legendHeight + itemGap);
      
      for (let col = 0; col < itemsPerRow; col++) {
        const index = row * itemsPerRow + col;
        if (index >= itemsWithCounts.length) break;
        
        const item = itemsWithCounts[index];
        const x = startX + col * (itemWidth + itemGap);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x - 3, y - 3, itemWidth + 6, legendHeight + 6);
        
        ctx.fillStyle = item.color;
        roundRect(ctx, x, y, itemWidth, legendHeight, legendHeight / 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = getContrastColor(item.color);
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        const labelX = x + 6;
        const countX = x + itemWidth - 4;
        
        if (item.label && !allColorsAreHex) {
          ctx.fillText(item.label, labelX, y + legendHeight / 2 - 1);
        }
        
        ctx.font = 'bold 7px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(item.count.toString(), countX, y + legendHeight / 2 - 1);
      }
    }
    
    const totalLegendHeight = rowsCount * (legendHeight + itemGap) + 10;
    const requiredHeight = gridOffsetY + gridHeight * cellSize + totalLegendHeight + 10;
    if (requiredHeight > canvasHeight) {
      const newHeight = requiredHeight;
      const newCanvas = document.createElement('canvas');
      newCanvas.width = canvasWidth;
      newCanvas.height = newHeight;
      const newCtx = newCanvas.getContext('2d')!;
      newCtx.fillStyle = '#FFFFFF';
      newCtx.fillRect(0, 0, canvasWidth, newHeight);
      newCtx.drawImage(canvas, 0, 0);
      return newCanvas;
    }
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