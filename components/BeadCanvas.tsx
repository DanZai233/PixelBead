import React, { useRef, useEffect, useCallback } from 'react';
import { PixelStyle } from '../types';

interface BeadCanvasProps {
  grid: string[][];
  gridSize: number;
  zoom: number;
  showGridLines: boolean;
  showRuler: boolean;
  pixelStyle: PixelStyle;
  onPointerDown: (row: number, col: number) => void;
  onPointerMove: (row: number, col: number) => void;
  onPointerUp: () => void;
  onMiddleButtonDrag: (deltaX: number, deltaY: number) => void;
  onZoomChange: (zoom: number) => void;
  onTouchPan?: (deltaX: number, deltaY: number) => void;
}

export const BeadCanvas: React.FC<BeadCanvasProps> = ({
  grid,
  gridSize,
  zoom: propZoom,
  showGridLines,
  showRuler,
  pixelStyle,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onMiddleButtonDrag,
  onZoomChange,
  onTouchPan,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const isMiddleButtonDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const lastPinchDistanceRef = useRef(0);
  const lastPinchCenterRef = useRef({ x: 0, y: 0 });
  const lastZoomRef = useRef(propZoom);
  const baseBeadSize = 28;

  useEffect(() => {
    lastZoomRef.current = propZoom;
  }, [propZoom]);

  const cellSize = baseBeadSize * (propZoom / 100);
  const rulerSize = showRuler ? Math.max(20, cellSize * 0.5) : 0;
  const canvasSize = gridSize * cellSize + rulerSize;

  const drawPixel = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    isTransparent: boolean
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
  }, [pixelStyle, showGridLines]);

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

      for (let col = 0; col < gridSize; col++) {
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

      for (let row = 0; row < gridSize; row++) {
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

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const color = grid[row][col];
        const x = col * cellSize;
        const y = row * cellSize;

        const isTransparent = color === 'transparent' || color === '#FFFFFF' || color === '';
        drawPixel(ctx, x, y, cellSize, color, isTransparent);
      }
    }

    ctx.restore();
  }, [grid, gridSize, cellSize, showGridLines, showRuler, rulerSize, pixelStyle, drawPixel]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) e.preventDefault();
    };
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => canvas.removeEventListener('touchmove', onTouchMove);
  }, []);

  const getCellFromEvent = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { row: -1, col: -1 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      return { row, col };
    }
    return { row: -1, col: -1 };
  }, [gridSize, cellSize]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 1) {
      e.preventDefault();
      isMiddleButtonDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      canvasRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    e.preventDefault();
    const { row, col } = getCellFromEvent(e);
    if (row >= 0 && col >= 0) {
      isDrawingRef.current = true;
      canvasRef.current?.setPointerCapture(e.pointerId);
      onPointerDown(row, col);
    }
  }, [getCellFromEvent, onPointerDown]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isMiddleButtonDraggingRef.current) {
      e.preventDefault();
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      onMiddleButtonDrag(deltaX, deltaY);
      return;
    }

    if (isDrawingRef.current) {
      e.preventDefault();
      const { row, col } = getCellFromEvent(e);
      if (row >= 0 && col >= 0) {
        onPointerMove(row, col);
      }
    }
  }, [getCellFromEvent, onPointerMove, onMiddleButtonDrag]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 1) {
      isMiddleButtonDraggingRef.current = false;
      return;
    }
    isDrawingRef.current = false;
    onPointerUp();
  }, [onPointerUp]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -5 : 5;
      const newZoom = Math.min(Math.max(propZoom + delta, 10), 400);
      onZoomChange(newZoom);
    }
  }, [propZoom, onZoomChange]);

  const getTouchDistance = (t1: { clientX: number; clientY: number }, t2: { clientX: number; clientY: number }) =>
    Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  const getTouchCenter = (t1: { clientX: number; clientY: number }, t2: { clientX: number; clientY: number }) => ({
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  });

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        lastZoomRef.current = propZoom;
        lastPinchDistanceRef.current = getTouchDistance(e.touches[0], e.touches[1]);
        lastPinchCenterRef.current = getTouchCenter(e.touches[0], e.touches[1]);
      }
    },
    [propZoom]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getTouchDistance(e.touches[0], e.touches[1]);
        const center = getTouchCenter(e.touches[0], e.touches[1]);
        const scale = lastPinchDistanceRef.current > 0 ? dist / lastPinchDistanceRef.current : 1;
        const newZoom = Math.min(Math.max(Math.round(lastZoomRef.current * scale), 10), 400);
        onZoomChange(newZoom);
        lastZoomRef.current = newZoom;
        lastPinchDistanceRef.current = dist;
        if (onTouchPan) {
          onTouchPan(center.x - lastPinchCenterRef.current.x, center.y - lastPinchCenterRef.current.y);
        }
        lastPinchCenterRef.current = center;
      }
    },
    [onZoomChange, onTouchPan]
  );

  return (
    <div ref={containerRef} className="relative">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="cursor-crosshair touch-none"
        style={{
          width: `${canvasSize}px`,
          height: `${canvasSize}px`,
        }}
      />
    </div>
  );
};
