import React, { useState } from 'react';

interface OwnedPaletteModalProps {
  onClose: () => void;
  paletteGroups: Array<{ letter: string; colors: Array<{ hex: string; key: string }> }>;
  ownedColors: string[];
  toggleOwnedColor: (hex: string) => void;
  addOwnedColor: (hex: string) => void;
  addCanvasColors: () => void;
  clearOwnedColors: () => void;
  ownedOnlyMode: boolean;
  setOwnedOnlyMode: (v: boolean) => void;
}

/** 我的已有颜色 · 大屏展开色板：按色系分区的长条圆角色卡 + 右侧统计 */
export const OwnedPaletteModal: React.FC<OwnedPaletteModalProps> = ({
  onClose,
  paletteGroups,
  ownedColors,
  toggleOwnedColor,
  addOwnedColor,
  addCanvasColors,
  clearOwnedColors,
  ownedOnlyMode,
  setOwnedOnlyMode,
}) => {
  const [hexInput, setHexInput] = useState('');

  const totalColors = paletteGroups.reduce((sum, g) => sum + g.colors.length, 0);
  const ownedSet = new Set(ownedColors);
  const ownedCount = ownedColors.length;
  const pct = totalColors > 0 ? Math.round((ownedCount / totalColors) * 100) : 0;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[1400] flex items-center justify-center p-2 sm:p-6 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-center gap-2">
            <span className="text-lg">📦</span>
            <span className="font-black text-slate-800 text-sm">我的已有颜色</span>
            <span className="text-[10px] text-slate-400 font-bold">勾选手头已有的拼豆，映射时优先使用</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
          {/* 左侧：按色系分区的长条圆角色卡 */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
            {paletteGroups.map(group => {
              const ownedInGroup = group.colors.filter(c => ownedSet.has(c.hex)).length;
              return (
                <div key={group.letter}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-sm">
                      {group.letter}
                    </span>
                    <span className="text-[10px] font-black text-slate-500">{group.letter} 系列</span>
                    <span className="text-[10px] font-bold text-slate-400">
                      已选 {ownedInGroup}/{group.colors.length}
                    </span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                        style={{ width: `${group.colors.length > 0 ? (ownedInGroup / group.colors.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {group.colors.map(({ hex, key }) => {
                      const owned = ownedSet.has(hex);
                      return (
                        <button
                          key={hex}
                          onClick={() => toggleOwnedColor(hex)}
                          className={`flex items-center gap-2.5 rounded-2xl border-2 p-2 pr-3 text-left transition-all active:scale-[0.98] ${
                            owned
                              ? 'border-amber-400 bg-amber-50 shadow-[0_4px_14px_-4px_rgba(245,158,11,0.4)]'
                              : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
                          }`}
                        >
                          <span
                            className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl border shrink-0 shadow-inner ${owned ? 'border-amber-300' : 'border-slate-200'}`}
                            style={{ backgroundColor: hex }}
                          >
                            {owned && (
                              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-full text-[9px] text-amber-900 font-black flex items-center justify-center shadow">
                                ✓
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex flex-col">
                            <span className={`text-xs font-black ${owned ? 'text-amber-700' : 'text-slate-700'}`}>
                              {key}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 uppercase">{hex}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 右侧：统计信息 */}
          <div className="shrink-0 lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-100 bg-slate-50/80 px-5 py-4 space-y-4 overflow-y-auto">
            <div>
              <p className="text-[10px] font-black text-slate-500 mb-2">📊 已选统计</p>
              <div className="bg-white rounded-2xl p-4 space-y-3 shadow-sm border border-slate-100">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-black text-amber-500">{ownedCount}</span>
                    <span className="text-xs font-bold text-slate-400"> / {totalColors} 种</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400">{pct}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {paletteGroups.map(g => (
                    <div key={g.letter} className="text-center">
                      <span className={`inline-block w-6 h-6 rounded-lg text-[10px] font-black leading-6 ${ownedSet.size > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {g.letter}
                      </span>
                      <p className="text-[8px] font-bold text-slate-400 mt-0.5">
                        {g.colors.filter(c => ownedSet.has(c.hex)).length}/{g.colors.length}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {ownedColors.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-500 mb-2">🟡 已选色号（点击移除）</p>
                <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
                  <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {ownedColors.map(hex => {
                      // 从分区数据里找色号
                      let key = hex;
                      for (const g of paletteGroups) {
                        const found = g.colors.find(c => c.hex === hex);
                        if (found) { key = found.key; break; }
                      }
                      return (
                        <button
                          key={hex}
                          onClick={() => toggleOwnedColor(hex)}
                          title={`${key} · ${hex}（点击移除）`}
                          className="relative aspect-square rounded-lg border-2 border-white shadow-sm transition-all hover:scale-110 active:scale-95"
                          style={{ backgroundColor: hex }}
                        >
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-slate-700 rounded-full text-[7px] text-white font-black flex items-center justify-center">×</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-black text-slate-500 mb-2">➕ 添加颜色</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { addOwnedColor(hexInput); setHexInput(''); } }}
                  placeholder="#RRGGBB"
                  className="flex-1 min-w-0 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
                <button
                  onClick={() => { addOwnedColor(hexInput); setHexInput(''); }}
                  className="px-3 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-xl font-black text-xs transition-all active:scale-95"
                >
                  添加
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ownedOnlyMode}
                onChange={(e) => setOwnedOnlyMode(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span className="text-xs font-black text-slate-700">严格模式：只映射到已有颜色</span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={addCanvasColors}
                className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-black text-xs transition-all active:scale-95"
              >
                ＋ 从画布添加
              </button>
              <button
                onClick={clearOwnedColors}
                className="flex-1 py-2.5 bg-white hover:bg-red-50 border border-red-100 text-red-500 rounded-xl font-black text-xs transition-all active:scale-95"
              >
                清空
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
            >
              完成 ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
