import React, { useRef, useEffect, useCallback, useState } from 'react';
import { PixelStyle, ColorHex } from '../types';
import colorSystemMapping from '../colorSystemMapping.json';

interface BeadPlannerViewProps {
  grid: string[][];
  gridWidth: number;
  gridHeight: number;
  pixelStyle: PixelStyle;
  selectedColorSystem: string;
  onClose: () => void;
}

export const BeadPlannerView: React.FC<BeadPlannerViewProps> = ({
  grid,
  gridWidth,
  gridHeight,
  pixelStyle,
  selectedColorSystem,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showGridLines, setShowGridLines] = useState(true);
  const [showRuler, setShowRuler] = useState(true);
  const [showGuideLines, setShowGuideLines] = useState(true);
  const [showColorKeys, setShowColorKeys] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [highlightedColor, setHighlightedColor] = useState<ColorHex | null>(null);
  const [highlightOpacity, setHighlightOpacity] = useState(90);

  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const baseBeadSize = 28;

  const stats = React.useMemo(() => {
    const counts: Record<string, number> = {};
    grid.forEach(row => {
      row.forEach(color => {
        if (color && color !== '#FFFFFF') {
          counts[color] = (counts[color] || 0) + 1;
        }
      });
    });
    return Object.entries(counts).map(([hex, count]) => ({ hex, count }))
      .sort((a, b) => b.count - a.count);
  }, [grid]);

  const getColorKey = useCallback((hex: string): string => {
    if (!showColorKeys || hex === '#FFFFFF') return '';
    const mapping = colorSystemMapping[hex];
    return mapping ? mapping[selectedColorSystem] || hex : hex;
  }, [showColorKeys, selectedColorSystem]);

  const cellSize = baseBeadSize * (zoom / 100);
  const rulerSize = showRuler ? Math.max(20, cellSize * 0.5) : 0;
  const canvasWidth = gridWidth * cellSize + rulerSize;
  const canvasHeight = gridHeight * cellSize + rulerSize;

  const drawPixel = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    isTransparent: boolean,
    colorKey: string
  ) => {
    if (isTransparent) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.strokeStyle = showGridLines ? 'rgba(148, 163, 184, 0.4)' : 'transparent';
      ctx.lineWidth = 1;
    } else {
      ctx.fillStyle = color;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
    }

    const padding = showGridLines ? (isTransparent ? 0 : 1) : 0;

    switch (pixelStyle) {
      case PixelStyle.CIRCLE:
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, (size / 2) - padding, 0, Math.PI * 2);
        ctx.fill();
        if (!isTransparent) {
          const shadowGradient = ctx.createRadialGradient(
            x + size / 2 - size / 6,
            y + size / 2 - size / 6,
            0,
            x + size / 2,
            y + size / 2,
            size / 2
          );
          shadowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
          shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
          ctx.fillStyle = shadowGradient;
          ctx.fill();
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.stroke();
        } else if (showGridLines) {
          ctx.stroke();
        }
        break;

      case PixelStyle.SQUARE:
        ctx.beginPath();
        ctx.rect(x + padding, y + padding, size - padding * 2, size - padding * 2);
        ctx.fill();
        if (!isTransparent) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.stroke();
        } else if (showGridLines) {
          ctx.stroke();
        }
        break;

      case PixelStyle.ROUNDED:
        const radius = size / 4;
        ctx.beginPath();
        ctx.roundRect(x + padding, y + padding, size - padding * 2, size - padding * 2, radius);
        ctx.fill();
        if (!isTransparent) {
          const shadowGradient = ctx.createLinearGradient(x, y, x + size, y + size);
          shadowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
          shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
          ctx.fillStyle = shadowGradient;
          ctx.fill();
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.stroke();
        } else if (showGridLines) {
          ctx.stroke();
        }
        break;
    }

    if (!isTransparent && showColorKeys && colorKey && cellSize > 20) {
      const fontSize = Math.max(8, cellSize * 0.28);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeText(colorKey, x + size / 2, y + size / 2);
      ctx.fillText(colorKey, x + size / 2, y + size / 2);
    }
  }, [pixelStyle, showGridLines, showColorKeys, cellSize]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showRuler) {
      const rulerSize = Math.max(20, cellSize * 0.5);
      const fontSize = Math.max(10, cellSize * 0.3);

      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, rulerSize, rulerSize);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('0', rulerSize / 2, rulerSize / 2);

      for (let col = 0; col < gridWidth; col++) {
        if (col % 5 === 0) {
          const x = rulerSize + col * cellSize + cellSize / 2;
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(rulerSize + col * cellSize, 0, cellSize, rulerSize);
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(col.toString(), x, rulerSize / 2);

          ctx.strokeStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(x, rulerSize);
          ctx.lineTo(x, rulerSize + 3);
          ctx.stroke();
        }
      }

      for (let row = 0; row < gridHeight; row++) {
        if (row % 5 === 0) {
          const y = rulerSize + row * cellSize + cellSize / 2;
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, rulerSize + row * cellSize, rulerSize, cellSize);
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(row.toString(), rulerSize / 2, y);

          ctx.strokeStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(rulerSize, y);
          ctx.lineTo(rulerSize + 3, y);
          ctx.stroke();
        }
      }
    }

    const offsetX = showRuler ? Math.max(20, cellSize * 0.5) : 0;
    const offsetY = showRuler ? Math.max(20, cellSize * 0.5) : 0;

    ctx.save();
    ctx.translate(offsetX, offsetY);

    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        const color = grid[row][col];
        const x = col * cellSize;
        const y = row * cellSize;

        const isTransparent = color === 'transparent' || color === '#FFFFFF' || color === '';
        const colorKey = getColorKey(color);

        if (highlightedColor && !isTransparent) {
          if (color !== highlightedColor) {
            ctx.globalAlpha = 1 - (highlightOpacity / 100);
          } else {
            ctx.globalAlpha = 1;
          }
        } else {
          ctx.globalAlpha = 1;
        }

        drawPixel(ctx, x, y, cellSize, color, isTransparent, colorKey);
        ctx.globalAlpha = 1;
      }
    }

    if (showGuideLines) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = Math.max(1, cellSize * 0.05);
      ctx.setLineDash([]);

      for (let i = 5; i < gridWidth; i += 5) {
        const pos = i * cellSize;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, gridHeight * cellSize);
        ctx.stroke();
      }

      for (let i = 5; i < gridHeight; i += 5) {
        const pos = i * cellSize;
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(gridWidth * cellSize, pos);
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [grid, gridWidth, gridHeight, cellSize, showGridLines, showRuler, rulerSize, pixelStyle, showGuideLines, drawPixel, highlightedColor, highlightOpacity, getColorKey]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isLocked) return;
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -5 : 5;
      setZoom(prev => Math.min(Math.max(prev + delta, 20), 300));
    }
  }, [isLocked]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isLocked) return;
    if (e.button === 1 || e.button === 0) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  }, [isLocked]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || isLocked) return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    setPanOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
  }, [isLocked]);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isLocked) return;
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [isLocked]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || isLocked) return;
    if (e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - lastMousePosRef.current.x;
      const deltaY = e.touches[0].clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setPanOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    }
  }, [isLocked]);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col">
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-white font-bold text-lg">沉浸拼豆模式</h2>
          <div className="h-6 w-px bg-slate-600"></div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGridLines(!showGridLines)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showGridLines ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              网格
            </button>
            <button
              onClick={() => setShowRuler(!showRuler)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showRuler ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              标尺
            </button>
            <button
              onClick={() => setShowGuideLines(!showGuideLines)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showGuideLines ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              辅助线
            </button>
            <button
              onClick={() => setShowColorKeys(!showColorKeys)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showColorKeys ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              色号
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(20, z - 10))} className="w-8 h-8 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 transition-all">-</button>
            <input type="range" min="20" max="300" value={zoom} onChange={(e) => setZoom(parseInt(e.target.value))} className="w-24 accent-indigo-500" />
            <button onClick={() => setZoom(z => Math.min(300, z + 10))} className="w-8 h-8 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 transition-all">+</button>
            <span className="text-slate-400 text-sm font-mono w-12">{zoom}%</span>
          </div>

          <div className="h-6 w-px bg-slate-600"></div>

          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isLocked ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            {isLocked ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                已锁定
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                未锁定
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-700 text-white hover:bg-slate-600 transition-all"
          >
            退出
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center"
          style={{ cursor: isLocked ? 'default' : 'grab' }}
        >
          <div
            style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}
            className="transition-transform duration-75"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-4 md:p-8 m-4">
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  width: canvasWidth,
                  height: canvasHeight,
                  cursor: isLocked ? 'default' : 'grab',
                }}
              />
            </div>
          </div>
        </div>

        <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-white font-bold text-sm mb-3">颜色高亮</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-slate-400 text-xs">透明度</label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={highlightOpacity}
                  onChange={(e) => setHighlightOpacity(parseInt(e.target.value))}
                  className="flex-1 accent-indigo-500"
                  disabled={!highlightedColor}
                />
                <span className="text-slate-400 text-xs w-10">{highlightOpacity}%</span>
              </div>
              {highlightedColor && (
                <button
                  onClick={() => setHighlightedColor(null)}
                  className="w-full py-2 rounded-lg bg-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-600 transition-all"
                >
                  取消高亮
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-white font-bold text-sm mb-3">图例 ({stats.length} 色)</h3>
            <div className="space-y-2">
              {stats.map((item) => {
                const colorKey = getColorKey(item.hex);
                return (
                  <div
                    key={item.hex}
                    onClick={() => setHighlightedColor(highlightedColor === item.hex ? null : item.hex)}
                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${highlightedColor === item.hex ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                  >
                    <div
                      className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center"
                      style={{ backgroundColor: item.hex }}
                    >
                      {showColorKeys && colorKey && (
                        <span className="text-[9px] font-bold text-white drop-shadow-md">{colorKey}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-xs font-bold">{colorKey || item.hex}</div>
                      <div className="text-slate-400 text-xs">{item.count} 颗</div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${highlightedColor === item.hex ? 'bg-white/20' : 'bg-slate-600'}`}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-slate-700 bg-slate-900">
            <div className="flex justify-between text-slate-400 text-xs">
              <span>尺寸: {gridWidth}x{gridHeight}</span>
              <span>总计: {stats.reduce((a, b) => a + b.count, 0)} 颗</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};