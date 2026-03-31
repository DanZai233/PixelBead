import React, { useRef, useEffect, useCallback, useState } from 'react';
import { PixelStyle, Selection } from '../types';

interface BeadCanvasProps {
  grid: string[][];
  gridWidth: number;
  gridHeight: number;
  zoom: number;
  showGridLines: boolean;
  showRuler: boolean;
  showGuideLines: boolean;
  pixelStyle: PixelStyle;
  backgroundImage?: { src: string; x: number; y: number; scale: number; opacity: number } | null;
  selectedLayer?: 'bead' | 'background';
  currentTool?: string;
  selection?: Selection | null;
  highlightedColor?: string | null;
  highlightOpacity?: number;
  onPointerDown: (row: number, col: number, backgroundColor?: string | null) => void;
  onPointerMove: (row: number, col: number, backgroundColor?: string | null) => void;
  onPointerUp: () => void;
  onMiddleButtonDrag: (deltaX: number, deltaY: number) => void;
  onBackgroundImageDrag?: (deltaX: number, deltaY: number) => void;
  onZoomChange: (zoom: number) => void;
  onTouchPan?: (deltaX: number, deltaY: number) => void;
  onSelectionChange?: (selection: Selection | null) => void;
}

export const BeadCanvas: React.FC<BeadCanvasProps> = ({
  grid,
  gridWidth,
  gridHeight,
  zoom: propZoom,
  showGridLines,
  showRuler,
  showGuideLines,
  pixelStyle,
  backgroundImage,
  selectedLayer,
  currentTool,
  selection: propSelection,
  highlightedColor,
  highlightOpacity = 90,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onMiddleButtonDrag,
  onBackgroundImageDrag,
  onZoomChange,
  onTouchPan,
  onSelectionChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const backgroundImageImgRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef(false);
  const isMiddleButtonDraggingRef = useRef(false);
  const isDraggingBackgroundRef = useRef(false);
  const isPinchingRef = useRef(false);
  const isTouchPanningRef = useRef(false);
  const touchStartTimeRef = useRef(0);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const lastPinchDistanceRef = useRef(0);
  const lastPinchCenterRef = useRef({ x: 0, y: 0 });
  const lastZoomRef = useRef(propZoom);
  const backgroundImageReadyRef = useRef(false);
  const baseBeadSize = 28;
  const lastTouchDrawRowRef = useRef<number | null>(null);
  const lastTouchDrawColRef = useRef<number | null>(null);
  const pendingTouchDrawRef = useRef<{ row: number; col: number; bg: string | null } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ row: number; col: number } | null>(null);

  useEffect(() => {
    lastZoomRef.current = propZoom;
  }, [propZoom]);

  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.src = backgroundImage.src;
      img.onload = () => {
        backgroundImageImgRef.current = img;
        backgroundImageReadyRef.current = true;
        drawCanvas();
      };
      backgroundImageImgRef.current = img;
    } else {
      backgroundImageImgRef.current = null;
      backgroundImageReadyRef.current = false;
    }
  }, [backgroundImage?.src]);

  const cellSize = baseBeadSize * (propZoom / 100);
  const rulerSize = showRuler ? Math.max(20, cellSize * 0.5) : 0;
  const canvasWidth = gridWidth * cellSize + rulerSize;
  const canvasHeight = gridHeight * cellSize + rulerSize;

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

    if (backgroundImage && backgroundImageImgRef.current) {
      const img = backgroundImageImgRef.current;

      // 计算相对于基础尺寸的缩放比例
      const zoomRatio = cellSize / baseBeadSize;

      const bgWidth = img.width * backgroundImage.scale * zoomRatio;
      const bgHeight = img.height * backgroundImage.scale * zoomRatio;
      const bgX = backgroundImage.x * zoomRatio;
      const bgY = backgroundImage.y * zoomRatio;
      ctx.globalAlpha = backgroundImage.opacity;
      ctx.drawImage(img, bgX, bgY, bgWidth, bgHeight);
      ctx.globalAlpha = 1;
    }

    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        const color = grid[row][col];
        const x = col * cellSize;
        const y = row * cellSize;

        const isTransparent = color === 'transparent' || color === '#FFFFFF' || color === '';

        let drawColor = color;
        let drawIsTransparent = isTransparent;

        if (highlightedColor && !isTransparent) {
          if (color !== highlightedColor) {
            ctx.globalAlpha = 1 - (highlightOpacity / 100);
          } else {
            ctx.globalAlpha = 1;
          }
        } else {
          ctx.globalAlpha = 1;
        }

        drawPixel(ctx, x, y, cellSize, drawColor, drawIsTransparent);
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

    if (selection) {
      const { startRow, startCol, endRow, endCol } = selection;
      const x = Math.min(startCol, endCol) * cellSize;
      const y = Math.min(startRow, endRow) * cellSize;
      const width = (Math.abs(endCol - startCol) + 1) * cellSize;
      const height = (Math.abs(endRow - startRow) + 1) * cellSize;

      ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.fillRect(x, y, width, height);
    }

    ctx.restore();
  }, [grid, gridWidth, gridHeight, cellSize, showGridLines, showRuler, rulerSize, pixelStyle, showGuideLines, backgroundImage, drawPixel, selection, highlightedColor, highlightOpacity]);

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

    // 减去标尺偏移量，避免光标错位
    const offsetX = showRuler ? Math.max(20, cellSize * 0.5) : 0;
    const offsetY = showRuler ? Math.max(20, cellSize * 0.5) : 0;

    const col = Math.floor((x - offsetX) / cellSize);
    const row = Math.floor((y - offsetY) / cellSize);

    if (row >= 0 && row < gridHeight && col >= 0 && col < gridWidth) {
      return { row, col };
    }
    return { row: -1, col: -1 };
  }, [gridWidth, gridHeight, cellSize, showRuler]);

  const getBackgroundColorAtPosition = useCallback((row: number, col: number): string | null => {
    if (!backgroundImage || !backgroundImageImgRef.current) return null;

    const img = backgroundImageImgRef.current;
    const zoomRatio = cellSize / baseBeadSize;

    const bgWidth = img.width * backgroundImage.scale * zoomRatio;
    const bgHeight = img.height * backgroundImage.scale * zoomRatio;
    const bgX = backgroundImage.x * zoomRatio;
    const bgY = backgroundImage.y * zoomRatio;

    const cellCenterX = col * cellSize + cellSize / 2;
    const cellCenterY = row * cellSize + cellSize / 2;

    const imageX = cellCenterX - bgX;
    const imageY = cellCenterY - bgY;

    if (imageX < 0 || imageX >= bgWidth || imageY < 0 || imageY >= bgHeight) return null;

    const originalImageX = (imageX / (bgWidth)) * img.width;
    const originalImageY = (imageY / (bgHeight)) * img.height;

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, originalImageX, originalImageY, 1, 1, 0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;

    if (a < 128) return null;

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  }, [backgroundImage, backgroundImageImgRef, cellSize, baseBeadSize]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPinchingRef.current) return;

    if (e.pointerType === 'touch') {
      touchStartTimeRef.current = Date.now();
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      isTouchPanningRef.current = false;

      const { row, col } = getCellFromEvent(e);
      if (row >= 0 && col >= 0) {
        isDrawingRef.current = true;
        lastTouchDrawRowRef.current = row;
        lastTouchDrawColRef.current = col;
        const backgroundColor = getBackgroundColorAtPosition(row, col);
        pendingTouchDrawRef.current = { row, col, bg: backgroundColor };
      }
      return;
    }

    if (e.button === 1 || currentTool === 'HAND') {
      e.preventDefault();
      isMiddleButtonDraggingRef.current = true;
      setIsDragging(true);
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      canvasRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    e.preventDefault();
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    if (currentTool === 'SELECT') {
      const { row, col } = getCellFromEvent(e);
      if (row >= 0 && col >= 0) {
        setSelectionStart({ row, col });
        setSelection({ startRow: row, startCol: col, endRow: row, endCol: col });
        canvasRef.current?.setPointerCapture(e.pointerId);
      }
      return;
    }

    if (selectedLayer === 'background' && backgroundImage) {
      isDraggingBackgroundRef.current = true;
      canvasRef.current?.setPointerCapture(e.pointerId);
    } else {
      const { row, col } = getCellFromEvent(e);
      if (row >= 0 && col >= 0) {
        isDrawingRef.current = true;
        canvasRef.current?.setPointerCapture(e.pointerId);
        const backgroundColor = getBackgroundColorAtPosition(row, col);
        onPointerDown(row, col, backgroundColor);
      }
    }
  }, [getCellFromEvent, getBackgroundColorAtPosition, onPointerDown, selectedLayer, backgroundImage, currentTool]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPinchingRef.current) return;

    if (e.pointerType === 'touch' && isDrawingRef.current) {
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;
      const distance = Math.hypot(deltaX, deltaY);
      const timeDiff = Date.now() - touchStartTimeRef.current;

      if (timeDiff > 200 || distance > 10) {
        if (!isTouchPanningRef.current) {
          isTouchPanningRef.current = true;
          pendingTouchDrawRef.current = null;
        }
        e.preventDefault();
        onMiddleButtonDrag(deltaX, deltaY);
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        return;
      }
    }

    if (isMiddleButtonDraggingRef.current) {
      e.preventDefault();
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      onMiddleButtonDrag(deltaX, deltaY);
      return;
    }

    if (isDraggingBackgroundRef.current && onBackgroundImageDrag) {
      e.preventDefault();
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      onBackgroundImageDrag(deltaX, deltaY);
      return;
    }

    if (currentTool === 'SELECT' && selectionStart) {
      e.preventDefault();
      const { row, col } = getCellFromEvent(e);
      if (row >= 0 && row < gridHeight && col >= 0 && col < gridWidth) {
        setSelection({
          startRow: selectionStart.row,
          startCol: selectionStart.col,
          endRow: row,
          endCol: col,
        });
      }
      return;
    }

    if (isDrawingRef.current && !isTouchPanningRef.current) {
      e.preventDefault();
      if (pendingTouchDrawRef.current) {
        const p = pendingTouchDrawRef.current;
        onPointerDown(p.row, p.col, p.bg);
        pendingTouchDrawRef.current = null;
      }
      const { row, col } = getCellFromEvent(e);
      if (row >= 0 && col >= 0) {
        const backgroundColor = getBackgroundColorAtPosition(row, col);
        onPointerMove(row, col, backgroundColor);
      }
    }
  }, [getCellFromEvent, getBackgroundColorAtPosition, onPointerMove, onMiddleButtonDrag, onBackgroundImageDrag, currentTool, selectionStart, gridHeight, gridWidth]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') {
      if (pendingTouchDrawRef.current && !isTouchPanningRef.current) {
        const p = pendingTouchDrawRef.current;
        onPointerDown(p.row, p.col, p.bg);
      }
      pendingTouchDrawRef.current = null;
      isTouchPanningRef.current = false;
      lastTouchDrawRowRef.current = null;
      lastTouchDrawColRef.current = null;
    }

    if (e.button === 1 || currentTool === 'HAND') {
      isMiddleButtonDraggingRef.current = false;
      setIsDragging(false);
    }

    if (currentTool === 'SELECT' && selection && onSelectionChange) {
      onSelectionChange(selection);
      setSelectionStart(null);
    }

    isDraggingBackgroundRef.current = false;
    isDrawingRef.current = false;
    lastTouchDrawRowRef.current = null;
    lastTouchDrawColRef.current = null;
    onPointerUp();
  }, [onPointerDown, onPointerUp, currentTool, selection, onSelectionChange]);

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
        lastTouchDrawRowRef.current = null;
        lastTouchDrawColRef.current = null;
        isPinchingRef.current = true;
        isDrawingRef.current = false;
        isMiddleButtonDraggingRef.current = false;
        lastZoomRef.current = propZoom;
        lastPinchDistanceRef.current = getTouchDistance(e.touches[0], e.touches[1]);
        lastPinchCenterRef.current = getTouchCenter(e.touches[0], e.touches[1]);
      } else if (e.touches.length === 1) {
        isPinchingRef.current = false;
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

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      isPinchingRef.current = false;
      isDrawingRef.current = false;
      isMiddleButtonDraggingRef.current = false;
      isTouchPanningRef.current = false;
      pendingTouchDrawRef.current = null;
      lastTouchDrawRowRef.current = null;
      lastTouchDrawColRef.current = null;
    }
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={`${currentTool === 'HAND' ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'} touch-none`}
         style={{
           width: `${canvasWidth}px`,
           height: `${canvasHeight}px`,
         }}
      />
    </div>
  );
};
