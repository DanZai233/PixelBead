# Coding Conventions

**Analysis Date:** 2026-03-27

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `BeadCanvas.tsx`, `ColorPicker.tsx`)
- Utilities: camelCase with `.ts` extension (e.g., `colorUtils.ts`, `colorSystemUtils.ts`)
- Services: camelCase with `.ts` extension (e.g., `aiService.ts`, `upstashService.ts`)
- Type definitions: `types.ts` (centralized type file)
- API routes: kebab-case with `.ts` extension (e.g., `admin/login.ts`, `material/[id].ts`)

**Functions:**
- React components: PascalCase with React.FC type annotation
  ```typescript
  export const BeadCanvas: React.FC<BeadCanvasProps> = ({ grid, zoom, ... }) => {
  ```
- Utility functions: camelCase
  ```typescript
  export function hexToRgb(hex: string): { r: number; g: number; b: number } | null
  export const generatePixelArtImage = async (prompt: string, config: AIConfig): Promise<string>
  ```
- Event handlers: camelCase with `handle` prefix
  ```typescript
  const handleSave = () => { ... }
  const handleProviderChange = (newProvider: AIProvider) => { ... }
  ```

**Variables:**
- State variables: camelCase
  ```typescript
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  ```
- Ref variables: camelCase with `Ref` suffix for DOM refs
  ```typescript
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  ```

**Types:**
- Type aliases: PascalCase
  ```typescript
  export type ColorHex = string;
  export type ColorSystem = 'MARD' | 'COCO' | '漫漫' | '盼盼' | '咪小窝';
  ```
- Interfaces: PascalCase
  ```typescript
  export interface PaletteColor {
    hex: string;
    key: string;
    count?: number;
  }
  export interface BeadCanvasProps {
    grid: string[][];
    zoom: number;
    onPointerDown: (row: number, col: number) => void;
  }
  ```
- Enums: PascalCase with UPPER_CASE values
  ```typescript
  export enum ToolType {
    PENCIL = 'PENCIL',
    ERASER = 'ERASER',
    FILL = 'FILL',
  }
  ```

## Code Style

**Formatting:**
- No formal formatting configuration (no `.prettierrc*`, `eslint.config.*`, or `biome.json`)
- Tailwind CSS is loaded via CDN, not installed as dependency
- Standard JavaScript/TypeScript formatting observed throughout codebase

**Linting:**
- ESLint script exists in `package.json` (`"lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"`)
- No `.eslintrc*` or `eslint.config.*` file present
- `eslint` is NOT in `devDependencies` - lint command will fail
- Alternative: Use `npx tsc --noEmit` for static analysis (recommended)

## Import Organization

**Order:**
1. External libraries (React, third-party packages)
2. Local imports (types, services, components, utilities)
3. Side-effect imports (if any)

**Pattern:**
```typescript
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ToolType, DEFAULT_COLORS, AIConfig, PixelStyle } from './types';
import { generatePixelArtImage } from './services/aiService';
import { BeadCanvas } from './components/BeadCanvas';
import { generateExportImage } from './utils/colorUtils';
```

**Path Aliases:**
- `@/*` maps to root directory (configured in `tsconfig.json`)
  ```json
  "paths": {
    "@/*": ["./*"]
  }
  ```
- Currently not used in codebase (all imports use relative paths)

## Error Handling

**Patterns:**
- Async functions use try-catch blocks
- Errors logged to console (both `console.error` and `console.warn`)
- User-facing errors via `alert()` calls
- Graceful degradation: return `null` or empty values on error

```typescript
export async function saveToUpstash(...): Promise<string | null> {
  try {
    // ... logic
    return key;
  } catch (error) {
    console.error('保存到 Upstash 失败:', error);
    return null;
  }
}

const handleSave = () => {
  if (!apiKey.trim()) {
    alert('请输入 API Key');
    return;
  }
  // ...
};
```

**Console logging usage:**
- `console.error` for error conditions (found 33 occurrences)
- `console.warn` for warnings (rare, e.g., `console.warn('findClosestColor: palette is empty')`)
- No structured logging framework

## Logging

**Framework:** Native `console` API (no logging library)

**Patterns:**
- Error logging: `console.error('Error description:', errorObject)`
- Warning logging: `console.warn('Warning message')`
- No debug/info logging observed
- No log levels or conditional logging
- Logs are always active (no development-only mode)

## Comments

**When to Comment:**
- Chinese comments used for function documentation
- Inline comments rare, mainly for complex logic
- No JSDoc/TSDoc documentation blocks

**Observed patterns:**
```typescript
// RGB 颜色转换
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // ...
}

// RGB 转 HSL
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  // ...
}

// 素材广场相关接口
export interface MaterialData {
  // ...
}
```

**JSDoc/TSDoc:**
- Not used throughout codebase
- No parameter or return value documentation in comment format
- Type definitions serve as documentation

