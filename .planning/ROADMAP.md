# Roadmap: PixelBead Mobile App

**Created:** 2026-03-28
**Granularity:** Standard
**Total Phases:** 6
**Total v1 Requirements:** 96

## Phases

- [ ] **Phase 1: Foundation & Infrastructure** - Monorepo structure, state management, and offline storage
- [ ] **Phase 2: Canvas Core & Performance** - High-performance canvas editor with touch controls
- [ ] **Phase 3: Drawing & Tools** - Drawing tools, shapes, and haptic feedback
- [ ] **Phase 4: Colors & Advanced Features** - Color system, image import, selection tools
- [ ] **Phase 5: Projects & Export** - Project management, persistence, and export
- [ ] **Phase 6: AI, Gallery & Deployment** - AI generation, material gallery, and app store deployment

## Phase Details

### Phase 1: Foundation & Infrastructure

**Goal**: Establish project architecture with offline-first storage and performant state management

**Depends on**: Nothing (first phase)

**Requirements**:
- FND-01: Mobile app code in independent subdirectory (/mobile)
- FND-02: Monorepo structure with shared packages
- FND-03: Shared packages (color system, utilities, types)
- FND-04: React Native framework (Android + iOS)
- FND-05: Build pipeline removes console.log
- OFFL-05: Synchronous local storage (MMKV)
- STAT-01: Lightweight state management (Zustand)

**Success Criteria** (what must be TRUE):
1. Monorepo builds successfully for both web and mobile platforms
2. Zustand stores persist and restore state across app restarts
3. MMKV storage saves and retrieves data synchronously (no async await)
4. Shared packages import correctly from mobile app
5. Production builds have no console.log statements

**Plans**: 4 plans

- [x] 01-基础架构与核心渲染-01-PLAN.md — Establish monorepo structure with Expo SDK 55 mobile app
- [x] 01-基础架构与核心渲染-02-PLAN.md — Create three shared packages (types, color-system, shared-utils)
- [x] 01-基础架构与核心渲染-03-PLAN.md — Implement Zustand state management with MMKV persistence
- [x] 01-基础架构与核心渲染-04-PLAN.md — Configure build pipeline with console.log removal and TypeScript strict mode

---

### Phase 2: Canvas Core & Performance

**Goal**: Deliver high-performance canvas editor with touch-optimized navigation

**Depends on**: Phase 1

**Requirements**:
- CANV-01: Canvas grid with configurable size (4x4 to 200x200)
- CANV-02: Place pixels by tapping
- CANV-03: Zoom with pinch-to-zoom gestures
- CANV-04: Pan with two-finger drag or virtual joystick
- CANV-05: 60 FPS rendering for 200x200 grid
- CANV-06: Virtualized rendering optimization
- CANV-07: Grid display with optional guide lines
- UI-01: Responsive layout (phone + tablet)
- UI-02: Portrait and landscape orientations
- UI-03: Dark/light theme toggle
- UI-04: Bottom tab bar navigation
- UI-05: Sliding tool drawer
- NAV-01: File-based routing with deep links
- NAV-03: Automatic back navigation
- NAV-04: Gesture-based navigation (swipe back)
- PERF-01: 60 FPS during canvas interactions
- PERF-04: 200x200 grid renders smoothly
- PERF-05: React.memo and useMemo optimization
- STAT-05: State updates maintain 60 FPS

**Success Criteria** (what must be TRUE):
1. User can view and interact with canvas at all sizes (4x4 to 200x200)
2. User can zoom and pan canvas smoothly with touch gestures
3. Canvas maintains 60 FPS when placing pixels on 200x200 grid
4. App renders correctly on phone and tablet in both orientations
5. User can navigate between screens using gestures and back button

**Plans**: 5 plans

- [ ] 02-编辑器功能与数据管理-01-PLAN.md — Canvas grid rendering with React Native Skia and viewport culling
- [ ] 02-编辑器功能与数据管理-02-PLAN.md — Touch interaction for pixel placement with gesture handler
- [ ] 02-编辑器功能与数据管理-03-PLAN.md — Canvas navigation with pinch-to-zoom and pan gestures
- [ ] 02-编辑器功能与数据管理-04-PLAN.md — Responsive UI shell with bottom tab bar and deep links
- [ ] 02-编辑器功能与数据管理-05-PLAN.md — Sliding tool drawer and dark/light theme toggle
**UI hint**: yes

