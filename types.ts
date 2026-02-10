export type ColorHex = string;

export interface BeadGrid {
  name: string;
  description: string;
  grid: ColorHex[][];
  size: number;
}

export interface ColorInfo {
  hex: ColorHex;
  name: string;
  count: number;
}

export enum ToolType {
  PENCIL = 'PENCIL',
  ERASER = 'ERASER',
  FILL = 'FILL',
  PICKER = 'PICKER',
}

export enum AIProvider {
  OPENAI = 'OPENAI',
  OPENROUTER = 'OPENROUTER',
  DEEPSEEK = 'DEEPSEEK',
  VOLCENGINE = 'VOLCENGINE',
  GEMINI = 'GEMINI',
  CUSTOM = 'CUSTOM',
}

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
  endpoint?: string;
  imageUrlModel?: string;
}

export const DEFAULT_COLORS: ColorHex[] = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#008000', '#FFFFE0',
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6366F1',
  '#8B5CF6', '#EC4899', '#F43F5E', '#14B8A6', '#F97316'
];

export const AI_MODELS = {
  [AIProvider.OPENAI]: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'dall-e-3', name: 'DALL-E 3', isImageModel: true },
  ],
  [AIProvider.OPENROUTER]: [
    { id: 'openai/gpt-4o', name: 'GPT-4o (via OpenRouter)' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
    { id: 'openai/dall-e-3', name: 'DALL-E 3 (via OpenRouter)', isImageModel: true },
  ],
  [AIProvider.DEEPSEEK]: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat' },
    { id: 'deepseek-coder', name: 'DeepSeek Coder' },
    { id: 'deepseek-aider', name: 'DeepSeek Aider' },
  ],
  [AIProvider.VOLCENGINE]: [
    { id: 'doubao-pro-32k', name: 'Doubao Pro 32K' },
    { id: 'doubao-lite-32k', name: 'Doubao Lite 32K' },
    { id: 'doubao-pro-256k', name: 'Doubao Pro 256K' },
  ],
  [AIProvider.GEMINI]: [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', isImageModel: true },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', isImageModel: true },
  ],
  [AIProvider.CUSTOM]: [],
};

export const DEFAULT_ENDPOINTS = {
  [AIProvider.OPENAI]: 'https://api.openai.com/v1',
  [AIProvider.OPENROUTER]: 'https://openrouter.ai/api/v1',
  [AIProvider.DEEPSEEK]: 'https://api.deepseek.com/v1',
  [AIProvider.VOLCENGINE]: 'https://ark.cn-beijing.volces.com/api/v3',
  [AIProvider.GEMINI]: '',
  [AIProvider.CUSTOM]: '',
};
