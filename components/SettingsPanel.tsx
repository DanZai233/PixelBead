import React, { useState, useEffect } from 'react';
import { AIProvider, AIConfig, AI_MODELS, DEFAULT_ENDPOINTS } from '../types';

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
  const [model, setModel] = useState(currentConfig?.model || AI_MODELS[AIProvider.OPENAI][0]?.id);
  const [endpoint, setEndpoint] = useState(currentConfig?.endpoint || DEFAULT_ENDPOINTS[AIProvider.OPENAI]);
  const [imageUrlModel, setImageUrlModel] = useState(currentConfig?.imageUrlModel || '');
  const [showApiKey, setShowApiKey] = useState(false);

  const models = AI_MODELS[provider] || [];

  useEffect(() => {
    if (currentConfig) {
      setProvider(currentConfig.provider);
      setApiKey(currentConfig.apiKey);
      setModel(currentConfig.model || AI_MODELS[currentConfig.provider][0]?.id);
      setEndpoint(currentConfig.endpoint || DEFAULT_ENDPOINTS[currentConfig.provider] || '');
      setImageUrlModel(currentConfig.imageUrlModel || '');
    }
  }, [currentConfig]);

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    const newModels = AI_MODELS[newProvider];
    if (newModels.length > 0) {
      setModel(newModels[0].id);
    }
    const defaultEndpoint = DEFAULT_ENDPOINTS[newProvider];
    setEndpoint(defaultEndpoint || '');
    
    if (newProvider === AIProvider.GEMINI) {
      setImageUrlModel(newModels[0]?.id || '');
    } else {
      const imageModel = newModels.find(m => (m as any).isImageModel);
      setImageUrlModel(imageModel?.id || '');
    }
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      alert('请输入 API Key');
      return;
    }
    if (!endpoint.trim() && provider !== AIProvider.GEMINI) {
      alert('请输入 API 接入点');
      return;
    }
    onSave({
      provider,
      apiKey,
      model: model || undefined,
      endpoint: endpoint || undefined,
      imageUrlModel: imageUrlModel || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-900 italic">AI 设置</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
              AI 服务商
            </label>
            <div className="grid grid-cols-2 gap-2">
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
                    <span className="font-bold text-sm">{getProviderName(key as AIProvider)}</span>
                    {provider === key && <span className="text-indigo-500">✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

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

          {provider !== AIProvider.GEMINI && (
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                API 接入点 (Endpoint)
              </label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:border-indigo-500 outline-none"
              />
              <p className="text-[10px] text-slate-400">
                {provider === AIProvider.VOLCENGINE && '火山引擎接入点：https://ark.cn-beijing.volces.com/api/v3'}
                {provider === AIProvider.DEEPSEEK && 'DeepSeek 不支持图像生成，推荐使用火山引擎 Seedream 模型'}
                {provider === AIProvider.OPENAI && 'OpenAI 接入点：https://api.openai.com/v1'}
                {provider === AIProvider.OPENROUTER && 'OpenRouter 接入点：https://openrouter.ai/api/v1'}
                {provider === AIProvider.CUSTOM && '自定义服务接入点（需兼容 OpenAI API 格式）'}
              </p>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
              模型名称
            </label>
            <div className="space-y-2">
              {models.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {models.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        model === m.id
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="输入模型名称，例如: doubao-1-5-pro-32k-250115"
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:border-indigo-500 outline-none font-mono text-sm"
              />
              <p className="text-[10px] text-slate-400">
                {provider === AIProvider.VOLCENGINE && '火山引擎图像模型：doubao-seedream-4-5-251128（推荐）'}
                {provider === AIProvider.DEEPSEEK && 'DeepSeek 不支持图像生成'}
                {provider === AIProvider.OPENAI && 'OpenAI 文本模型（用于触发图像生成）：gpt-4o'}
                {provider === AIProvider.OPENROUTER && 'OpenRouter 图像生成模型：openai/dall-e-3'}
                {provider === AIProvider.CUSTOM && '请根据服务商文档填写模型名称'}
              </p>
            </div>
          </div>

          {provider !== AIProvider.GEMINI && (
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                图像生成模型 (可选，如不填则使用聊天模型)
              </label>
              <input
                type="text"
                value={imageUrlModel}
                onChange={(e) => setImageUrlModel(e.target.value)}
                placeholder="例如: dall-e-3, stable-diffusion-xl"
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:border-indigo-500 outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                如果服务商的图像生成模型与聊天模型不同，请在此指定
              </p>
            </div>
          )}

          {provider === AIProvider.VOLCENGINE && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="font-bold text-amber-800 text-sm mb-2">火山引擎注意事项</h3>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>火山引擎图像生成需要至少 2048x2048 像素（2K）</li>
                <li>推荐使用 OpenAI、OpenRouter 或 Gemini 服务商</li>
                <li>如果必须使用火山引擎，请耐心等待较长时间</li>
                <li>API Key 格式：Bearer Token</li>
              </ul>
            </div>
          )}

          {provider === AIProvider.DEEPSEEK && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="font-bold text-amber-800 text-sm mb-2">DeepSeek 注意事项</h3>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>DeepSeek 仅支持文本模型，不支持图像生成</li>
                <li>请使用 OpenAI、OpenRouter 或 Gemini</li>
                <li>或使用火山引擎的 doubao-seedream 模型</li>
              </ul>
            </div>
          )}

          {provider === AIProvider.CUSTOM && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="font-bold text-amber-800 text-sm mb-2">自定义接入说明</h3>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>确保你的服务商兼容 OpenAI API 格式</li>
                <li>API 接入点需要包含完整路径，如：https://api.example.com/v1</li>
                <li>图像生成模型请填写对应的模型 ID</li>
              </ul>
            </div>
          )}
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
    [AIProvider.CUSTOM]: '自定义接入',
  };
  return names[provider];
}
