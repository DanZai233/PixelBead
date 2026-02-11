import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { PixelStyle } from '../types';

interface BeadSliceViewerProps {
  grid: string[][];
  gridSize: number;
  zoom: number;
  pixelStyle: PixelStyle;
  showGridLines: boolean;
  layers: number;
  onLayerCountChange: (layers: number) => void;
}

const LayerThumbnail = React.memo(({ 
  layerIndex, 
  selectedLayer, 
  onSelect, 
  gridSize 
}: { 
  layerIndex: number; 
  selectedLayer: number; 
  onSelect: (idx: number) => void;
  gridSize: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 80 * dpr;
    canvas.height = 80 * dpr;
    
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, 80, 80);
    
    const cellSize = 80 / gridSize;
    
    if (layerIndex < selectedLayer) {
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(0, 0, 80, 80);
    } else if (layerIndex === selectedLayer) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.fillRect(0, 0, 80, 80);
    } else {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.fillRect(0, 0, 80, 80);
    }
  }, [layerIndex, selectedLayer, gridSize]);

  return (
    <button
      onClick={() => onSelect(layerIndex)}
      className={`p-2 rounded-lg border-2 transition-all ${
        layerIndex === selectedLayer
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-slate-200 bg-slate-50 hover:border-indigo-300'
      }`}
    >
      <div className="text-[10px] font-black text-slate-800 mb-1">第 {layerIndex + 1} 层</div>
      <canvas
        ref={canvasRef}
        className="w-full aspect-square rounded bg-white"
        width={80}
        height={80}
      />
    </button>
  );
});

LayerThumbnail.displayName = 'LayerThumbnail';

export const BeadSliceViewer: React.FC<BeadSliceViewerProps> = ({
  grid,
  gridSize,
  zoom: propZoom,
  pixelStyle,
  showGridLines,
  layers,
  onLayerCountChange,
}) => {
  const [selectedLayer, setSelectedLayer] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const baseBeadSize = 28;
  const cellSize = baseBeadSize * (propZoom / 100);

  const coloredPixels = useMemo(() => {
    const pixels: { row: number; col: number; color: string }[] = [];
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const color = grid[row][col];
        const isTransparent = color === 'transparent' || color === '#FFFFFF' || color === '';
        if (!isTransparent) {
          pixels.push({ row, col, color });
        }
      }
    }
    return pixels;
  }, [grid, gridSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = gridSize * cellSize;
    const height = gridSize * cellSize;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const color = grid[row][col];
        const isTransparent = color === 'transparent' || color === '#FFFFFF' || color === '';

        if (isTransparent) {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
          if (showGridLines) {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
            ctx.lineWidth = 1;
          }
        } else if (selectedLayer === 0) {
          ctx.fillStyle = color;
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.lineWidth = 1;
        } else {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
          if (showGridLines) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.lineWidth = 1;
          }
        }

        const x = col * cellSize;
        const y = row * cellSize;

        switch (pixelStyle) {
          case PixelStyle.CIRCLE:
            ctx.beginPath();
            ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          case PixelStyle.ROUNDED:
            const radius = cellSize / 4;
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(x, y, cellSize, cellSize, radius);
            } else {
              ctx.rect(x, y, cellSize, cellSize);
            }
            ctx.fill();
            break;
          case PixelStyle.SQUARE:
          default:
            ctx.fillRect(x, y, cellSize, cellSize);
            break;
        }

        if (showGridLines) {
          ctx.strokeRect(x, y, cellSize, cellSize);
        }
      }
    }
  }, [grid, gridSize, cellSize, pixelStyle, showGridLines, selectedLayer]);

  const handlePrevLayer = useCallback(() => {
    setSelectedLayer(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextLayer = useCallback(() => {
    setSelectedLayer(prev => Math.min(layers - 1, prev + 1));
  }, [layers]);

  const handleSelectLayer = useCallback((idx: number) => {
    setSelectedLayer(idx);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm">
          <span className="text-[10px] font-black uppercase text-slate-400">当前查看层级</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevLayer}
              className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-black transition-all"
            >
              -
            </button>
            <span className="w-20 text-center font-black text-indigo-600">第 {selectedLayer + 1} 层</span>
            <button
              onClick={handleNextLayer}
              className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-black transition-all"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative border border-slate-200 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="block"
            />
            <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-black text-slate-800 shadow-sm pointer-events-none">
              第 {selectedLayer + 1} 层 · {coloredPixels.length} 颗
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3">所有层级预览</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {[...Array(layers)].map((_, layerIndex) => (
              <LayerThumbnail
                key={layerIndex}
                layerIndex={layerIndex}
                selectedLayer={selectedLayer}
                onSelect={handleSelectLayer}
                gridSize={gridSize}
              />
            ))}
          </div>
        </div>

        <div className="bg-indigo-50 p-4 rounded-xl">
          <h3 className="text-[10px] font-black uppercase text-indigo-400 mb-2">使用说明</h3>
          <ul className="text-[10px] text-slate-600 space-y-1">
            <li>• 点击上方按钮切换查看不同层级</li>
            <li>• 底部预览可快速跳转到任意层级</li>
            <li>• 灰色格子表示已完成层级</li>
            <li>• 浅色格子表示未完成层级</li>
            <li>• 当前显示的拼豆数量</li>
          </ul>
        </div>
      </div>

      <div className="bg-white border-t border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-slate-400">总层数</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onLayerCountChange(Math.max(1, layers - 1))}
              className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-black transition-all"
            >
              -
            </button>
            <span className="w-12 text-center font-black text-slate-800">{layers}</span>
            <button
              onClick={() => onLayerCountChange(Math.min(20, layers + 1))}
              className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-black transition-all"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
