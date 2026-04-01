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
  HAND = 'HAND',
  SELECT = 'SELECT',
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

export const DEFAULT_COLORS: ColorHex[] = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#008000', '#FFFFE0',
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6366F1',
  '#8B5CF6', '#EC4899', '#F43F5E', '#14B8A6', '#F97316'
];

export const TOOLS_INFO: ToolInfo[] = [
  { type: ToolType.PENCIL, name: '画笔', icon: '✏️', shortcut: 'B', description: '单击或拖动绘制单个像素' },
  { type: ToolType.ERASER, name: '橡皮', icon: '🧽', shortcut: 'E', description: '擦除像素，使其变为透明' },
  { type: ToolType.FILL, name: '填充', icon: '🪣', shortcut: 'G', description: '填充相连的同色区域' },
  { type: ToolType.PICKER, name: '吸色', icon: '🧪', shortcut: 'I', description: '吸取像素颜色' },
  { type: ToolType.LINE, name: '直线', icon: '📏', shortcut: 'L', description: '绘制直线' },
  { type: ToolType.RECT, name: '矩形', icon: '⬜', shortcut: 'R', description: '绘制矩形' },
  { type: ToolType.CIRCLE, name: '圆形', icon: '⭕', shortcut: 'C', description: '绘制圆形' },
  { type: ToolType.SMART_PENCIL, name: '智能画笔', icon: '✨', shortcut: 'M', description: '根据底图颜色自动切换颜色' },
  { type: ToolType.HAND, name: '拖拽', icon: '✋', shortcut: 'H', description: '拖动画布移动视图' },
  { type: ToolType.SELECT, name: '框选', icon: '⬚', shortcut: 'S', description: '框选区域进行复制、粘贴等操作' },
];

/** 移动端 2D 画布底部快捷栏（与侧栏全量工具重复，便于快速切换；智能画笔优先展示） */
export const MOBILE_2D_DOCK_TOOL_TYPES: ToolType[] = [
  ToolType.SMART_PENCIL,
  ToolType.PENCIL,
  ToolType.ERASER,
  ToolType.FILL,
  ToolType.PICKER,
  ToolType.HAND,
  ToolType.SELECT,
];

export const MOBILE_2D_DOCK_TOOLS: ToolInfo[] = MOBILE_2D_DOCK_TOOL_TYPES.map((type) => {
  const info = TOOLS_INFO.find((t) => t.type === type);
  if (!info) throw new Error(`Missing tool ${type}`);
  return info;
});

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
  { key: 'H', action: '拖拽工具' },
  { key: 'S', action: '框选工具' },
  { key: 'Ctrl + 滚轮', action: '缩放画布' },
  { key: '中键拖动', action: '移动画布' },
  { key: 'Space + 拖动', action: '移动画布' },
  { key: 'Ctrl + Z', action: '撤销' },
  { key: 'Ctrl + Shift + Z', action: '重做' },
  { key: 'Delete / Backspace', action: '清空选区' },
  { key: 'Ctrl + C', action: '复制选区' },
  { key: 'Ctrl + V', action: '粘贴选区' },
  { key: 'Ctrl + X', action: '剪切选区' },
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

export interface Selection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export const BRUSH_SIZES = [
  { value: 1, name: '1x1' },
  { value: 2, name: '2x2' },
  { value: 3, name: '3x3' },
  { value: 4, name: '4x4' },
  { value: 5, name: '5x5' },
];
