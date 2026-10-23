import React, { useEffect, useState } from 'react';
import { rasterizeImage, type ImageCrop } from '../utils/imageConversion';

export interface ConversionSize { width: number; height: number }

export const ImageSizePreview: React.FC<{
  image: string; size: ConversionSize; onSize: (size: ConversionSize) => void;
  currentWidth: number; currentHeight: number; xAlign?: number; yAlign?: number; crop?: ImageCrop;
}> = ({ image, size, onSize, currentWidth, currentHeight, xAlign = 0, yAlign = 0, crop }) => {
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [colors, setColors] = useState(0);
  const [draft, setDraft] = useState({ width: String(size.width), height: String(size.height) });
  useEffect(() => { setDraft({ width: String(size.width), height: String(size.height) }); }, [size.width, size.height]);
  useEffect(() => {
    let cancelled = false;
    setPreview(''); setError('');
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      try {
        const result = rasterizeImage(img, size.width, size.height, xAlign, yAlign, crop);
        setPreview(result.canvas.toDataURL());
        setColors(new Set(result.grid.flat()).size);
      } catch { setError('预览失败，请重新选择图片'); }
    };
    img.onerror = () => { if (!cancelled) setError('图片加载失败'); };
    img.src = image;
    return () => { cancelled = true; };
  }, [image, size.width, size.height, xAlign, yAlign, crop]);
  const inputSize = (key: 'width' | 'height', value: string) => {
    setDraft(prev => ({ ...prev, [key]: value }));
    if (/^\d+$/.test(value) && Number(value) >= 4 && Number(value) <= 200) onSize({ ...size, [key]: Number(value) });
  };
  return <section className="space-y-3 min-w-0">
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold text-slate-600">画布尺寸</span>
      <button type="button" onClick={() => onSize({ width: currentWidth, height: currentHeight })} className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg">当前 {currentWidth}×{currentHeight}</button>
      {[16, 24, 32, 48, 64, 96, 128].map(n => <button type="button" key={n} aria-pressed={size.width === n && size.height === n}
        onClick={() => onSize({ width: n, height: n })} className={`px-2 py-1.5 text-xs rounded-lg border ${size.width === n && size.height === n ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>{n}×{n}</button>)}
    </div>
    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
      {(['width', 'height'] as const).map(key => <label key={key} className="flex items-center gap-1">{key === 'width' ? '宽' : '高'}
        <input aria-label={key === 'width' ? '转换画布宽度' : '转换画布高度'} type="number" min={4} max={200} value={draft[key]}
          onChange={e => inputSize(key, e.target.value)} onBlur={() => setDraft({ width: String(size.width), height: String(size.height) })}
          className="w-16 border border-slate-200 rounded-lg p-2 text-slate-800" /></label>)}
      <span>4–200 格</span><span>{size.width * size.height} 格 · {colors} 色</span>
    </div>
    <div className="h-56 sm:h-64 bg-slate-100 flex items-center justify-center overflow-hidden rounded-lg" aria-busy={!preview && !error}>
      {error ? <p role="alert" className="text-xs text-red-500">{error}</p> : preview ? <img src={preview} alt={`拼豆转换预览 ${size.width}×${size.height}`} style={{ imageRendering: 'pixelated', aspectRatio: `${size.width}/${size.height}`, width: size.width >= size.height ? '100%' : 'auto', height: size.width >= size.height ? 'auto' : '100%', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span className="text-xs text-slate-400">转换预览中...</span>}
    </div>
    <p className="text-xs font-medium text-slate-500">{size.width}×{size.height} · 拼豆转换预览</p>
  </section>;
};
