# Phase 1: Foundation & Infrastructure - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

## Phase Boundary

Establish technical foundation for PixelBead Mobile App including monorepo structure, state management, offline storage, and build infrastructure. This phase does NOT build any user-facing features — it's architecture and configuration work only.

## Implementation Decisions

### Monorepo Structure
- **D-01:** Use Expo SDK 52+ automatic monorepo with pnpm workspaces (no manual metro.config.js needed)
  - Expo SDK 52+ has native monorepo support with automatic Metro bundler configuration
  - Use `apps/` for platform-specific code (`apps/mobile` for React Native, root for web)
  - Use `packages/` for shared code (`packages/color-system`, `packages/shared-utils`, `packages/shared-types`)
  - Rationale: Official Expo recommendation eliminates complex configuration, pnpm workspaces are widely supported
- **D-02:** Use package naming convention `@pixelbead/*` for internal shared packages
  - `@pixelbead/color-system` - Color algorithms, palettes, mappings
  - `@pixelbead/shared-utils` - General utilities, helper functions
  - `@pixelbead/shared-types` - TypeScript types, interfaces, enums
  - Rationale: Clear namespace prevents conflicts, follows npm scoped package convention
- **D-03:** Package exports use named exports (no default exports for consistency)
  - All shared packages export named functions/types
  - Rationale: Enables tree-shaking, clearer import statements

### State Management Architecture
- **D-04:** Use Zustand with modular store organization
  - `canvasStore` - Grid state, tool selection, drawing state, undo/redo
  - `settingsStore` - User preferences, theme, tool settings
  - `uiStore` - UI state (modals open/close, active panels)
  - Rationale: Lightweight state management avoids React Context performance issues, modular stores are easier to test
- **D-05:** Use MMKV persistence middleware for Zustand stores
  - All user data persists automatically to MMKV on state changes
  - Canvas state persisted as JSON for performance (MMKV handles large values well)
  - Rationale: MMKV is 30x faster than AsyncStorage, synchronous API prevents async/await overhead for canvas operations
- **D-06:** Use selector-based subscriptions in components to prevent unnecessary re-renders
  - Components only subscribe to specific state slices they need
  - Rationale: React Context re-renders ALL consumers, causing performance death spiral at 60 FPS targets

### Build Configuration
- **D-07:** Use `babel-plugin-remove-console` for production builds only
  - Development builds retain all console logging for debugging
  - Production builds strip console.log/warn/error statements
  - Rationale: Reduces bundle size, prevents production console noise, meets FND-05 requirement
- **D-08:** TypeScript configuration with strict mode enabled for shared packages and mobile app
  - Enforce strict type checking across monorepo
  - Rationale: Catches type errors early, reduces runtime bugs

### MMKV Storage Strategy
- **D-09:** Use simple key-value schema with JSON serialization for complex data
  - `canvas:current` - Current canvas grid (JSON string for 200x200 grid)
  - `canvas:history:undo` - Undo stack (JSON array)
  - `canvas:history:redo` - Redo stack (JSON array)
  - `user:preferences` - User settings (JSON object)
  - Rationale: Simple schema minimizes complexity, JSON handles nested structures
- **D-10:** Initialize MMKV with New Architecture enabled
  - New Architecture required for MMKV v4 with JSI bindings
  - Rationale: MMKV v4 performance critical for 200x200 canvas operations

### Shared Package Organization
- **D-11:** Three shared packages with clear boundaries
  - `@pixelbead/color-system`: All color operations, palette management, brand mappings
    - Exports: mergeSimilarColors, mapColorsToPalette, createPaletteFromGrid, findClosestColor
    - Dependencies: None (pure functions), types from @pixelbead/shared-types
  - `@pixelbead/shared-utils`: General utilities not specific to color or canvas
    - Exports: Generic helper functions, constants, validation utilities
    - Dependencies: @pixelbead/shared-types
  - `@pixelbead/shared-types`: TypeScript definitions used by both web and mobile
    - Exports: All interfaces, types, enums (ColorHex, ToolType, ViewType, Selection, etc.)
    - Dependencies: None
  - Rationale: Clear separation of concerns, web and mobile can both import same packages

### Expo Configuration
- **D-12:** Use Expo SDK 55 with New Architecture enabled by default
  - New Architecture required for MMKV v4 with synchronous JSI bindings
  - React Native 0.84+ included in Expo SDK 55
  - Rationale: Latest stable Expo SDK with New Architecture performance benefits
