import React, { useState } from 'react';
import type { GenHistoryItem } from '../hooks/useGenerationHistory';

interface AIResultModalProps {
  imageDataUrl: string;
  prompt: string;
  referenceImage: string | null;
  gridWidth: number;
  gridHeight: number;
  history: GenHistoryItem[];
  onClose: () => void;
  onPublishToGallery: (prefillTitle: string) => void;
  onRemoveHistory: (id: string) => void;
  onClearHistory: () => void;
}

export const AIResultModal: React.FC<AIResultModalProps> = ({
  imageDataUrl,
  prompt,
  referenceImage,
  gridWidth,
  gridHeight,
  history,
  onClose,
  onPublishToGallery,
  onRemoveHistory,
  onClearHistory,
}) => {
  const [view, setView] = useState<'result' | 'history'>('result');

  const handleDownload = () => {
    const a = document.createElement('a');
    const ts = Date.now();
    a.href = imageDataUrl;
    a.download = 'pixelbead-ai-' + ts + '.png';
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-6 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
        onClick={e => e.stopPropagation()}>

        {/* Header with tab switcher */}
        <div className="sticky top-0 bg-white/95 backdrop-blur z-10 px-5 pt-5 pb-3 rounded-t-[2rem] sm:rounded-t-[2.5rem] flex items-center justify-between gap-3">
          <div className="flex bg-slate-100 rounded-xl p-0.5">
            <button
              className={'px-4 py-1.5 rounded-lg text-xs font-bold transition-all ' + (view === 'result' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400')}
              onClick={() => setView('result')}>生成结果</button>
            <button
              className={'px-4 py-1.5 rounded-lg text-xs font-bold transition-all ' + (view === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400')}
              onClick={() => setView('history')}>
              历史记录 {history.length > 0 ? '(' + history.length + ')' : ''}</button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {view === 'result' ? (
          <div className="px-5 pb-6 space-y-4">
            {/* Image preview */}
            <div className="bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center" style={{ minHeight: '200px', maxHeight: '320px' }}>
              <img src={imageDataUrl} alt="AI 生成结果" className="w-full h-full object-contain" />
            </div>

            {/* Quick info */}
            <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3">
              <span className="font-mono">{gridWidth}×{gridHeight}</span>
              {prompt && <span className="truncate max-w-[200px]">"{prompt}"</span>}
              {referenceImage && <span className="text-indigo-500">📷 图生图</span>}
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5">
              <button
                onClick={handleDownload}
                className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-black text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                保存原图到本地
              </button>

              <button
                onClick={() => onPublishToGallery(prompt || 'AI 生成作品')}
                className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-2xl font-black text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                发布到素材广场
              </button>
            </div>

            {/* Color conversion reminder */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-2">
              <p className="font-black text-amber-700 flex items-center gap-1.5">⚠️ 重要：记得转换色号</p>
              <p className="text-amber-600 leading-relaxed">AI 生成的图片颜色可能超出拼豆色号范围，建议导入画布后使用 <span className="font-bold">配色方案</span> 功能将颜色映射到标准拼豆色号，避免颜色杂乱。</p>
            </div>

            {/* iOS App promo */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-3xl">📱</span>
                <div>
                  <p className="font-black text-sm text-indigo-800">在 App 上体验更佳</p>
                  <p className="text-[11px] text-indigo-500">随时随地创作拼豆图纸</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a href="https://apps.apple.com/cn/app/拼豆糕手/id6743892615" target="_blank" rel="noopener" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs text-center transition-all">
                  🍎 下载 iOS App
                </a>
                <a href="https://apps.apple.com/cn/app/拼豆糕手/id6743892615?action=write-review" target="_blank" rel="noopener" className="flex-1 py-2.5 bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-600 rounded-xl font-black text-xs text-center transition-all">
                  ⭐ 给好评
                </a>
              </div>
            </div>

            {/* Upload encouragement */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-1.5">
              <p className="font-black text-emerald-700 flex items-center gap-1.5">📤 乐于分享</p>
              <p className="text-emerald-600 leading-relaxed">在素材广场发布你的作品，让更多拼豆爱好者看到！发布后将永久保存在广场中。</p>
            </div>
          </div>
        ) : (
          /* History tab */
          <div className="px-5 pb-6 space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-3">🖼️</div>
                <p className="font-bold text-sm">暂无生成历史</p>
                <p className="text-xs mt-1">生成图片后将自动保存在这里</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">共 {history.length} 条记录</span>
                  <button onClick={onClearHistory} className="text-xs text-red-400 hover:text-red-500 font-bold">清空历史</button>
                </div>
                {history.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-2.5 group">
                    <img src={item.imageDataUrl} className="w-16 h-16 rounded-lg object-cover bg-white border border-slate-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{item.prompt || '无描述'}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.gridWidth}×{item.gridHeight} · {item.referenceImage ? '图生图' : '文生图'}</p>
                    </div>
                    <button onClick={() => onRemoveHistory(item.id)} className="p-1.5 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