---

### Phase 3: Drawing & Tools

**Goal**: Enable pixel art creation with diverse drawing tools and haptic feedback

**Depends on**: Phase 2

**Requirements**:
- DRAW-01: Brush tool to paint pixels
- DRAW-02: Eraser tool to remove pixels
- DRAW-03: Fill bucket tool
- DRAW-04: Color picker (eyedropper)
- DRAW-05: Line tool
- DRAW-06: Rectangle tool
- DRAW-07: Circle tool
- DRAW-08: Brush size adjustment (1-5 pixels)
- UI-06: Haptic feedback on tool changes and actions
- UI-07: Touch-optimized controls (44px tap targets)
- UI-08: Virtual joystick controls (left: pan, right: zoom)
- ACCS-03: Proper color contrast ratios
- ACCS-04: Accessibility labels for interactive elements
- PERF-02: Tool changes respond within 100ms
- PERF-06: requestAnimationFrame for animations

**Success Criteria** (what must be TRUE):
1. User can select and use all drawing tools (brush, eraser, fill, picker, line, rectangle, circle)
2. User can adjust brush size and see changes reflected immediately
3. Drawing actions complete within 100ms with smooth visual feedback
4. User feels haptic feedback on tool changes and drawing actions
5. All interactive elements are accessible via screen reader with proper labels

**Plans**: TBD
**UI hint**: yes

---

### Phase 4: Colors & Advanced Features

**Goal**: Deliver color system, image processing, and selection capabilities

**Depends on**: Phase 3

**Requirements**:
- COLR-01: Predefined Perler bead palettes
- COLR-02: Multiple palette presets (48, 96, 144, 168 colors)
- COLR-03: HSL color picker for custom colors
- COLR-04: HEX color code input
- COLR-05: Pixel styles (circle, square, rounded)
- COLR-06: Real-time color statistics (bead count per color)
- COLR-07: Merge similar colors (0-50% threshold)
- COLR-08: Multi-brand color mapping (MARD, COCO, 漫漫, 盼盼, 咪小窝)
- COLR-09: Highlight all pixels of selected color
- IMPT-01: Import images from device photo library
- IMPT-02: Convert images to pixel grid automatically
- IMPT-03: Custom crop region for conversion
- IMPT-04: 1:1 crop with alignment options
- IMPT-05: Remove background from images
- IMPT-06: Exclude specific colors from conversion
- IMPT-07: Adjust crop region size and position
- SELC-01: Select rectangular region
- SELC-02: Copy selected region to clipboard
- SELC-03: Paste clipboard content to canvas
- SELC-04: Cut selected region (copy + clear)
- SELC-05: Clear selected region
- SELC-06: Invert colors in selected region
- UI-09: Immersive view mode with toggleable grids/rulers/color codes
- UI-10: Long-press for context menus

**Success Criteria** (what must be TRUE):
1. User can select colors from predefined palettes and custom HSL/HEX pickers
2. User can import images and convert them to pixel art with cropping and background removal
3. User can merge similar colors and see real-time statistics of bead counts
4. User can select, copy, paste, cut, and manipulate regions on canvas
5. User can view color mappings for multiple Perler bead brands

**Plans**: TBD
**UI hint**: yes

---

### Phase 5: Projects & Export

**Goal**: Enable project persistence, management, and export functionality

**Depends on**: Phase 4

