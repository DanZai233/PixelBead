
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

export const DEFAULT_COLORS: ColorHex[] = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#008000', '#FFFFE0',
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6366F1',
  '#8B5CF6', '#EC4899', '#F43F5E', '#14B8A6', '#F97316'
];
