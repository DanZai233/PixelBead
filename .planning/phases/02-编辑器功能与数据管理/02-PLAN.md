# Phase 2: Canvas Core & Performance

## Overview

**Phase Goal**: Deliver high-performance canvas editor with touch-optimized navigation

**Dependencies**: Phase 1 (Foundation & Infrastructure)

**Plans**: 5 plans in 3 waves

## Wave Structure

| Wave | Plans | Description |
|------|-------|-------------|
| 1 | 02-01, 02-02 | Canvas rendering and touch interaction (parallel) |
| 2 | 02-03, 02-04 | Canvas navigation and UI shell (parallel) |
| 3 | 02-05 | Tool drawer and theme toggle |

## Individual Plans

### Plan 02-01: Canvas Grid Rendering with React Native Skia

**Wave**: 1
**Dependencies**: None (Phase 1)

**Objective**: Implement high-performance canvas grid rendering with React Native Skia, supporting configurable sizes from 4x4 to 200x200 with virtualized rendering and viewport culling to maintain 60 FPS.

**Requirements**:
- CANV-01: Canvas grid with configurable size (4x4 to 200x200)
- CANV-05: 60 FPS rendering for 200x200 grid
- CANV-06: Virtualized rendering optimization
- CANV-07: Grid display with optional guide lines
- PERF-04: 200x200 grid renders smoothly
- PERF-05: React.memo and useMemo optimization
- STAT-05: State updates maintain 60 FPS

**Key Deliverables**:
- React Native Skia integration
- Viewport culling utilities (calculateVisibleRange)
- useCanvasRenderer hook with memoized visible cells
- CanvasGrid component with GPU-accelerated rendering

**File**: `.planning/phases/02-编辑器功能与数据管理/02-编辑器功能与数据管理-01-PLAN.md`

---

### Plan 02-02: Touch Interaction & Pixel Placement

**Wave**: 1
**Dependencies**: 02-01

**Objective**: Implement touch interaction for pixel placement with react-native-gesture-handler, ensuring state updates complete within 16ms to maintain 60 FPS during user interactions.

**Requirements**:
- CANV-02: Place pixels by tapping
- PERF-01: 60 FPS during canvas interactions

**Key Deliverables**:
- react-native-gesture-handler integration
- useCanvasInteraction hook with single-tap gesture
- CanvasGrid component updated with GestureDetector
- Tool handling (brush, eraser, fill, picker)

**File**: `.planning/phases/02-编辑器功能与数据管理/02-编辑器功能与数据管理-02-PLAN.md`

---

### Plan 02-03: Canvas Navigation (Zoom, Pan, Gestures)

**Wave**: 2
**Dependencies**: 02-02

**Objective**: Implement canvas navigation with pinch-to-zoom and two-finger pan gestures, plus automatic back navigation and gesture-based swipe-back for smooth screen transitions.

**Requirements**:
- CANV-03: Zoom with pinch-to-zoom gestures
- CANV-04: Pan with two-finger drag or virtual joystick
- NAV-03: Automatic back navigation
- NAV-04: Gesture-based navigation (swipe back)

**Key Deliverables**:
- Pinch-to-zoom gesture (0.5x to 5x)
- Two-finger pan gesture
- Virtual joystick component (left: pan, right: zoom)
- CanvasGrid updated with composed gestures

**File**: `.planning/phases/02-编辑器功能与数据管理/02-编辑器功能与数据管理-03-PLAN.md`

---

### Plan 02-04: Responsive UI Shell & Navigation

**Wave**: 2
**Dependencies**: None (can run parallel with 02-03)

**Objective**: Implement responsive UI shell with bottom tab bar navigation (Editor, Gallery, Settings), file-based routing with deep links, and support for phone/tablet layouts in both portrait and landscape orientations.

**Requirements**:
- NAV-01: File-based routing with deep links
- UI-01: Responsive layout (phone + tablet)
- UI-02: Portrait and landscape orientations
- UI-04: Bottom tab bar navigation

**Key Deliverables**:
- app.json orientation configuration
- Bottom tab bar layout (Editor, Gallery, Settings)
- Editor screen with CanvasGrid
- Gallery and Settings screen placeholders
- Root layout with deep link support

**File**: `.planning/phases/02-编辑器功能与数据管理/02-编辑器功能与数据管理-04-PLAN.md`

---

### Plan 02-05: Tool Drawer & Theme Toggle

**Wave**: 3
**Dependencies**: 02-04

**Objective**: Implement sliding tool drawer for canvas tools (brush, eraser, fill, picker) and dark/light theme toggle with persistence across app restarts.

**Requirements**:
- UI-03: Dark/light theme toggle
- UI-05: Sliding tool drawer

**Key Deliverables**:
- ThemeToggle component with animated switch
- ToolDrawer component with sliding animation
- Editor screen updated with tool drawer and theme toggle
- Settings screen with theme toggle in Appearance section

**File**: `.planning/phases/02-编辑器功能与数据管理/02-编辑器功能与数据管理-05-PLAN.md`

---

## Success Criteria (Phase)

1. User can view and interact with canvas at all sizes (4x4 to 200x200)
2. User can zoom and pan canvas smoothly with touch gestures
3. Canvas maintains 60 FPS when placing pixels on 200x200 grid
4. App renders correctly on phone and tablet in both orientations
5. User can navigate between screens using gestures and back button

## Total Requirements Addressed

16 requirements covered across 5 plans:
- Canvas (CANV-01 to CANV-07): 7 requirements
- UI (UI-01 to UI-05): 5 requirements
- Navigation (NAV-01, NAV-03, NAV-04): 3 requirements
- Performance (PERF-01, PERF-04, PERF-05): 3 requirements
- State (STAT-05): 1 requirement

---

*Created: 2026-03-28*
*Ready for execution: `/gsd-execute-phase 02-编辑器功能与数据管理`*
