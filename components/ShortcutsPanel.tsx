import React from 'react';
import { TOOLS_INFO, SHORTCUTS } from '../types';

interface ShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsPanel: React.FC<ShortcutsPanelProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-900">快捷键与工具说明</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">✕</button>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-4">工具</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TOOLS_INFO.map((tool) => (
                <div
                  key={tool.type}
                  className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg border-2 border-slate-200 text-2xl">
                    {tool.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{tool.name}</span>
                      <kbd className="px-2 py-0.5 bg-slate-200 rounded text-xs font-mono font-bold text-slate-600">
                        {tool.shortcut}
                      </kbd>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{tool.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-4">快捷键</h3>
            <div className="space-y-2">
              {SHORTCUTS.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all"
                >
                  <span className="text-sm text-slate-700">{shortcut.action}</span>
                  <kbd className="px-3 py-1.5 bg-slate-200 rounded text-xs font-mono font-bold text-slate-600">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-4">画布操作</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🖱️</span>
                  <span className="font-bold text-slate-800">缩放</span>
                </div>
                <p className="text-xs text-slate-600">按住 <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 font-mono">Ctrl</kbd> + 滚动鼠标</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✋</span>
                  <span className="font-bold text-slate-800">移动画布</span>
                </div>
                <p className="text-xs text-slate-600">鼠标中键拖动 或 <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 font-mono">Space</kbd> + 拖动</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">↩️</span>
                  <span className="font-bold text-slate-800">撤销</span>
                </div>
                <p className="text-xs text-slate-600"><kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 font-mono">Z</kbd></p>
              </div>

              <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">↪️</span>
                  <span className="font-bold text-slate-800">重做</span>
                </div>
                <p className="text-xs text-slate-600"><kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 font-mono">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 font-mono">Z</kbd></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
