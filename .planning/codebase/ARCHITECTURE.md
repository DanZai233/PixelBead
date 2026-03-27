# Architecture

**Analysis Date:** 2026-03-27

## Pattern Overview

**Overall:** Single Page Application (SPA) with centralized state management

**Key Characteristics:**
- React 19 functional components with hooks
- Unidirectional data flow with props down, callbacks up
- State centralized in main App component
- Service layer abstraction for external integrations
- Canvas-based rendering for pixel art visualization
- TypeScript for type safety throughout

## Layers

**View Layer (`components/`):**
- Purpose: UI rendering and user interaction
- Location: `components/`
- Contains: Presentational and interactive React components
- Depends on: React, types.ts, services layer, utils layer
- Used by: App.tsx

**State/Logic Layer (`App.tsx`):**
- Purpose: Application state management and business logic
- Location: `App.tsx`
- Contains: Grid state, tool state, UI state, event handlers, undo/redo logic
- Depends on: React hooks, types.ts, services, utils, components
- Used by: All components (via props)

**Service Layer (`services/`):**
- Purpose: External API integrations and data persistence
- Location: `services/`
- Contains: upstashService.ts, aiService.ts, materialService.ts
- Depends on: @upstash/redis, @google/genai, MongoDB (via API)
- Used by: App.tsx, MaterialGallery component

**Utility Layer (`utils/`):**
- Purpose: Pure functions for transformations and calculations
- Location: `utils/`
- Contains: colorUtils.ts, colorSystemUtils.ts
- Depends on: types.ts
- Used by: App.tsx, components

**API Layer (`api/`):**
- Purpose: Vercel serverless functions for MongoDB operations
- Location: `api/`
- Contains: materials.ts, material/[id].ts, material-likes.ts, material-views.ts, admin/
- Depends on: @vercel/node, mongodb
- Used by: Browser via fetch (materialService.ts)

**Type Layer (`types.ts`):**
- Purpose: TypeScript type definitions and constants
- Location: `types.ts`
- Contains: Enums, interfaces, constants (DEFAULT_COLORS, TOOLS_INFO, etc.)
- Depends on: None
- Used by: All files

## Data Flow

**User Interaction Flow:**

1. User triggers action (click, drag, keyboard shortcut) in component
2. Component calls callback prop (e.g., `onPointerDown`, `handleCanvasAction`)
3. App.tsx handler updates state using `setGrid`, `setSelectedColor`, etc.
4. State change triggers re-render
5. Updated props flow down to all dependent components
6. Components render new UI based on updated state

**State Management:**
- Primary state: `useState` hooks in App.tsx
- Refs for persistent values: `useRef` for undo/redo stacks, grid refs
- Derived state: `useMemo` for computed values (stats, palette groups)
- Side effects: `useEffect` for cleanup, keyboard listeners, API calls

**Undo/Redo Flow:**

1. Before state change, `pushUndo()` saves current grid to `undoStackRef`
2. New grid state is applied
3. On undo, previous state popped from stack and applied
4. On redo, current state saved to redo stack, future state applied

**External Data Flow:**

1. AI Generation: App.tsx → aiService.ts → external AI API → base64 image → processImageToGrid → grid
2. Share Loading: URL hash → upstashService.ts.loadFromUpstash → ShareData → grid state
3. Material Gallery: MaterialGallery → materialService.ts → API (MongoDB/Upstash) → MaterialData → apply to grid

## Key Abstractions

**Grid State:**
- Purpose: Core data structure representing pixel art
- Examples: `grid` state in App.tsx (string[][])
- Pattern: 2D array of hex color codes, immutable updates with spread operator

**Tool System:**
- Purpose: Different drawing/editing operations
- Examples: `ToolType` enum (PENCIL, ERASER, FILL, etc.)
- Pattern: Enum-based with metadata in `TOOLS_INFO`, keyboard shortcuts bound to state

**Color Systems:**
- Purpose: Mapping between colors and commercial bead systems
- Examples: ColorSystem enum (MARD, COCO, etc.), colorSystemMapping.json
- Pattern: Hex-to-key mapping with provider-specific codes

**View Modes:**
- Purpose: Different visualization approaches
- Examples: `ViewType` enum (TWO_D, THREE_D, SLICES)
- Pattern: State-driven view switching with specialized components

**Selection System:**
- Purpose: Region-based operations (copy, paste, clear)
- Examples: `Selection` interface (startRow, startCol, endRow, endCol)
- Pattern: Coordinate-based rectangle with clipboard state

## Entry Points

**`index.tsx`:**
- Location: `index.tsx`
- Triggers: Browser page load
- Responsibilities: React root creation, Vercel Analytics integration, App mounting

**`App.tsx`:**
- Location: `App.tsx`
- Triggers: Mounted by index.tsx
- Responsibilities: All application state, event handlers, component orchestration, routing (hash-based)

## Error Handling

**Strategy:** Try-catch blocks with user-friendly alerts

**Patterns:**
- Service functions return null on failure
- Error messages shown via `alert()` or console.error
- API errors caught and returned as error responses
- User-facing error messages in Chinese

## Cross-Cutting Concerns

**Logging:** console.error for debugging, no centralized logging

**Validation:** Type checking via TypeScript, runtime checks for grid boundaries, API response validation

**Authentication:** Admin panel uses HMAC token verification (api/admin/), no auth for main app

**Persistence:** localStorage for AI config and onboarding state, Upstash Redis for share links (7-day TTL), MongoDB Atlas for material gallery (persistent)

---

*Architecture analysis: 2026-03-27*
