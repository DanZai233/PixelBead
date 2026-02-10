import React, { useState, useEffect } from 'react';
import { AIProvider, AIConfig, AI_MODELS } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AIConfig) => void;
  currentConfig?: AIConfig;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig,
}) => {
  const [provider, setProvider] = useState<AIProvider>(currentConfig?.provider || AIProvider.OPENAI);
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [model, setModel] = useState(currentConfig?.model || AI_MODELS[provider][0]?.id);
  const [baseUrl, setBaseUrl] = useState(currentConfig?.baseUrl || '');
  const [showApiKey, setShowApiKey] = useState(false);

  const models = AI_MODELS[provider] || [];

  useEffect(() => {
    if (currentConfig) {
      setProvider(currentConfig.provider);
      setApiKey(currentConfig.apiKey);
      setModel(currentConfig.model || AI_MODELS[provider][0]?.id);
      setBaseUrl(currentConfig.baseUrl || '');
    }
  }, [currentConfig]);

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    const newModels = AI_MODELS[newProvider];
    if (newModels.length > 0) {
      setModel(newModels[0].id);
    }
    if (newProvider === AIProvider.OPENROUTER) {
      setBaseUrl('https://openrouter.ai/api/v1');
    } else {
      setBaseUrl('');
    }
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      alert('请输入 API Key');
      return;
    }
    onSave({
      provider,
      apiKey,
      model,
      baseUrl: baseUrl || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-900 italic">AI 设置</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
              AI 服务商
            </label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(AI_MODELS).map(([key, _]) => (
                <button
                  key={key}
                  onClick={() => handleProviderChange(key as AIProvider)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    provider === key
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{getProviderName(key as AIProvider)}</span>
                    {provider === key && <span className="text-indigo-500">✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
              模型
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:border-indigo-500 outline-none"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {provider === AIProvider.OPENROUTER && (
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                Base URL (可选)
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://openrouter.ai/api/v1"
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:border-indigo-500 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`输入 ${getProviderName(provider)} API Key`}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:border-indigo-500 outline-none pr-12"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showApiKey ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
};

function getProviderName(provider: AIProvider): string {
  const names: Record<AIProvider, string> = {
    [AIProvider.OPENAI]: 'OpenAI',
    [AIProvider.OPENROUTER]: 'OpenRouter',
    [AIProvider.DEEPSEEK]: 'DeepSeek',
    [AIProvider.VOLCENGINE]: '火山引擎',
    [AIProvider.GEMINI]: 'Google Gemini',
  };
  return names[provider];
}
