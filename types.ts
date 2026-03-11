export type ColorHex = string;

export type ColorSystem = 'MARD' | 'COCO' | '漫漫' | '盼盼' | '咪小窝';

export interface PaletteColor {
  hex: string;
  key: string;
  count?: number;
}

export interface BeadGrid {
  name: string;
  description: string;
  grid: ColorHex[][];
  size: number;
}

export interface Bead3DLayer {
  grid: ColorHex[][];
  size: number;
  zIndex: number;
}

export interface Bead3D {
  layers: Bead3DLayer[];
  size: number;
  totalLayers: number;
}

export enum ViewType {
  TWO_D = 'TWO_D',
  THREE_D = 'THREE_D',
  SLICES = 'SLICES',
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
  LINE = 'LINE',
  RECT = 'RECT',
  CIRCLE = 'CIRCLE',
  SMART_PENCIL = 'SMART_PENCIL',
}

export enum PixelStyle {
  CIRCLE = 'CIRCLE',
  SQUARE = 'SQUARE',
  ROUNDED = 'ROUNDED',
}

export interface ToolInfo {
  type: ToolType;
  name: string;
  icon: string;
  shortcut: string;
  description: string;
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
    { id: 'doubao-seedream-4-5-251128', name: 'Doubao Seedream 4K', isImageModel: true },
    { id: 'doubao-seedream-4-5-241024', name: 'Doubao Seedream 2K', isImageModel: true },
    { id: 'doubao-pro-32k', name: 'Doubao Pro 32K', isImageModel: false },
    { id: 'doubao-lite-32k', name: 'Doubao Lite 32K', isImageModel: false },
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

export const TOOLS_INFO: ToolInfo[] = [
  { type: ToolType.PENCIL, name: '画笔', icon: '✏️', shortcut: 'B', description: '单击或拖动绘制单个像素' },
  { type: ToolType.ERASER, name: '橡皮', icon: '🧽', shortcut: 'E', description: '擦除像素，使其变为透明' },
  { type: ToolType.FILL, name: '填充', icon: '🪣', shortcut: 'G', description: '填充相连的同色区域' },
  { type: ToolType.PICKER, name: '吸色', icon: '🧪', shortcut: 'I', description: '吸取像素颜色' },
  { type: ToolType.LINE, name: '直线', icon: '📏', shortcut: 'L', description: '绘制直线' },
  { type: ToolType.RECT, name: '矩形', icon: '⬜', shortcut: 'R', description: '绘制矩形' },
  { type: ToolType.CIRCLE, name: '圆形', icon: '⭕', shortcut: 'C', description: '绘制圆形' },
  { type: ToolType.SMART_PENCIL, name: '智能画笔', icon: '✨', shortcut: 'M', description: '根据底图颜色自动切换颜色' },
];

export const PIXEL_STYLES = [
  { value: PixelStyle.CIRCLE, name: '圆形', icon: '⚪' },
  { value: PixelStyle.SQUARE, name: '方形', icon: '⬜' },
  { value: PixelStyle.ROUNDED, name: '圆角', icon: '🔵' },
];

export const SHORTCUTS = [
  { key: 'B', action: '画笔工具' },
  { key: 'E', action: '橡皮工具' },
  { key: 'G', action: '填充工具' },
  { key: 'I', action: '吸色工具' },
  { key: 'L', action: '直线工具' },
  { key: 'R', action: '矩形工具' },
  { key: 'C', action: '圆形工具' },
  { key: 'M', action: '智能画笔工具' },
  { key: 'Ctrl + 滚轮', action: '缩放画布' },
  { key: '中键拖动', action: '移动画布' },
  { key: 'Space + 拖动', action: '移动画布' },
  { key: 'Ctrl + Z', action: '撤销' },
  { key: 'Ctrl + Shift + Z', action: '重做' },
  { key: 'Delete / Backspace', action: '清空选区' },
  { key: '[', action: '减小画笔大小' },
  { key: ']', action: '增大画笔大小' },
];

export const VIEW_TYPES = [
  { value: ViewType.TWO_D, name: '2D视图', icon: '⬜' },
  { value: ViewType.THREE_D, name: '3D立体', icon: '🧊' },
  { value: ViewType.SLICES, name: '分层切片', icon: '📚' },
];

export const PALETTE_PRESETS = [
  { id: 'all', name: '全色板', count: 0 },
  { id: '168', name: '168色', count: 168 },
  { id: '144', name: '144色', count: 144 },
  { id: '96', name: '96色', count: 96 },
  { id: '48', name: '48色', count: 48 },
  { id: 'custom', name: '自定义', count: 0 },
];

export interface PaletteConfig {
  selectedPreset: string;
  maxColors: number;
  mergeThreshold: number;
  showColorKeys: boolean;
  selectedColorSystem: ColorSystem;
}
