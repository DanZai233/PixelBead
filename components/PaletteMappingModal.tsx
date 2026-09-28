import React, { useState } from 'react';
import type { ColorSystem, PaletteMappingRow } from '../types';

interface PaletteMappingModalProps {
  rows: PaletteMappingRow[];
  paletteColors: Array<{ hex: string; key: string }>;
  selectedColorSystem: ColorSystem;
  onClose: () => void;
  onReplaceColor: (sourceHex: string, targetHex: string) => void;
  onHighlightColor: (hex: string) => void;
}

const getDistanceStyle = (distance: number) => {
  if (distance <= 8) return 'bg-emerald-50 text-emerald-700';
  if (distance <= 18) return 'bg-amber-50 text-amber-700';
  return 'bg-rose-50 text-rose-700';
};

const getDistanceLabel = (distance: number) => {
  if (distance <= 8) return '接近';
  if (distance <= 18) return '有差异';
  return '差异较大';
};

export const PaletteMappingModal: React.FC<PaletteMappingModalProps> = ({
  rows,
  paletteColors,
  selectedColorSystem,
  onClose,
  onReplaceColor,
  onHighlightColor,
}) => {
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());

  const togglePositions = (key: string) => {
    setExpandedPositions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[1750] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-slate-50 shadow-2xl sm:max-h-[88vh] sm:rounded-3xl">
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-black text-slate-900">色板映射对照</h2>
              <p className="mt-0.5 text-xs font-bold text-slate-500">
                {selectedColorSystem} · 可检查色差、查看位置并手动替换
              </p>
            </div>
            <button onClick={onClose} className="shrink-0 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="space-y-3">
            {rows.map(row => {
              const rowKey = `${row.sourceHex}-${row.targetHex}`;
              const expanded = expandedPositions.has(rowKey);
              const visiblePositions = expanded ? row.positions : row.positions.slice(0, 12);

              return (
                <div key={rowKey} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-10 w-10 rounded-2xl border border-slate-100 shadow-inner"
                        style={{ backgroundColor: row.sourceHex }}
                      />
                      <svg className="h-4 w-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <div
                        className="h-10 w-10 rounded-2xl border border-slate-100 shadow-inner"
                        style={{ backgroundColor: row.targetHex }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-mono text-xs font-black text-slate-800">{row.key}</p>
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black ${getDistanceStyle(row.distance)}`}>
                          {getDistanceLabel(row.distance)} · {Math.round(row.distance)}
                        </span>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-black text-slate-500">
                          {row.count.toLocaleString()} 处
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[10px] font-bold uppercase text-slate-400">
                        {row.sourceHex} → {row.targetHex}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => onHighlightColor(row.targetHex)}
                        className="rounded-lg bg-slate-100 px-2.5 py-2 text-[11px] font-black text-slate-600 transition-all hover:bg-slate-200"
                      >
                        高亮
                      </button>
                      <select
                        value={row.targetHex}
                        onChange={event => onReplaceColor(row.sourceHex, event.target.value)}
                        className="max-w-32 rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] font-black text-slate-600 outline-none focus:border-indigo-400"
                      >
                        {paletteColors.map(color => (
                          <option key={color.hex} value={color.hex}>
                            {color.key || color.hex}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">使用位置</p>
                      {row.positions.length > 12 && (
                        <button
                          onClick={() => togglePositions(rowKey)}
                          className="text-[10px] font-black text-indigo-600"
                        >
                          {expanded ? '收起' : `展开全部 ${row.positions.length} 处`}
                        </button>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {visiblePositions.map(({ row: cellRow, col }, index) => (
                        <span
                          key={`${rowKey}-${cellRow}-${col}-${index}`}
                          className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[9px] font-black text-slate-500"
                        >
                          R{cellRow + 1}C{col + 1}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-black text-white transition-all active:scale-95 hover:bg-indigo-700"
          >
            完成检查
          </button>
        </div>
      </div>
    </div>
  );
};
