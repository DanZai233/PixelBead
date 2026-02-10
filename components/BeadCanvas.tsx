import React, { useRef, useEffect, useCallback } from 'react';

interface BeadCanvasProps {
  grid: string[][];
  gridSize: number;
  zoom: number;
  showGridLines: boolean;
  onPointerDown: (row: number, col: number) => void;
  onPointerMove: (row: number, col: number) => void;
  onPointerUp: () => void;
}

export const BeadCanvas: React.FC<BeadCanvasProps> = ({
  grid,
  gridSize,
  zoom,
  showGridLines,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const baseBeadSize = 28;

  const cellSize = baseBeadSize * (zoom / 100);
  const canvasSize = gridSize * cellSize;

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const color = grid[row][col];
        const x = col * cellSize;
        const y = row * cellSize;

        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 2) - 1, 0, Math.PI * 2);

        const isTransparent = color === 'transparent' || color === '#FFFFFF' || color === '';
        if (!isTransparent) {
          ctx.fillStyle = color;
          ctx.fill();

          const shadowGradient = ctx.createRadialGradient(
            x + cellSize / 2 - cellSize / 6,
            y + cellSize / 2 - cellSize / 6,
            0,
            x + cellSize / 2,
            y + cellSize / 2,
            cellSize / 2
          );
          shadowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
          shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
          ctx.fillStyle = shadowGradient;
          ctx.fill();

          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
          ctx.fill();

          if (showGridLines) {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }
  }, [grid, gridSize, cellSize, showGridLines]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

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
    e.preventDefault();
    const { row, col } = getCellFromEvent(e);
    if (row >= 0 && col >= 0) {
      isDrawingRef.current = true;
      canvasRef.current?.setPointerCapture(e.pointerId);
      onPointerDown(row, col);
    }
  }, [getCellFromEvent, onPointerDown]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawingRef.current) {
      e.preventDefault();
      const { row, col } = getCellFromEvent(e);
      if (row >= 0 && col >= 0) {
        onPointerMove(row, col);
      }
    }
  }, [getCellFromEvent, onPointerMove]);

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
    onPointerUp();
  }, [onPointerUp]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="cursor-crosshair touch-none"
      style={{
        width: `${canvasSize}px`,
        height: `${canvasSize}px`,
      }}
    />
  );
};
