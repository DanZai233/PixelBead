import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PixelStyle } from '../types';
import { pickSingleImageNative } from '../utils/pickImageNative';

interface FinishedPreviewProps {
  grid: string[][];
  gridWidth: number;
  gridHeight: number;
  pixelStyle: PixelStyle;
}

const IMAGE_ACCEPT = 'image/png,image/jpeg,image/jpg,image/heic,image/webp,image/gif';

export const FinishedPreview: React.FC<FinishedPreviewProps> = ({
  grid,
  gridWidth,
  gridHeight,
  pixelStyle,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const artCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; artX: number; artY: number } | null>(null);

  const [bgSrc, setBgSrc] = useState<string | null>(null);
  const [shadowEnabled, setShadowEnabled] = useState(true);
  const [artScale, setArtScale] = useState(1);
  const [artX, setArtX] = useState(0);
  const [artY, setArtY] = useState(0);
  const [stageSize, setStageSize] = useState({ width: 900, height: 640 });
  const [exportOpen, setExportOpen] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exportName, setExportName] = useState('');

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () => {
      const rect = stage.getBoundingClientRect();
      setStageSize({ width: Math.max(200, rect.width), height: Math.max(140, rect.height) });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!bgSrc) {
      bgImageRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      bgImageRef.current = img;
    };
    img.src = bgSrc;
  }, [bgSrc]);

  const fitCell = useMemo(() => {
    const longest = Math.max(gridWidth, gridHeight, 1);
    return Math.max(3, Math.min(24, (Math.min(stageSize.width, stageSize.height) * 0.72) / longest));
  }, [gridWidth, gridHeight, stageSize]);

  const cellSize = fitCell * artScale;
  const artWidth = gridWidth * cellSize;
  const artHeight = gridHeight * cellSize;

  const drawBead = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    withShadow: boolean,
  ) => {
    ctx.save();
    if (withShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.32)';
      ctx.shadowBlur = Math.max(2, size * 0.22);
      ctx.shadowOffsetX = Math.max(1, size * 0.1);
      ctx.shadowOffsetY = Math.max(1.5, size * 0.14);
    }
    ctx.fillStyle = color;
    const pad = Math.max(0.5, size * 0.035);
    if (pixelStyle === PixelStyle.CIRCLE) {
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 - pad, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (pixelStyle === PixelStyle.ROUNDED) {
      ctx.beginPath();
      ctx.roundRect(x + pad, y + pad, size - pad * 2, size - pad * 2, Math.max(2, size / 5));
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fillRect(x + pad, y + pad, size - pad * 2, size - pad * 2);
    }
    ctx.restore();
  }, [pixelStyle]);

  const drawArt = useCallback((
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    offsetY: number,
    size: number,
    withShadow: boolean,
  ) => {
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        const color = grid[row][col];
        const transparent = color === 'transparent' || color === '#FFFFFF' || color === '';
        if (transparent) continue;
        drawBead(ctx, offsetX + col * size, offsetY + row * size, size, color, withShadow);
      }
    }
  }, [grid, gridWidth, gridHeight, drawBead]);

  useEffect(() => {
    const canvas = artCanvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(artWidth * dpr));
    canvas.height = Math.max(1, Math.round(artHeight * dpr));
    canvas.style.width = `${artWidth}px`;
    canvas.style.height = `${artHeight}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, artWidth, artHeight);
    drawArt(ctx, 0, 0, cellSize, shadowEnabled);
  }, [artWidth, artHeight, cellSize, drawArt, shadowEnabled]);

  const handleBgUpload = useCallback((file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBgSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const openBgPicker = useCallback(async () => {
    const nativeUrl = await pickSingleImageNative();
    if (nativeUrl) {
      setBgSrc(nativeUrl);
      return;
    }
    fileInputRef.current?.click();
  }, []);

  const handleArtPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      artX,
      artY,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [artX, artY]);

  const handleArtPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const maxX = artWidth / 2;
    const maxY = artHeight / 2;
    setArtX(Math.max(-maxX, Math.min(stageSize.width + maxX, drag.artX + (e.clientX - drag.startX))));
    setArtY(Math.max(-maxY, Math.min(stageSize.height + maxY, drag.artY + (e.clientY - drag.startY))));
  }, [artWidth, artHeight, stageSize]);

  const handleArtPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleExport = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const exportScale = 1600 / Math.max(1, rect.width);
    const width = Math.max(320, Math.round(rect.width * exportScale));
    const height = Math.max(220, Math.round(rect.height * exportScale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bg = bgImageRef.current;
    if (bg) {
      const cover = Math.max(width / bg.width, height / bg.height);
      const dw = bg.width * cover;
      const dh = bg.height * cover;
      ctx.drawImage(bg, (width - dw) / 2, (height - dh) / 2, dw, dh);
    } else {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.18)';
      ctx.lineWidth = 1;
      const grid = 48;
      for (let x = grid; x < width; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = grid; y < height; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    const exportCell = cellSize * exportScale;
    const offsetX = (width - artWidth * exportScale) / 2 + artX * exportScale;
    const offsetY = (height - artHeight * exportScale) / 2 + artY * exportScale;
    drawArt(ctx, offsetX, offsetY, exportCell, shadowEnabled);

    const fileName = `finished-preview-${gridWidth}x${gridHeight}-${Date.now()}.png`;
    const url = canvas.toDataURL('image/png');
    if (exportUrl) URL.revokeObjectURL(exportUrl);
    setExportUrl(url);
    setExportName(fileName);
    setExportOpen(true);
  }, [stageSize, cellSize, artWidth, artHeight, artX, artY, drawArt, shadowEnabled, gridWidth, gridHeight, exportUrl]);

  const handleDownload = useCallback(() => {
    if (!exportUrl) return;
    const a = document.createElement('a');
    a.href = exportUrl;
    a.download = exportName;
    a.click();
  }, [exportUrl, exportName]);

  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-slate-50">
      <div className="shrink-0 bg-white border-b border-slate-200 px-3 md:px-5 py-2 md:py-3 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              handleBgUpload(e.target.files?.[0] ?? null);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => void openBgPicker()}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition-all active:scale-95 touch-manipulation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {bgSrc ? '更换背景图' : '选择背景图'}
          </button>
          {bgSrc && (
            <button
              onClick={() => setBgSrc(null)}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-black text-xs transition-all touch-manipulation"
            >
              移除背景
            </button>
          )}
          <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl cursor-pointer touch-manipulation">
            <input
              type="checkbox"
              checked={shadowEnabled}
              onChange={(e) => setShadowEnabled(e.target.checked)}
              className="w-4 h-4 accent-indigo-600"
            />
            <span className="text-xs font-black text-slate-700">阴影</span>
          </label>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400">大小</span>
            <input
              type="range"
              min="0.4"
              max="2"
              step="0.05"
              value={artScale}
              onChange={(e) => setArtScale(parseFloat(e.target.value))}
              className="w-28 h-2 accent-indigo-600"
            />
            <span className="text-[10px] font-black text-indigo-600 w-8">{Math.round(artScale * 100)}%</span>
          </div>
          <button
            onClick={() => { setArtX(0); setArtY(0); }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs transition-all touch-manipulation"
          >
            复位
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md transition-all active:scale-95 touch-manipulation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出预览图
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-3 md:p-6 flex items-center justify-center overflow-hidden">
        <div
          ref={stageRef}
          className="relative w-full max-w-[980px] aspect-[4/3] max-h-full overflow-hidden rounded-2xl shadow-[0_24px_60px_-18px_rgba(15,23,42,0.35)] border border-white/70 bg-[#f8fafc]"
        >
          {bgSrc ? (
            <img
              src={bgSrc}
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 bg-dots pointer-events-none" />
          )}

          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transform: `translate(calc(-50% + ${artX}px), calc(-50% + ${artY}px))`,
              cursor: 'grab',
              touchAction: 'none',
            }}
          >
            <canvas
              ref={artCanvasRef}
              onPointerDown={handleArtPointerDown}
              onPointerMove={handleArtPointerMove}
              onPointerUp={handleArtPointerUp}
              onPointerCancel={handleArtPointerUp}
              className="block select-none"
              style={{ width: artWidth, height: artHeight, imageRendering: 'auto' }}
            />
          </div>

          <div className="absolute top-2 left-2 px-2.5 py-1.5 bg-white/85 backdrop-blur rounded-lg text-[10px] font-black text-slate-600 shadow-sm pointer-events-none">
            拖动拼豆到合适位置
          </div>
        </div>
      </div>

      <div className="shrink-0 md:hidden px-4 pb-3 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 shrink-0">大小</span>
          <input
            type="range"
            min="0.4"
            max="2"
            step="0.05"
            value={artScale}
            onChange={(e) => setArtScale(parseFloat(e.target.value))}
            className="flex-1 h-2 accent-indigo-600"
          />
          <span className="text-[10px] font-black text-indigo-600 w-8">{Math.round(artScale * 100)}%</span>
        </div>
      </div>

      {exportOpen && exportUrl && (
        <div className="fixed inset-0 bg-black/90 z-[1500] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg flex flex-col items-center gap-4">
            <img src={exportUrl} alt="成品预览导出" className="max-w-full max-h-[62vh] rounded-2xl shadow-2xl border border-white/20 object-contain bg-white" />
            <div className="flex gap-3 w-full max-w-xs">
              <button
                onClick={handleDownload}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm active:scale-95 transition-all"
              >
                下载 PNG
              </button>
              <button
                onClick={() => { setExportOpen(false); setExportUrl(null); }}
                className="flex-1 py-3 bg-white/20 text-white rounded-2xl font-black text-sm active:scale-95 transition-all"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