- **D-13:** Use Expo Router for file-based routing (setup skeleton, not full implementation)
  - Create basic app structure with placeholder screens
  - Configure file-based routing for deep links
  - Rationale: Official Expo navigation solution, automatic deep links support, zero boilerplate

### TypeScript Configuration
- **D-14:** Use path aliases for shared package imports in monorepo
  - `@pixelbead/color-system` maps to `packages/color-system/src`
  - `@pixelbead/shared-utils` maps to `packages/shared-utils/src`
  - `@pixelbead/shared-types` maps to `packages/shared-types/src`
  - Rationale: Clean imports without relative paths, shared packages can be refactored easily
- **D-15:** Shared packages use strict TypeScript with no any types
  - Enforce explicit typing across all shared code
  - Rationale: Type safety is core value for sharing business logic between platforms

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Stack & Architecture
- `.planning/research/STACK.md` — Technology stack recommendations (Expo SDK 55, Zustand, MMKV, React Native Skia, NativeWind)
- `.planning/research/ARCHITECTURE.md` — System structure patterns, monorepo organization, component boundaries
- `.planning/research/PITFALLS.md` — Critical pitfalls to avoid (AsyncStorage data wipes, Context API death spiral, gesture conflicts)

### Project Files
- `.planning/PROJECT.md` — Project context, constraints, key decisions
- `.planning/REQUIREMENTS.md` — All 96 v1 requirements mapped to phases
- `.planning/ROADMAP.md` — Phase structure with success criteria

### Web App Codebase (for reference)
- `App.tsx` — Existing state management patterns (centralized state in main component)
- `services/` — External API integration patterns (aiService, upstashService, materialService)
- `utils/` — Utility function patterns (colorUtils.ts, colorSystemUtils.ts)
- `types.ts` — TypeScript definitions and constants (ToolType, ColorHex, ViewType, etc.)
- `components/` — React component patterns (BeadCanvas, ColorPicker, etc.)
- `.planning/codebase/ARCHITECTURE.md` — Web app architecture layers, data flow, abstractions
- `.planning/codebase/CONVENTIONS.md` — Naming patterns, React component structure, TypeScript usage

## Existing Code Insights

### Reusable Assets
- **Web color utilities**: `utils/colorUtils.ts` and `utils/colorSystemUtils.ts`
  - Can be moved to `packages/color-system` with minimal refactoring
  - Contains: mergeSimilarColors, mapColorsToPalette, colorDistance, hexToRgb, rgbToHsl
  - Note: These functions are platform-agnostic, perfect for shared package
- **Web types**: `types.ts`
  - Contains: ToolType enum, ColorHex type, ViewType enum, DEFAULT_COLORS, TOOLS_INFO
  - Can be moved to `packages/shared-types` directly
- **Web services**: `services/aiService.ts`, `services/upstashService.ts`, `services/materialService.ts`
  - Pattern: Service layer abstraction with try-catch error handling
  - Note: Mobile app will need React Native-specific implementations, but pattern can be reused

### Established Patterns
- **State management**: Centralized in App.tsx using useState hooks
  - Mobile pattern: Use Zustand stores instead (established in research)
  - Note: Need to refactor web pattern to mobile architecture
- **Error handling**: Try-catch blocks with alert() calls
  - Pattern: `try { ... } catch (error) { console.error(...); return null; }`
  - Can be reused in mobile app with React Native Alert API instead of alert()
- **Component structure**: Functional components with Props interface, React.FC type annotation
  - Pattern: `export const Component: React.FC<Props> = ({ prop1, prop2 }) => { ... }`
  - Can be reused in mobile app with React Native components

### Integration Points
- **Monorepo boundary**: Shared packages will be imported by both web and mobile apps
  - Web app currently at root will need package.json updates to import @pixelbead/shared-packages
  - Mobile app in `apps/mobile` will import shared packages
  - Build tools: Use pnpm workspaces with hoist=false to avoid dependency conflicts
- **Existing web code**: Can be refactored to use shared packages incrementally
  - Not required in Phase 1, but enables future code deduplication

## Specific Ideas

No specific "I want it like X" requirements from this phase discussion — open to standard approaches per research recommendations.

## Deferred Ideas

None — discussion stayed within Phase 1 scope (foundation and infrastructure only).

---
*Phase: 01-Foundation & Infrastructure*
*Context gathered: 2026-03-28*
