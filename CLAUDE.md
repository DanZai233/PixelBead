<!-- GSD:project-start source:PROJECT.md -->
## Project

**PixelBead Mobile App**

将 PixelBead Web 应用转换为原生移动应用（Android 和 iOS），使用 React Native 技术栈实现跨平台开发。保留 Web 版本的所有核心功能，优化移动端用户体验，支持完全离线操作，并通过应用商店分发触达更多用户。

**Core Value:** 移动用户可以随时随地设计拼豆作品，离线使用核心编辑功能，通过应用商店触达更广泛的用户群。

### Constraints

- **技术栈**: React Native + TypeScript — 继承现有 React 技术栈，减少学习成本
- **代码隔离**: 移动端代码在独立子目录 `/mobile`，不影响 Web 代码 — 防止误触发现有的 Vercel 部署
- **代码共享**: Web 端和移动端共享业务逻辑（颜色系统、工具函数） — 减少重复开发，保持一致性
- **部署**: Web 版和移动端分开部署 — Web 版通过 Vercel，移动端通过应用商店
- **离线支持**: 核心编辑功能必须完全离线可用 — 素材广场除外，仅在线可用
- **数据库**: 移动端需要本地存储方案（AsyncStorage 或 SQLite） — Web 版使用 Redis/MongoDB，移动端不同
- **性能**: 必须支持大网格（200x200）流畅操作 — 与 Web 版性能要求一致
- **UI 适配**: 需要为移动端重新设计 UI — 优化触摸交互，适配不同屏幕尺寸
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.8.2 - All application code (components, services, utilities)
- HTML5 - Application markup and template
- JSON - Configuration and data storage (color mappings, metadata, manifest)
- JavaScript - Runtime environment (transpiled from TypeScript)
## Runtime
- Node.js - Development server and build runtime
- Browser - Production runtime (Chrome, Safari, Firefox, Edge)
- npm - Package management
- Lockfile: `package-lock.json` (present)
## Frameworks
- React 19.2.3 - UI component framework
- ReactDOM 19.2.3 - DOM rendering for React
- TypeScript 5.8.2 - Type system and compiler
- Vite 6.2.0 - Build tool and dev server
- @vitejs/plugin-react 5.0.0 - React plugin for Vite
- Not detected - No testing framework configured
- Tailwind CSS (via CDN) - Utility-first CSS framework loaded in `index.html`
- Custom CSS - Custom styles defined in `index.html` `<style>` block
## Key Dependencies
- @google/genai 1.34.0 - Google Gemini AI SDK (installed but not used in current codebase)
- @upstash/redis 1.36.3 - Redis client for Upstash (share links and material gallery fallback)
- @vercel/analytics 2.0.0 - Analytics integration for Vercel deployments
- @vercel/node 5.6.15 - Vercel serverless functions types and utilities
- mongodb 7.1.0 - MongoDB driver for material gallery persistence
- react-window 1.8.10 - Virtual scrolling library (installed but not used)
- @vitejs/plugin-react 5.0.0 - Vite React plugin
- @types/node 22.14.0 - Node.js TypeScript definitions
- @types/react-window 1.8.8 - TypeScript definitions for react-window
## Configuration
- Environment variables: `.env` file (gitignored), `.env.example` template
- Required for AI: `GEMINI_API_KEY` (optional - can use browser-supplied keys)
- Required for Redis: `VITE_UPSTASH_REDIS_REST_URL`, `VITE_UPSTASH_REDIS_REST_TOKEN`
- Required for MongoDB: `MONGODB_URI` (Vercel environment only)
- Admin: `ADMIN_USERNAME`, `ADMIN_PASSWORD` (for admin panel authentication)
- Build config: `vite.config.ts`
- TypeScript config: `tsconfig.json`
- Path alias: `@/*` maps to project root
- Vite dev server: Port 3000, host `0.0.0.0`
- Build output: `dist/` directory
- Excludes `/api/` routes from bundling (external to Rollup)
- Defines `process.env.GEMINI_API_KEY` at build time
- Path aliases configured via `vite.config.ts`
- Target: ES2022
- Module: ESNext
- JSX: react-jsx
- Strict mode enabled
- Excludes: `api/` directory (serverless functions), `lib/` directory
## Platform Requirements
- Node.js (version compatible with TypeScript 5.8.2 and Vite 6.2.0)
- npm (package manager)
- Modern web browser for development
- Vercel hosting platform (recommended deployment target)
- Static site hosting capability for `dist/` build output
- HTTPS required for Upstash Redis REST API (browser-based calls)
- MongoDB Atlas database (for material gallery persistence)
- Upstash Redis database (for share links, optional fallback for materials)
- Web App Manifest: `public/manifest.json`
- Apple mobile web app capable
- Standalone display mode
- Portrait-primary orientation
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Components: PascalCase with `.tsx` extension (e.g., `BeadCanvas.tsx`, `ColorPicker.tsx`)
- Utilities: camelCase with `.ts` extension (e.g., `colorUtils.ts`, `colorSystemUtils.ts`)
- Services: camelCase with `.ts` extension (e.g., `aiService.ts`, `upstashService.ts`)
- Type definitions: `types.ts` (centralized type file)
- API routes: kebab-case with `.ts` extension (e.g., `admin/login.ts`, `material/[id].ts`)
- React components: PascalCase with React.FC type annotation
- Utility functions: camelCase
- Event handlers: camelCase with `handle` prefix
- State variables: camelCase
- Ref variables: camelCase with `Ref` suffix for DOM refs
- Type aliases: PascalCase
- Interfaces: PascalCase
- Enums: PascalCase with UPPER_CASE values
## Code Style
- No formal formatting configuration (no `.prettierrc*`, `eslint.config.*`, or `biome.json`)
- Tailwind CSS is loaded via CDN, not installed as dependency
- Standard JavaScript/TypeScript formatting observed throughout codebase
- ESLint script exists in `package.json` (`"lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"`)
- No `.eslintrc*` or `eslint.config.*` file present
- `eslint` is NOT in `devDependencies` - lint command will fail
- Alternative: Use `npx tsc --noEmit` for static analysis (recommended)
## Import Organization
- `@/*` maps to root directory (configured in `tsconfig.json`)
- Currently not used in codebase (all imports use relative paths)
## Error Handling
- Async functions use try-catch blocks
- Errors logged to console (both `console.error` and `console.warn`)
- User-facing errors via `alert()` calls
- Graceful degradation: return `null` or empty values on error
- `console.error` for error conditions (found 33 occurrences)
- `console.warn` for warnings (rare, e.g., `console.warn('findClosestColor: palette is empty')`)
- No structured logging framework
## Logging
- Error logging: `console.error('Error description:', errorObject)`
- Warning logging: `console.warn('Warning message')`
- No debug/info logging observed
- No log levels or conditional logging
- Logs are always active (no development-only mode)
## Comments
- Chinese comments used for function documentation
- Inline comments rare, mainly for complex logic
- No JSDoc/TSDoc documentation blocks
- Not used throughout codebase
- No parameter or return value documentation in comment format
- Type definitions serve as documentation
## Function Design
- No enforced size limits
- Large functions observed:
- Object props for React components (Props interfaces)
- Individual parameters for utility functions
- Destructuring commonly used in component parameters
- Async functions return `Promise<T> | Promise<T | null>`
- Null returns indicate failure/empty state
- Explicit typing for all return values
## Module Design
- Named exports preferred for multiple exports
- Default exports not used (all use `export const` or `export function`)
- Types exported alongside implementation
- None used
- Each file exports its own types/functions directly
## TypeScript Usage Patterns
- Explicit typing for all function parameters and return values
- Component props defined in separate interface
- State typed with generic hooks: `useState<Type>(initialValue)`
- Ref typed with HTML element types: `useRef<HTMLCanvasElement>(null)`
- Target: ES2022
- Module: ESNext
- JSX transform: `react-jsx`
- Path alias: `@/*` → `./`
- Skip lib check: enabled
- Strict mode: not explicitly enabled (defaults to loose mode)
## React Component Patterns
## File Organization Patterns
- Each component in its own file
- Component name matches file name (e.g., `ColorPicker.tsx` exports `ColorPicker`)
- Props interface defined in same file, before component
- No barrel files for component groups
## CSS/Styling Patterns
- Inline utility classes
- Custom styles defined in `<style>` block in `index.html`
- No CSS modules or styled-components
- No separate CSS/SCSS files
## Code Review Practices
- No CODEOWNERS file
- No pull request template
- No contribution guidelines
- No pre-commit hooks configured
- TypeScript compilation: `npx tsc --noEmit`
- Build command: `npm run build` (runs `tsc && vite build`)
- ESLint command exists but will fail without configuration
## Recommendations
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- React 19 functional components with hooks
- Unidirectional data flow with props down, callbacks up
- State centralized in main App component
- Service layer abstraction for external integrations
- Canvas-based rendering for pixel art visualization
- TypeScript for type safety throughout
## Layers
- Purpose: UI rendering and user interaction
- Location: `components/`
- Contains: Presentational and interactive React components
- Depends on: React, types.ts, services layer, utils layer
- Used by: App.tsx
- Purpose: Application state management and business logic
- Location: `App.tsx`
- Contains: Grid state, tool state, UI state, event handlers, undo/redo logic
- Depends on: React hooks, types.ts, services, utils, components
- Used by: All components (via props)
- Purpose: External API integrations and data persistence
- Location: `services/`
- Contains: upstashService.ts, aiService.ts, materialService.ts
- Depends on: @upstash/redis, @google/genai, MongoDB (via API)
- Used by: App.tsx, MaterialGallery component
- Purpose: Pure functions for transformations and calculations
- Location: `utils/`
- Contains: colorUtils.ts, colorSystemUtils.ts
- Depends on: types.ts
- Used by: App.tsx, components
- Purpose: Vercel serverless functions for MongoDB operations
- Location: `api/`
- Contains: materials.ts, material/[id].ts, material-likes.ts, material-views.ts, admin/
- Depends on: @vercel/node, mongodb
- Used by: Browser via fetch (materialService.ts)
- Purpose: TypeScript type definitions and constants
- Location: `types.ts`
- Contains: Enums, interfaces, constants (DEFAULT_COLORS, TOOLS_INFO, etc.)
- Depends on: None
- Used by: All files
## Data Flow
- Primary state: `useState` hooks in App.tsx
- Refs for persistent values: `useRef` for undo/redo stacks, grid refs
- Derived state: `useMemo` for computed values (stats, palette groups)
- Side effects: `useEffect` for cleanup, keyboard listeners, API calls
## Key Abstractions
- Purpose: Core data structure representing pixel art
- Examples: `grid` state in App.tsx (string[][])
- Pattern: 2D array of hex color codes, immutable updates with spread operator
- Purpose: Different drawing/editing operations
- Examples: `ToolType` enum (PENCIL, ERASER, FILL, etc.)
- Pattern: Enum-based with metadata in `TOOLS_INFO`, keyboard shortcuts bound to state
- Purpose: Mapping between colors and commercial bead systems
- Examples: ColorSystem enum (MARD, COCO, etc.), colorSystemMapping.json
- Pattern: Hex-to-key mapping with provider-specific codes
- Purpose: Different visualization approaches
- Examples: `ViewType` enum (TWO_D, THREE_D, SLICES)
- Pattern: State-driven view switching with specialized components
- Purpose: Region-based operations (copy, paste, clear)
- Examples: `Selection` interface (startRow, startCol, endRow, endCol)
- Pattern: Coordinate-based rectangle with clipboard state
## Entry Points
- Location: `index.tsx`
- Triggers: Browser page load
- Responsibilities: React root creation, Vercel Analytics integration, App mounting
- Location: `App.tsx`
- Triggers: Mounted by index.tsx
- Responsibilities: All application state, event handlers, component orchestration, routing (hash-based)
## Error Handling
- Service functions return null on failure
- Error messages shown via `alert()` or console.error
- API errors caught and returned as error responses
- User-facing error messages in Chinese
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
