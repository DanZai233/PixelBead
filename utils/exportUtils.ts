import type { ColorHex } from '../types';
import { generateExportImage, getContrastColor, getSymbol, getUniqueColors, type ExportImageData } from './colorUtils';

const TRANSPARENT = '#FFFFFF';

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, char => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  }[char] ?? char));
}

export function generateSvgExport(data: ExportImageData): Blob {
  const {
    grid, gridWidth, gridHeight, pixelStyle, colorSystem, colorSystemMapping,
    showGuideLines, mirror, startRow = 0, startCol = 0,
  } = data;
  const sourceGrid = mirror ? grid.map(row => [...row].reverse()) : grid;
  const colors = getUniqueColors(sourceGrid);
  const colorMap = new Map(colors.map((color, index) => [color, index]));
  const allColorsAreHex = !colorSystem || !colorSystemMapping || colors.every(color => {
    const mapping = colorSystemMapping[color.toUpperCase()];
    return !mapping || !mapping[colorSystem] || mapping[colorSystem].startsWith('#');
  });
  const labelFor = (color: ColorHex) => {
    if (allColorsAreHex) return getSymbol(colorMap.get(color) ?? 0);
    return colorSystem && colorSystemMapping ? colorSystemMapping[color.toUpperCase()]?.[colorSystem] || color : color;
  };

  const cell = 24;
  const margin = 42;
  const width = margin * 2 + gridWidth * cell;
  const legendHeight = colors.length > 0 ? Math.ceil(colors.length / 4) * 30 + 50 : 40;
  const height = margin * 2 + gridHeight * cell + legendHeight;
  const parts: string[] = [];

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  parts.push(`<rect width="100%" height="100%" fill="#ffffff"/>`);
  parts.push(`<text x="${margin}" y="24" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#0f172a">拼豆糕手图纸</text>`);
  parts.push(`<text x="${width - margin}" y="24" text-anchor="end" font-family="Arial, sans-serif" font-size="11" fill="#64748b">行 ${startRow + 1}-${startRow + gridHeight} · 列 ${startCol + 1}-${startCol + gridWidth}</text>`);

  for (let col = 0; col < gridWidth; col++) {
    const x = margin + col * cell + cell / 2;
    parts.push(`<text x="${x}" y="${margin - 6}" text-anchor="middle" font-family="Arial" font-size="8" fill="#475569">${startCol + col}</text>`);
  }
  for (let row = 0; row < gridHeight; row++) {
    const y = margin + row * cell + cell / 2;
    parts.push(`<text x="${margin - 6}" y="${y + 3}" text-anchor="end" font-family="Arial" font-size="8" fill="#475569">${startRow + row}</text>`);
  }

  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      const color = sourceGrid[row][col];
      const x = margin + col * cell;
      const y = margin + row * cell;
      if (color === TRANSPARENT) {
        parts.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="#ffffff" stroke="#e2e8f0" stroke-width="0.6"/>`);
        continue;
      }

      if (pixelStyle === 'CIRCLE') {
        parts.push(`<circle cx="${x + cell / 2}" cy="${y + cell / 2}" r="${cell / 2 - 1.5}" fill="${color}" stroke="#e2e8f0" stroke-width="0.6"/>`);
      } else if (pixelStyle === 'ROUNDED') {
        parts.push(`<rect x="${x + 1.5}" y="${y + 1.5}" width="${cell - 3}" height="${cell - 3}" rx="6" fill="${color}" stroke="#e2e8f0" stroke-width="0.6"/>`);
      } else {
        parts.push(`<rect x="${x + 1}" y="${y + 1}" width="${cell - 2}" height="${cell - 2}" fill="${color}" stroke="#e2e8f0" stroke-width="0.6"/>`);
      }

      const label = labelFor(color);
      if (label) {
        parts.push(`<text x="${x + cell / 2}" y="${y + cell / 2 + 3.5}" text-anchor="middle" font-family="Arial" font-size="9" font-weight="700" fill="${getContrastColor(color)}">${escapeXml(label)}</text>`);
      }
    }
  }

  if (showGuideLines) {
    for (let index = 5; index < gridWidth; index += 5) {
      const x = margin + index * cell;
      parts.push(`<line x1="${x}" y1="${margin}" x2="${x}" y2="${margin + gridHeight * cell}" stroke="#94a3b8" stroke-width="1.2"/>`);
    }
    for (let index = 5; index < gridHeight; index += 5) {
      const y = margin + index * cell;
      parts.push(`<line x1="${margin}" y1="${y}" x2="${margin + gridWidth * cell}" y2="${y}" stroke="#94a3b8" stroke-width="1.2"/>`);
    }
  }

  if (colors.length > 0) {
    parts.push(`<text x="${margin}" y="${margin + gridHeight * cell + 26}" font-family="Arial" font-size="12" font-weight="700" fill="#0f172a">色号图例</text>`);
    colors.forEach((color, index) => {
      const itemX = margin + (index % 4) * ((width - margin * 2) / 4);
      const itemY = margin + gridHeight * cell + 40 + Math.floor(index / 4) * 30;
      const count = sourceGrid.flat().filter(value => value === color).length;
      parts.push(`<rect x="${itemX}" y="${itemY}" width="16" height="16" rx="4" fill="${color}" stroke="#e2e8f0"/>`);
      parts.push(`<text x="${itemX + 22}" y="${itemY + 12}" font-family="Arial" font-size="10" fill="#334155">${escapeXml(labelFor(color))} · ${count}</text>`);
    });
  }

  parts.push('</svg>');
  return new Blob([parts.join('')], { type: 'image/svg+xml;charset=utf-8' });
}

export async function generateMultiPagePdf(data: ExportImageData): Promise<Blob> {
  const { jsPDF } = await import('jspdf');

  const sourceGrid = data.mirror ? data.grid.map(row => [...row].reverse()) : data.grid;
  const chunkColumns = Math.min(data.gridWidth, 18);
  const chunkRows = Math.min(data.gridHeight, 22);
  const chunkCountX = Math.ceil(data.gridWidth / chunkColumns);
  const chunkCountY = Math.ceil(data.gridHeight / chunkRows);
  const total = chunkCountX * chunkCountY;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let page = 0;

  for (let chunkY = 0; chunkY < chunkCountY; chunkY++) {
    for (let chunkX = 0; chunkX < chunkCountX; chunkX++) {
      const startCol = chunkX * chunkColumns;
      const startRow = chunkY * chunkRows;
      const width = Math.min(chunkColumns, data.gridWidth - startCol);
      const height = Math.min(chunkRows, data.gridHeight - startRow);
      const slice: ColorHex[][] = [];
      for (let row = startRow; row < startRow + height; row++) {
        slice.push(sourceGrid[row].slice(startCol, startCol + width));
      }

      const canvas = await generateExportImage({
        ...data,
        grid: slice,
        gridWidth: width,
        gridHeight: height,
        mirror: false,
        startRow,
        startCol,
      });

      if (page > 0) pdf.addPage();
      page++;
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, 210, 297, 'F');
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`第 ${page} / ${total} 页 · 行 ${startRow + 1}-${startRow + height} · 列 ${startCol + 1}-${startCol + width}`, 15, 14);
      pdf.text('拼豆糕手 · 打印时请选择 100% 比例', 195, 14, { align: 'right' });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 15, 20, 180, 0, undefined, 'FAST');
    }
  }

  return pdf.output('blob');
}
