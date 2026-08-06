import React, { useState } from 'react';

interface FeedbackModalProps {
  source: string;
  onSubmit: (suggestion: string, contact: string) => void;
  onClose: () => void;
  getMailtoUrl: (suggestion: string, contact: string) => string;
}

const SOURCE_LABELS: Record<string, string> = {
  export: '导出图片后',
  ai_result: 'AI 生成后',
  manual: '用户主动反馈',
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  source,
  onSubmit,
  onClose,
  getMailtoUrl,
}) => {
  const [suggestion, setSuggestion] = useState('');
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!suggestion.trim()) return;
    onSubmit(suggestion.trim(), contact.trim());
    setSubmitted(true);
  };

  const sourceText = SOURCE_LABELS[source] || source;

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[1200] flex items-end sm:items-center justify-center p-0 sm:p-6 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] w-full max-w-sm shadow-2xl p-6 space-y-4 animate-[slideUp_0.3s_ease-out]"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
          onClick={e => e.stopPropagation()}>
          <div className="text-center space-y-3">
            <div className="text-4xl">💌</div>
            <h3 className="font-black text-lg text-slate-800">感谢你的反馈！</h3>
            <p className="text-sm text-slate-500">如果你愿意，可以通过邮件发送详细意见</p>
            <a
              href={getMailtoUrl(suggestion, contact)}
              className="inline-block w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-black text-sm transition-all active:scale-[0.98]"
            >
              📧 打开邮件发送反馈
            </a>
            <p className="text-[11px] text-slate-400">
              反馈邮箱：932351233@qq.com
            </p>
            <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600 font-bold">关闭</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[1200] flex items-end sm:items-center justify-center p-0 sm:p-6 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] w-full max-w-md shadow-2xl p-6 space-y-4 animate-[slideUp_0.3s_ease-out]"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-lg text-slate-800">帮助拼豆糕手变得更好 ✨</h3>
            <p className="text-xs text-slate-400 mt-0.5">有什么建议或想法？告诉我们吧</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Source tag */}
        {sourceText && (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500">
            <span>📍</span> {sourceText}
          </div>
        )}

        {/* Suggestion input */}
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">
            你的建议 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={suggestion}
            onChange={e => setSuggestion(e.target.value)}
            placeholder="比如：希望增加更多的拼豆色号、想要批量导出功能..."
            maxLength={500}
            rows={4}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 transition-all resize-none"
          />
        </div>

        {/* Contact input */}
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">
            联系方式（选填）
          </label>
          <input
            type="text"
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder="QQ / 微信 / 邮箱，方便我们回复你"
            maxLength={100}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 transition-all"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!suggestion.trim()}
          className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm transition-all active:scale-[0.98]"
        >
          💬 提交反馈
        </button>

        <p className="text-[10px] text-slate-400 text-center">
          不会收集任何个人信息，仅用于改进产品
        </p>
      </div>
    </div>
  );
};
