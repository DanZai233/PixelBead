import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { ColorHex } from '../types';
import {
  GRADIENT_PRESETS,
  SOLID_SWATCHES,
  TEXT_FONT_OPTIONS,
  averageForegroundContrast,
  buildQrGrid,
  buildTextGrid,
  exportGridToPng,
  getTextFont,
  normalizeHex,
  renderGridPreview,
  type BuildResult,
  type ColorMode,
  type CreativeGrid,
  type ErrorCorrectionLevel,
  type GradientConfig,
  type GradientDirection,
} from '../utils/creativeUtils';
import { findUnsupportedChars, getBitmapFont } from '../utils/pixelFonts';

interface CreativeToolsModalProps {
  onClose: () => void;
  onApply: (result: CreativeGrid) => void;
}

type ToolTab = 'qr' | 'text';

const PREVIEW_BOX = 280;

const BACKGROUND_SWATCHES: ColorHex[] = [
  '#FFFFFF', '#F8FAFC', '#FDE68A', '#DBEAFE', '#FCE7F3', '#111827',
];

const ERROR_LEVELS: Array<{ value: ErrorCorrectionLevel; label: string; hint: string }> = [
  { value: 'L', label: 'L', hint: '约 7% 纠错，容错最低但能装更多内容' },
  { value: 'M', label: 'M', hint: '约 15% 纠错，日常推荐' },
  { value: 'Q', label: 'Q', hint: '约 25% 纠错，适合有磨损的实物' },
  { value: 'H', label: 'H', hint: '约 30% 纠错，最耐脏但内容更少' },
];

const DIRECTIONS: Array<{ value: GradientDirection; label: string; icon: string }> = [
  { value: 'horizontal', label: '横向', icon: '→' },
  { value: 'vertical', label: '纵向', icon: '↓' },
  { value: 'diagonal', label: '斜向', icon: '↘' },
];