**Requirements**:
- PROJ-01: Save current project to local storage
- PROJ-02: Load saved projects from local storage
- PROJ-03: Export project as JSON file
- PROJ-04: Import project from JSON file
- PROJ-05: Undo last action (up to 50 steps)
- PROJ-06: Redo undone action
- PROJ-07: Create new canvas with custom size
- PROJ-08: Clear current canvas
- EXPR-01: Export canvas as PNG image
- EXPR-02: Toggle grid lines in export
- EXPR-03: Toggle color codes in export
- EXPR-04: Mirror canvas before export
- EXPR-05: Export selected region only
- OFFL-01: Core editing features work completely offline
- OFFL-02: Save/load projects without internet connection
- OFFL-03: Offline status indicator
- STAT-02: Canvas state persists across app restarts
- STAT-03: User preferences persist across app restarts
- STAT-04: Undo/redo history persists within session
- NAV-05: Onboarding guide for first-time users
- ACCS-01: Screen reader support (VoiceOver, TalkBack)
- ACCS-02: Dynamic text sizes
- PERF-03: App startup time under 3 seconds

**Success Criteria** (what must be TRUE):
1. User can save, load, and manage projects completely offline
2. User can export canvas as PNG with customizable options (grid, color codes, mirror)
3. User can undo and redo actions up to 50 steps during session
4. User sees offline status indicator when not connected to internet
5. User completes onboarding guide on first app launch

**Plans**: TBD
**UI hint**: yes

---

### Phase 6: AI, Gallery & Deployment

**Goal**: Deliver AI generation, material gallery, and app store deployment

**Depends on**: Phase 5

**Requirements**:
- EXPR-06: Generate shareable link (7-day TTL via Redis)
- EXPR-07: Copy share URL to clipboard
- AI-01: Input text prompt to generate pixel art
- AI-02: Configure AI provider settings (OpenAI, DeepSeek, Gemini)
- AI-03: Upload reference image for AI generation
- AI-04: Generate pixel art in specified canvas size
- AI-05: Select AI model from configured provider
- GALL-01: Browse community-created designs (online-only)
- GALL-02: Load design from gallery into canvas
- GALL-03: Like designs in gallery
- GALL-04: Favorite designs for quick access
- GALL-05: Publish own design to gallery (title, author, tags)
- GALL-06: Online/offline status indicator
- GALL-07: Material gallery shows loading state
- NAV-02: Handle share links from other apps (deep linking)
- OFFL-04: Material gallery shows offline message when no connection
- DEPL-01: Build for iOS App Store
- DEPL-02: Build for Google Play Store
- DEPL-03: Proper app icons and splash screens
- DEPL-04: Follow App Store and Google Play submission guidelines
- DEPL-05: Proper versioning and update mechanism

**Success Criteria** (what must be TRUE):
1. User can generate pixel art from text prompts and reference images using AI
2. User can browse, like, favorite, and load designs from material gallery
3. User can generate shareable links and copy URLs to clipboard
4. Material gallery shows offline message and loading states appropriately
5. App builds successfully for iOS and Android with proper icons, splash screens, and versioning

**Plans**: TBD
**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Infrastructure | 4/4 | Ready to execute | - |
| 2. Canvas Core & Performance | 0/5 | Ready to execute | - |
| 3. Drawing & Tools | 0/0 | Not started | - |
| 4. Colors & Advanced Features | 0/0 | Not started | - |
| 5. Projects & Export | 0/0 | Not started | - |
| 6. AI, Gallery & Deployment | 0/0 | Not started | - |

---

## Coverage

| Phase | Requirements | Coverage |
|-------|--------------|----------|
| 1 | 7 | Foundation, Storage, State |
| 2 | 16 | Canvas, UI, Navigation, Performance |
| 3 | 10 | Drawing, UI, Accessibility, Performance |
| 4 | 29 | Color System, Image Import, Selection, UI |
| 5 | 25 | Projects, Export, Offline, Navigation, Accessibility, Performance |
| 6 | 17 | Export, AI, Gallery, Navigation, Deployment |
| **Total** | **96** | **100%** ✓ |

---

## Dependencies

```
Phase 1 (Foundation)
    ↓
Phase 2 (Canvas Core & Performance)
    ↓
Phase 3 (Drawing & Tools)
    ↓
Phase 4 (Colors & Advanced Features)
    ↓
Phase 5 (Projects & Export)
    ↓
Phase 6 (AI, Gallery & Deployment)
```

---
*Roadmap created: 2026-03-28*