## Function Design

**Size:**
- No enforced size limits
- Large functions observed:
  - `App.tsx`: 2602 lines (main component with extensive state management)
  - `BeadCanvas.tsx`: 624 lines (complex canvas rendering logic)
  - `MaterialGallery.tsx`: 563 lines (gallery component with API interactions)

**Parameters:**
- Object props for React components (Props interfaces)
- Individual parameters for utility functions
- Destructuring commonly used in component parameters

```typescript
// Component with Props interface
export const BeadCanvas: React.FC<BeadCanvasProps> = ({
  grid,
  gridWidth,
  gridHeight,
  zoom,
  onPointerDown,
  onPointerMove,
  // ...
}) => { ... }

// Utility function with individual parameters
export function colorDistance(hex1: string, hex2: string): number {
  // ...
}
```

**Return Values:**
- Async functions return `Promise<T> | Promise<T | null>`
- Null returns indicate failure/empty state
- Explicit typing for all return values

## Module Design

**Exports:**
- Named exports preferred for multiple exports
- Default exports not used (all use `export const` or `export function`)
- Types exported alongside implementation

```typescript
// types.ts - multiple named exports
export type ColorHex = string;
export interface PaletteColor { ... }
export enum ToolType { ... }
export const DEFAULT_COLORS: ColorHex[] = [...];
```

**Barrel Files:**
- None used
- Each file exports its own types/functions directly

## TypeScript Usage Patterns

**Type annotations:**
- Explicit typing for all function parameters and return values
- Component props defined in separate interface
- State typed with generic hooks: `useState<Type>(initialValue)`
- Ref typed with HTML element types: `useRef<HTMLCanvasElement>(null)`

**TypeScript configuration:**
- Target: ES2022
- Module: ESNext
- JSX transform: `react-jsx`
- Path alias: `@/*` → `./`
- Skip lib check: enabled
- Strict mode: not explicitly enabled (defaults to loose mode)

## React Component Patterns

**Component structure:**
1. Imports (React, types, services, components, utilities)
2. Props interface definition (if needed)
3. Component declaration with `React.FC<Props>`
4. State initialization with `useState`
5. Refs with `useRef`
6. Effects with `useEffect`
7. Callbacks with `useCallback`
8. Memoized values with `useMemo` (rarely used)
9. Render logic

**Example pattern:**
```typescript
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ColorHex } from '../types';

interface ColorPickerProps {
  selectedColor: ColorHex;
  onColorChange: (color: ColorHex) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorChange,
  isOpen,
  onClose,
}) => {
  const [hexInput, setHexInput] = useState(selectedColor.replace('#', ''));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingHue = useRef(false);

  useEffect(() => {
    if (isOpen) {
      updateHSLFromHex(selectedColor);
    }
  }, [isOpen, selectedColor]);

  const handleHexInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // ...
  }, []);

  return (
    // JSX
  );
};
```

## File Organization Patterns

**Directory structure:**
```
root/
├── components/          # React components
├── services/            # External API integrations
├── utils/              # Utility functions
├── api/                # Vercel API routes (excluded from tsconfig)
├── types.ts            # Centralized type definitions
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
└── vite.config.ts      # Vite configuration
```

**Component patterns:**
- Each component in its own file
- Component name matches file name (e.g., `ColorPicker.tsx` exports `ColorPicker`)
- Props interface defined in same file, before component
- No barrel files for component groups

## CSS/Styling Patterns

**Framework:** Tailwind CSS (via CDN)
- Inline utility classes
- Custom styles defined in `<style>` block in `index.html`
- No CSS modules or styled-components
- No separate CSS/SCSS files

**Custom styles (index.html):**
```css
.bead-shadow { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06), 0 2px 4px 0 rgba(0, 0, 0, 0.15); }
.bg-dots { background-image: radial-gradient(#cbd5e1 1px, transparent 1px); }
.no-scrollbar { scrollbar-width: none; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; overflow: hidden; }
```

## Code Review Practices

**No formal code review process documented:**
- No CODEOWNERS file
- No pull request template
- No contribution guidelines
- No pre-commit hooks configured

**Quality checks available:**
- TypeScript compilation: `npx tsc --noEmit`
- Build command: `npm run build` (runs `tsc && vite build`)
- ESLint command exists but will fail without configuration

## Recommendations

**Missing conventions that should be established:**
1. Add ESLint configuration with React and TypeScript rules
2. Add Prettier for consistent formatting
3. Establish maximum function/component size limits
4. Add JSDoc/TSDoc for complex functions
5. Replace `alert()` with proper error UI
6. Implement proper error boundary components
7. Use path aliases (`@/`) consistently for cleaner imports
8. Add logging framework for production-ready error tracking
9. Establish git commit message conventions
10. Set up pre-commit hooks (husky, lint-staged)

---

*Convention analysis: 2026-03-27*