const Segmented = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: React.ReactNode; title?: string }>;
  onChange: (value: T) => void;
}) => (
  <div className="flex bg-slate-100 p-1 rounded-xl">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        title={option.title}
        onClick={() => onChange(option.value)}
        className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-black transition-all ${
          value === option.value
            ? 'bg-white shadow-sm text-indigo-600'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const Stepper = ({
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) => {
  const clamp = (next: number) => Math.max(min, Math.min(max, next));
  return (
    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 font-black hover:bg-slate-100 active:scale-95 transition-all"
      >
        -
      </button>
      <span className="min-w-[52px] text-center text-xs font-black text-slate-900">
        {value}
        {suffix ? <span className="text-slate-400 font-bold"> {suffix}</span> : null}
      </span>
      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 font-black hover:bg-slate-100 active:scale-95 transition-all"
      >
        +
      </button>
    </div>
  );
};

const ColorField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ColorHex;
  onChange: (value: ColorHex) => void;
}) => (
  <label className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-2.5 py-2 cursor-pointer">
    <span className="text-xs font-bold text-slate-500">{label}</span>
    <span className="flex items-center gap-2">
      <span className="text-[11px] font-black text-slate-700 uppercase">{value}</span>
      <span className="relative w-7 h-7 rounded-lg border border-slate-200 overflow-hidden shadow-inner">
        <span className="absolute inset-0" style={{ backgroundColor: value }} />
        <input
          type="color"
          value={normalizeHex(value)}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </span>
    </span>
  </label>
);

const SwatchRow = ({
  colors,
  activeColor,
  onPick,
}: {
  colors: ColorHex[];
  activeColor?: ColorHex;
  onPick: (color: ColorHex) => void;
}) => (
  <div className="flex flex-wrap gap-1.5">
    {colors.map((color) => (
      <button
        key={color}
        type="button"
        title={color}
        onClick={() => onPick(color)}
        className={`w-6 h-6 rounded-lg border transition-all hover:scale-110 ${
          activeColor === color ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200'
        }`}
        style={{ backgroundColor: color }}
      />
    ))}
  </div>
);

export const CreativeToolsModal: React.FC<CreativeToolsModalProps> = ({ onClose, onApply }) => {
  const [tab, setTab] = useState<ToolTab>('qr');

  const [qrContent, setQrContent] = useState('');
  const [qrLevel, setQrLevel] = useState<ErrorCorrectionLevel>('M');
  const [qrScale, setQrScale] = useState(1);
  const [qrQuiet, setQrQuiet] = useState(2);

  const [text, setText] = useState('');
  // 默认用「中文像素·黑体」：中英文都不会出现空白，仍保持方正边缘
  const [fontId, setFontId] = useState('pixel-sans');
  const [bold, setBold] = useState(true);
  const [widthBeads, setWidthBeads] = useState(48);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [threshold, setThreshold] = useState(0.35);

  const [colorMode, setColorMode] = useState<ColorMode>('gradient');
  const [solidColor, setSolidColor] = useState<ColorHex>('#6366F1');
  const [stops, setStops] = useState<ColorHex[]>(['#6366F1', '#EC4899']);
  const [direction, setDirection] = useState<GradientDirection>('diagonal');
  const [background, setBackground] = useState<ColorHex>('#FFFFFF');

  const previewRef = useRef<HTMLCanvasElement>(null);

  const deferredQrContent = useDeferredValue(qrContent);
  const deferredText = useDeferredValue(text);

  const font = useMemo(() => getTextFont(fontId), [fontId]);
  const unsupportedChars = useMemo(() => {
    if (font.kind !== 'bitmap') return [] as string[];
    const bitmap = getBitmapFont(font.bitmapId ?? '');
    return bitmap ? findUnsupportedChars(bitmap, deferredText) : [];
  }, [font, deferredText]);

  const foreground = useMemo<GradientConfig>(
    () => ({ mode: colorMode, foreground: solidColor, stops, direction }),
    [colorMode, solidColor, stops, direction],
  );

  const buildResult = useMemo<BuildResult>(() => {
    if (tab === 'qr') {
      return buildQrGrid({
        content: deferredQrContent,
        errorCorrectionLevel: qrLevel,
        quietZone: qrQuiet,
        scale: qrScale,
        foreground,
        background,
      });
    }
    return buildTextGrid({
      text: deferredText,
      font,
      bold,
      widthBeads,
      lineHeight,
      threshold,
      foreground,
      background,
    });
  }, [
    tab, deferredQrContent, qrLevel, qrQuiet, qrScale,
    deferredText, font, bold, widthBeads, lineHeight, threshold,
    foreground, background,
  ]);

  const previewGrid = buildResult.ok ? buildResult.value.grid : null;

  useEffect(() => {
    if (!previewRef.current || !previewGrid) return;
    renderGridPreview(previewRef.current, previewGrid, PREVIEW_BOX);
  }, [previewGrid]);

  const uniqueColorCount = useMemo(() => {
    if (!previewGrid) return 0;
    const set = new Set<string>();
    previewGrid.forEach((row) => row.forEach((color) => {
      if (color && color !== '#FFFFFF') set.add(color);
    }));
    return set.size;
  }, [previewGrid]);

  const contrast = useMemo(
    () => (tab === 'qr' ? averageForegroundContrast(foreground, background) : Infinity),
    [tab, foreground, background],
  );

  const updateStop = (index: number, color: ColorHex) => {
    setStops((prev) => prev.map((stop, i) => (i === index ? color : stop)));
  };

  const removeStop = (index: number) => {
    setStops((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  };

  const addStop = () => {
    setStops((prev) => {
      if (prev.length >= 4) return prev;
      const last = prev[prev.length - 1] ?? '#6366F1';
      return [...prev, last];
    });
  };

  const applyPreset = (presetStops: ColorHex[]) => {
    setColorMode('gradient');
    setStops(presetStops.slice(0, 4));
  };

  const shufflePreset = () => {
    const options = GRADIENT_PRESETS.filter((preset) => preset.stops.join() !== stops.join());
    const picked = options[Math.floor(Math.random() * options.length)] ?? GRADIENT_PRESETS[0];
    applyPreset(picked.stops);
  };

  const handleApply = () => {
    if (!buildResult.ok) return;
    onApply(buildResult.value);
  };

  const handleDownload = () => {
    if (!buildResult.ok) return;
    const name = tab === 'qr' ? '拼豆二维码' : '拼豆文字';
    exportGridToPng(
      buildResult.value.grid,
      `${name}-${buildResult.value.width}x${buildResult.value.height}.png`,
    );
  };

  const sizeLabel = buildResult.ok
    ? `${buildResult.value.width} × ${buildResult.value.height}`
    : '—';
  // 用 in 收窄：本项目未开启 strictNullChecks，布尔判别式的 false 分支无法收窄
  const errorMessage = 'value' in buildResult ? '' : buildResult.error;

  return (
    <div
      className="fixed inset-0 z-[1800] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-slate-50 shadow-2xl sm:max-h-[90vh] sm:rounded-3xl">
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2v2h-2zM18 14h2v2h-2z" />
                  </svg>
                </span>
                创意小工具
              </h2>
              <p className="mt-0.5 text-[11px] font-bold text-slate-500">
                生成拼豆图纸并直接填进画布，可以接着编辑
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-3">
            <Segmented<ToolTab>
              value={tab}
              onChange={setTab}
              options={[
                { value: 'qr', label: '二维码', title: '把网址或文字变成可扫的拼豆二维码' },
                { value: 'text', label: '文字', title: '把文字变成拼豆字牌图纸' },
              ]}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="order-3 space-y-4 lg:order-1">
              {tab === 'qr' ? (
                <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">内容</span>
                    <textarea
                      value={qrContent}
                      onChange={(event) => setQrContent(event.target.value)}
                      placeholder="https://example.com 或任意文字"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white"
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">容错级别</span>
                      <Segmented<ErrorCorrectionLevel>
                        value={qrLevel}
                        onChange={setQrLevel}
                        options={ERROR_LEVELS.map((level) => ({
                          value: level.value,
                          label: level.label,
                          title: level.hint,
                        }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">每码点豆数</span>
                      <Stepper value={qrScale} min={1} max={6} suffix="颗" onChange={setQrScale} />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">静区白边</span>
                      <Stepper value={qrQuiet} min={0} max={6} suffix="码点" onChange={setQrQuiet} />
                    </div>
                  </div>
                  {contrast < 3 ? (
                    <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700">
                      前景和背景对比偏低，实拍可能扫不出来，建议换浅一点的背景或深一点的前景色。
                    </p>
                  ) : null}
                </section>
              ) : (
                <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">文字内容</span>
                    <textarea
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      placeholder="输入文字，支持换行"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white"
                    />
                  </label>
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">字体</span>
                    {(['像素字', '系统字体'] as const).map((group) => (
                      <div key={group} className="space-y-1.5">
                        <span className="block text-[10px] font-black text-slate-400">{group}</span>
                        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                          {TEXT_FONT_OPTIONS.filter((option) => option.group === group).map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setFontId(option.id)}
                              style={option.kind === 'canvas' ? { fontFamily: option.family } : undefined}
                              className={`rounded-xl border px-2 py-2 text-sm font-black transition-all ${
                                fontId === option.id
                                  ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {font.kind === 'bitmap' && unsupportedChars.length > 0 ? (
                      <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700">
                        像素字体只包含英文、数字和常用符号，这些字会被跳过：{unsupportedChars.join(' ')}。
                        中文建议用「中文像素·黑体 / 宋体」。
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    {font.kind === 'canvas' ? (
                      <button
                        type="button"
                        onClick={() => setBold((prev) => !prev)}
                        className={`rounded-xl border px-4 py-2 text-sm font-black transition-all ${
                          bold
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                            : 'border-slate-200 bg-white text-slate-400'
                        }`}
                      >
                        B 加粗
                      </button>
                    ) : null}
                    <div className="space-y-1.5">
                      <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400">宽度</span>
                      <Stepper value={widthBeads} min={8} max={160} step={4} suffix="颗" onChange={setWidthBeads} />
                    </div>
                    <div className="min-w-[160px] flex-1 space-y-1.5">
                      <span className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                        <span>行距</span>
                        <span className="text-slate-500">{lineHeight.toFixed(1)}</span>
                      </span>
                      <input
                        type="range"
                        min={0.8}
                        max={2}
                        step={0.1}
                        value={lineHeight}
                        onChange={(event) => setLineHeight(Number(event.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    {font.kind === 'canvas' ? (
                      <div className="min-w-[160px] flex-1 space-y-1.5">
                        <span className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                          <span>笔画浓度</span>
                          <span className="text-slate-500">{Math.round(threshold * 100)}%</span>
                        </span>
                        <input
                          type="range"
                          min={0.1}
                          max={0.7}
                          step={0.05}
                          value={threshold}
                          onChange={(event) => setThreshold(Number(event.target.value))}
                          className="w-full accent-indigo-600"
                        />
                      </div>
                    ) : null}
                  </div>
                </section>
              )}

              <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">颜色</span>
                  <button
                    type="button"
                    onClick={shufflePreset}
                    className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-black text-slate-500 transition-all hover:bg-slate-200 active:scale-95"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0113.5-4M20 14a8 8 0 01-13.5 4" />
                    </svg>
                    随机
                  </button>
                </div>

                <Segmented<ColorMode>
                  value={colorMode}
                  onChange={setColorMode}
                  options={[
                    { value: 'solid', label: '纯色' },
                    { value: 'gradient', label: '渐变色' },
                  ]}
                />

                {colorMode === 'gradient' ? (
                  <>
                    <div className="space-y-2">
                      {stops.map((stop, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="flex-1">
                            <ColorField
                              label={`色标 ${index + 1}`}
                              value={stop}
                              onChange={(color) => updateStop(index, color)}
                            />
                          </div>
                          {stops.length > 2 ? (
                            <button
                              type="button"
                              onClick={() => removeStop(index)}
                              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition-all hover:text-rose-500"
                              title="删除这个色标"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          ) : null}
                        </div>
                      ))}
                      {stops.length < 4 ? (
                        <button
                          type="button"
                          onClick={addStop}
                          className="w-full rounded-xl border border-dashed border-slate-300 bg-white py-2 text-xs font-black text-slate-400 transition-all hover:border-indigo-400 hover:text-indigo-500"
                        >
                          + 添加色标
                        </button>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">方向</span>
                      <Segmented<GradientDirection>
                        value={direction}
                        onChange={setDirection}
                        options={DIRECTIONS.map((option) => ({
                          value: option.value,
                          label: `${option.icon} ${option.label}`,
                        }))}
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {GRADIENT_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => applyPreset(preset.stops)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-black text-slate-500 transition-all hover:border-indigo-300 hover:text-indigo-600"
                        >
                          <span
                            className="h-3.5 w-6 rounded"
                            style={{ background: `linear-gradient(90deg, ${preset.stops.join(', ')})` }}
                          />
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <ColorField label="前景色" value={solidColor} onChange={setSolidColor} />
                    <SwatchRow colors={SOLID_SWATCHES} activeColor={solidColor} onPick={setSolidColor} />
                  </>
                )}

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <ColorField
                    label={tab === 'qr' ? '背景色（建议浅色）' : '背景色'}
                    value={background}
                    onChange={setBackground}
                  />
                  <SwatchRow colors={BACKGROUND_SWATCHES} activeColor={background} onPick={setBackground} />
                </div>
              </section>
            </div>

            <div className="order-1 lg:order-2">
              <div className="sticky top-0 space-y-3">
                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex min-h-[200px] w-full items-center justify-center rounded-xl bg-slate-50 p-3">
                    {previewGrid ? (
                      <canvas ref={previewRef} className="max-w-full drop-shadow-sm" />
                    ) : (
                      <div className="px-6 text-center">
                        <p className="text-sm font-black text-slate-400">
                          {tab === 'qr' ? '输入内容后预览' : '输入文字后预览'}
                        </p>
                        {errorMessage ? (
                          <p className="mt-1 text-[11px] font-bold text-rose-400">{errorMessage}</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">图纸尺寸</p>
                    <p className="text-sm font-black text-slate-900">{sizeLabel} 颗豆</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">用色</p>
                    <p className="text-sm font-black text-slate-900">{uniqueColorCount} 种</p>
                  </div>
                </div>

                {buildResult.ok && buildResult.value.note ? (
                  <p className="rounded-xl bg-indigo-50 px-3 py-2 text-[11px] font-bold text-indigo-600">
                    {buildResult.value.note}
                  </p>
                ) : null}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!buildResult.ok}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-black text-slate-600 transition-all hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
                    </svg>
                    PNG
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={!buildResult.ok}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-600 px-4 py-3 text-sm font-black text-white shadow-md transition-all hover:from-fuchsia-600 hover:to-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    填入画布
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
