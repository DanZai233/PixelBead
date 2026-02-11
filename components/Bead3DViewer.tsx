import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { PixelStyle } from '../types';

interface Bead3DViewerProps {
  grid: string[][];
  gridSize: number;
  zoom: number;
  pixelStyle: PixelStyle;
  showGridLines: boolean;
  layers: number;
  onLayerCountChange: (layers: number) => void;
}

export const Bead3DViewer: React.FC<Bead3DViewerProps> = ({
  grid,
  gridSize,
  zoom: propZoom,
  pixelStyle,
  showGridLines,
  layers,
  onLayerCountChange,
}) => {
  const [rotationX, setRotationX] = useState(-25);
  const [rotationY, setRotationY] = useState(-35);
  const [isDragging, setIsDragging] = useState(false);
  const [displayRotationX, setDisplayRotationX] = useState(-25);
  const [displayRotationY, setDisplayRotationY] = useState(-35);
  const [zoom3D, setZoom3D] = useState(1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: -25, y: -35 });

  const baseBeadSize = 28;
  const cellSize = Math.max(8, Math.floor(baseBeadSize * (propZoom / 100) * 1.5));
  const layerHeight = cellSize * 0.4;
  const totalHeight = layers * layerHeight;
  
  const isometricProjection = useCallback((x: number, y: number, z: number) => {
    const angleX = (displayRotationX * Math.PI) / 180;
    const angleY = (displayRotationY * Math.PI) / 180;
    
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);
    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;
    const y1 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;
    
    return { x: x1, y: y1, z: z2 };
  }, [displayRotationX, displayRotationY]);

  const coloredPixels = useMemo(() => {
    const pixels: { row: number; col: number; color: string; z: number }[] = [];
    for (let layer = 0; layer < layers; layer++) {
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const color = grid[row][col];
          const isTransparent = color === 'transparent' || color === '#FFFFFF' || color === '';
          if (!isTransparent) {
            pixels.push({ row, col, color, z: layer * layerHeight });
          }
        }
      }
    }
    return pixels;
  }, [grid, gridSize, layers, layerHeight]);

  const drawBead = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    style: PixelStyle
  ) => {
    ctx.fillStyle = color;
    
    switch (style) {
      case PixelStyle.CIRCLE:
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case PixelStyle.ROUNDED:
        const radius = size / 4;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, size, size, radius);
        } else {
          ctx.rect(x, y, size, size);
        }
        ctx.fill();
        break;
      case PixelStyle.SQUARE:
      default:
        ctx.fillRect(x, y, size, size);
        break;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const modelWidth = gridSize * cellSize * 2;
    const modelHeight = gridSize * cellSize * 1.5 + totalHeight;
    
    const scaleX = (width * 0.8) / modelWidth;
    const scaleY = (height * 0.8) / modelHeight;
    const autoScale = Math.min(scaleX, scaleY, 2);
    const scale = autoScale * zoom3D;

    const sortedPixels = coloredPixels
      .map(p => {
        const projected = isometricProjection(
          p.col * cellSize - (gridSize * cellSize) / 2,
          p.row * cellSize - (gridSize * cellSize) / 2,
          p.z
        );
        return { ...p, projected };
      })
      .sort((a, b) => a.projected.z - b.projected.z);

    const offsetX = width / 2;
    const offsetY = height / 2;

    ctx.clearRect(0, 0, width, height);

    sortedPixels.forEach(p => {
      const x = p.projected.x * scale + offsetX;
      const y = p.projected.y * scale + offsetY;
      const scaledCellSize = cellSize * scale;
      drawBead(ctx, x, y, scaledCellSize, p.color, pixelStyle);
      
      const brightness = Math.max(0.6, 1 - (p.projected.z / (totalHeight + 100)) * 0.4);
      ctx.fillStyle = `rgba(0, 0, 0, ${(1 - brightness) * 0.3})`;
      ctx.fillRect(x, y, scaledCellSize, scaledCellSize);
    });

  }, [coloredPixels, isometricProjection, cellSize, gridSize, pixelStyle, totalHeight, drawBead]);

  useEffect(() => {
    const animate = () => {
      setDisplayRotationX(prev => {
        const diff = targetRotationRef.current.x - prev;
        if (Math.abs(diff) < 0.1) return targetRotationRef.current.x;
        return prev + diff * 0.1;
      });
      setDisplayRotationY(prev => {
        const diff = targetRotationRef.current.y - prev;
        if (Math.abs(diff) < 0.1) return targetRotationRef.current.y;
        return prev + diff * 0.1;
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastMouseRef.current.x;
    const deltaY = e.clientY - lastMouseRef.current.y;
    
    targetRotationRef.current.y += deltaX * 0.5;
    targetRotationRef.current.x = Math.max(-90, Math.min(90, targetRotationRef.current.x - deltaY * 0.5));
    
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom3D(prev => Math.max(0.3, Math.min(3, prev + delta)));
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div
          ref={containerRef}
          className="relative w-full h-full"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
          />
        </div>
      </div>

      <div className="bg-white border-t border-slate-200 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-slate-400">缩放</span>
          <div className="flex items-center gap-2 flex-1 max-w-[200px]">
            <button
              onClick={() => setZoom3D(prev => Math.max(0.3, prev - 0.1))}
              className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-black transition-all"
            >
              -
            </button>
            <input
              type="range"
              min="0.3"
              max="3"
              step="0.1"
              value={zoom3D}
              onChange={(e) => setZoom3D(parseFloat(e.target.value))}
              className="flex-1 h-2 accent-indigo-600"
            />
            <button
              onClick={() => setZoom3D(prev => Math.min(3, prev + 0.1))}
              className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-black transition-all"
            >
              +
            </button>
          </div>
          <span className="w-12 text-center font-black text-indigo-600">{Math.round(zoom3D * 100)}%</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-slate-400">层数控制</span>
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

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {targetRotationRef.current = { x: -25, y: -35 };}}
            className="px-2 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black hover:bg-indigo-100 transition-all"
          >
            默认视角
          </button>
          <button
            onClick={() => {targetRotationRef.current = { x: 0, y: 0 };}}
            className="px-2 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black hover:bg-slate-100 transition-all"
          >
            俯视
          </button>
          <button
            onClick={() => {targetRotationRef.current = { x: 90, y: 0 };}}
            className="px-2 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black hover:bg-slate-100 transition-all"
          >
            侧视
          </button>
        </div>

        <p className="text-[9px] text-slate-400 text-center">拖拽旋转 | 滚轮缩放 | 性能优化中</p>
      </div>
    </div>
  );
};
