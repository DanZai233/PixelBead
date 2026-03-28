# Requirements: PixelBead Mobile App

**Defined:** 2026-03-28
**Core Value:** 移动用户可以随时随地设计拼豆作品，离线使用核心编辑功能，通过应用商店触达更广泛的用户群。

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation & Architecture

- [ ] **FND-01**: Mobile app code is in independent subdirectory (/mobile) without affecting existing Web code
- [ ] **FND-02**: Project uses monorepo structure with shared packages for business logic
- [ ] **FND-03**: Shared packages include color system utilities, general utilities, and TypeScript types
- [ ] **FND-04**: Mobile app is built with React Native framework supporting both Android and iOS
- [ ] **FND-05**: Build pipeline removes console.log statements for production builds

### Canvas Editor

- [x] **CANV-01**: User can view canvas grid with configurable size (4x4 to 200x200)
- [x] **CANV-02**: User can place pixels by tapping on canvas
- [x] **CANV-03**: User can zoom canvas using pinch-to-zoom gestures
- [x] **CANV-04**: User can pan canvas using two-finger drag or virtual joystick
- [x] **CANV-05**: Canvas maintains 60 FPS rendering for 200x200 grid (40,000 pixels)
- [x] **CANV-06**: Canvas uses virtualized rendering to optimize performance
- [x] **CANV-07**: Canvas supports grid display with optional guide lines

### Drawing Tools

- [ ] **DRAW-01**: User can select brush tool to paint pixels
- [ ] **DRAW-02**: User can select eraser tool to remove pixels
- [ ] **DRAW-03**: User can use fill bucket tool to fill areas with selected color
- [ ] **DRAW-04**: User can use color picker (eyedropper) to select color from canvas
- [ ] **DRAW-05**: User can draw lines using line tool
- [ ] **DRAW-06**: User can draw rectangles using rectangle tool
- [ ] **DRAW-07**: User can draw circles using circle tool
- [ ] **DRAW-08**: User can adjust brush size (1-5 pixels)

### Color System

- [ ] **COLR-01**: User can select colors from predefined Perler bead palettes
- [ ] **COLR-02**: User can select from multiple palette presets (48, 96, 144, 168 colors)
- [ ] **COLR-03**: User can use HSL color picker for custom colors
- [ ] **COLR-04**: User can input HEX color codes directly
- [ ] **COLR-05**: User can select pixel styles (circle, square, rounded)
- [ ] **COLR-06**: User can view real-time color statistics showing bead count per color
- [ ] **COLR-07**: User can merge similar colors using adjustable threshold (0-50%)
- [ ] **COLR-08**: User can map colors to multiple brand color systems (MARD, COCO, 漫漫, 盼盼, 咪小窝)
- [ ] **COLR-09**: User can highlight all pixels of a selected color by tapping in statistics

### Image Import & Processing

- [ ] **IMPT-01**: User can import images from device photo library
- [ ] **IMPT-02**: User can convert imported images to pixel grid automatically
- [ ] **IMPT-03**: User can select custom crop region for image conversion
- [ ] **IMPT-04**: User can use 1:1 crop with alignment options (top-left, center, bottom-right)
- [ ] **IMPT-05**: User can remove background from imported images
- [ ] **IMPT-06**: User can exclude specific colors from conversion
- [ ] **IMPT-07**: User can adjust crop region size and position

### Selection & Clipboard

- [ ] **SELC-01**: User can select rectangular region on canvas
- [ ] **SELC-02**: User can copy selected region to clipboard
- [ ] **SELC-03**: User can paste clipboard content to canvas at selected position
- [ ] **SELC-04**: User can cut selected region (copy + clear)
- [ ] **SELC-05**: User can clear selected region
- [ ] **SELC-06**: User can invert colors in selected region

### Project Management

- [ ] **PROJ-01**: User can save current project to local storage
- [ ] **PROJ-02**: User can load saved projects from local storage
- [ ] **PROJ-03**: User can export project as JSON file
- [ ] **PROJ-04**: User can import project from JSON file
- [ ] **PROJ-05**: User can undo last action (up to 50 steps)
- [ ] **PROJ-06**: User can redo undone action
- [ ] **PROJ-07**: User can create new canvas with custom size
- [ ] **PROJ-08**: User can clear current canvas

### Export & Sharing

- [ ] **EXPR-01**: User can export canvas as PNG image
- [ ] **EXPR-02**: User can toggle grid lines in export
- [ ] **EXPR-03**: User can toggle color codes in export
- [ ] **EXPR-04**: User can mirror canvas before export
- [ ] **EXPR-05**: User can export selected region only
- [ ] **EXPR-06**: User can generate shareable link for project (7-day TTL via Redis)
- [ ] **EXPR-07**: User can copy share URL to clipboard

### AI Generation

- [ ] **AI-01**: User can input text prompt to generate pixel art
- [ ] **AI-02**: User can configure AI provider settings (OpenAI, DeepSeek, Gemini, etc.)
- [ ] **AI-03**: User can upload reference image for AI generation
- [ ] **AI-04**: User can generate pixel art in specified canvas size
- [ ] **AI-05**: User can select AI model from configured provider

### Material Gallery (Online-Only)

- [ ] **GALL-01**: User can browse community-created designs (online-only)
- [ ] **GALL-02**: User can load design from gallery into canvas
- [ ] **GALL-03**: User can like designs in gallery
- [ ] **GALL-04**: User can favorite designs for quick access
- [ ] **GALL-05**: User can publish own design to gallery (requires title, author, tags)
- [ ] **GALL-06**: App displays online/offline status indicator
- [ ] **GALL-07**: Material gallery shows loading state when fetching designs

### UI/UX

- [x] **UI-01**: App supports responsive layout for phone and tablet
- [x] **UI-02**: App supports portrait and landscape orientations
- [x] **UI-03**: App includes dark/light theme toggle
- [x] **UI-04**: App uses bottom tab bar for main navigation (Editor, Gallery, Settings)
- [x] **UI-05**: App includes sliding tool drawer for canvas tools
- [ ] **UI-06**: App provides haptic feedback on tool changes and actions
- [ ] **UI-07**: App uses touch-optimized controls with minimum 44px tap targets
- [ ] **UI-08**: App displays virtual joystick controls for canvas navigation (left: pan, right: zoom)
- [ ] **UI-09**: App includes immersive view mode with toggleable grids/rulers/color codes
- [ ] **UI-10**: App supports long-press for context menus (color picker, copy, etc.)

### Offline Support

- [ ] **OFFL-01**: Core editing features work completely offline
- [ ] **OFFL-02**: User can save/load projects without internet connection
- [ ] **OFFL-03**: App displays offline status indicator
- [ ] **OFFL-04**: Material gallery shows offline message when no connection
- [ ] **OFFL-05**: App uses synchronous local storage (MMKV) for performance

### Navigation & Routing

- [x] **NAV-01**: App uses file-based routing with deep link support
- [ ] **NAV-02**: App can handle share links from other apps (deep linking)
- [x] **NAV-03**: App includes automatic back navigation
- [x] **NAV-04**: App supports gesture-based navigation (swipe back)
- [ ] **NAV-05**: App includes onboarding guide for first-time users

### State Management

- [ ] **STAT-01**: App uses lightweight state management (Zustand) instead of Context API
- [ ] **STAT-02**: Canvas state persists across app restarts
- [ ] **STAT-03**: User preferences persist across app restarts
- [ ] **STAT-04**: Undo/redo history persists within session
- [x] **STAT-05**: State updates maintain 60 FPS rendering

### Accessibility

- [ ] **ACCS-01**: App supports screen readers (VoiceOver, TalkBack)
- [ ] **ACCS-02**: App supports dynamic text sizes
- [ ] **ACCS-03**: App includes proper color contrast ratios
- [ ] **ACCS-04**: App provides accessibility labels for all interactive elements

### Performance

- [x] **PERF-01**: App maintains 60 FPS during canvas interactions
- [ ] **PERF-02**: Tool changes respond within 100ms
- [ ] **PERF-03**: App startup time is under 3 seconds
- [x] **PERF-04**: Canvas with 200x200 grid (40,000 pixels) renders smoothly
- [x] **PERF-05**: App uses React.memo and useMemo to optimize renders
- [ ] **PERF-06**: App uses requestAnimationFrame for animations

### Build & Deployment

- [ ] **DEPL-01**: App can be built for iOS App Store distribution
- [ ] **DEPL-02**: App can be built for Google Play Store distribution
- [ ] **DEPL-03**: App includes proper app icons and splash screens
- [ ] **DEPL-04**: App follows App Store and Google Play submission guidelines
- [ ] **DEPL-05**: App includes proper versioning and update mechanism

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Layer Support

- **LAYR-01**: User can create and manage multiple layers
- **LAYR-02**: User can toggle layer visibility
- **LAYR-03**: User can merge layers
- **LAYR-04**: User can reorder layers

### Template Library

- **TMPL-01**: User can browse pre-made designs
- **TMPL-02**: User can apply template to canvas
- **TMPL-03**: Community can contribute templates

### 3D Preview

- **3DPV-01**: User can view design in 3D bead form
- **3DPV-02**: User can rotate 3D preview
- **3DPV-03**: User can adjust lighting in 3D preview

### Advanced Editing

- **ADVE-01**: User can use gradient fill tool
- **ADVE-02**: User can use magic wand selection
- **ADVE-03**: User can apply filters to canvas (blur, sharpen, etc.)
- **ADVE-04**: User can transform selections (rotate, flip)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Push Notifications | PROJECT.md explicitly out of scope, user annoyance |
| Cross-Platform Sync | PROJECT.md explicitly out of scope, web and mobile data separate |
| Account System with Password | Unnecessary friction, privacy concerns |
| Complex User Profiles | Over-engineering for a creative tool |
| In-App Purchases/Ads | Violates CC BY-NC 4.0 license, user experience degradation |
| Social Media Integration | Bloates app, privacy concerns, use system share sheet instead |
| Real-time Collaboration | Overkill for single-person creative tool |
| Video Tutorials Built-In | Storage/bandwidth cost, link to external resources instead |
| Plugin System | Unnecessary complexity, security concerns |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | Phase 1 | Pending |
| FND-02 | Phase 1 | Pending |
| FND-03 | Phase 1 | Pending |
| FND-04 | Phase 1 | Pending |
| FND-05 | Phase 1 | Pending |
| CANV-01 | Phase 2 | Complete |
| CANV-02 | Phase 2 | Complete |
| CANV-03 | Phase 2 | Complete |
| CANV-04 | Phase 2 | Complete |
| CANV-05 | Phase 2 | Complete |
| CANV-06 | Phase 2 | Complete |
| CANV-07 | Phase 2 | Complete |
| DRAW-01 | Phase 3 | Pending |
| DRAW-02 | Phase 3 | Pending |
| DRAW-03 | Phase 3 | Pending |
| DRAW-04 | Phase 3 | Pending |
| DRAW-05 | Phase 3 | Pending |
| DRAW-06 | Phase 3 | Pending |
| DRAW-07 | Phase 3 | Pending |
| DRAW-08 | Phase 3 | Pending |
| COLR-01 | Phase 4 | Pending |
| COLR-02 | Phase 4 | Pending |
| COLR-03 | Phase 4 | Pending |
| COLR-04 | Phase 4 | Pending |
| COLR-05 | Phase 4 | Pending |
| COLR-06 | Phase 4 | Pending |
| COLR-07 | Phase 4 | Pending |
| COLR-08 | Phase 4 | Pending |
| COLR-09 | Phase 4 | Pending |
| IMPT-01 | Phase 4 | Pending |
| IMPT-02 | Phase 4 | Pending |
| IMPT-03 | Phase 4 | Pending |
| IMPT-04 | Phase 4 | Pending |
| IMPT-05 | Phase 4 | Pending |
| IMPT-06 | Phase 4 | Pending |
| IMPT-07 | Phase 4 | Pending |
| SELC-01 | Phase 4 | Pending |
| SELC-02 | Phase 4 | Pending |
| SELC-03 | Phase 4 | Pending |
| SELC-04 | Phase 4 | Pending |
| SELC-05 | Phase 4 | Pending |
| SELC-06 | Phase 4 | Pending |
| PROJ-01 | Phase 5 | Pending |
| PROJ-02 | Phase 5 | Pending |
| PROJ-03 | Phase 5 | Pending |
| PROJ-04 | Phase 5 | Pending |
| PROJ-05 | Phase 5 | Pending |
| PROJ-06 | Phase 5 | Pending |
| PROJ-07 | Phase 5 | Pending |
| PROJ-08 | Phase 5 | Pending |
| EXPR-01 | Phase 5 | Pending |
| EXPR-02 | Phase 5 | Pending |
| EXPR-03 | Phase 5 | Pending |
| EXPR-04 | Phase 5 | Pending |
| EXPR-05 | Phase 5 | Pending |
| EXPR-06 | Phase 6 | Pending |
| EXPR-07 | Phase 6 | Pending |
| AI-01 | Phase 6 | Pending |
| AI-02 | Phase 6 | Pending |
| AI-03 | Phase 6 | Pending |
| AI-04 | Phase 6 | Pending |
| AI-05 | Phase 6 | Pending |
| GALL-01 | Phase 6 | Pending |
| GALL-02 | Phase 6 | Pending |
| GALL-03 | Phase 6 | Pending |
| GALL-04 | Phase 6 | Pending |
| GALL-05 | Phase 6 | Pending |
| GALL-06 | Phase 6 | Pending |
| GALL-07 | Phase 6 | Pending |
| UI-01 | Phase 2 | Complete |
| UI-02 | Phase 2 | Complete |
| UI-03 | Phase 2 | Complete |
| UI-04 | Phase 2 | Complete |
| UI-05 | Phase 2 | Complete |
| UI-06 | Phase 3 | Pending |
| UI-07 | Phase 3 | Pending |
| UI-08 | Phase 3 | Pending |
| UI-09 | Phase 4 | Pending |
| UI-10 | Phase 4 | Pending |
| OFFL-01 | Phase 5 | Pending |
| OFFL-02 | Phase 5 | Pending |
| OFFL-03 | Phase 5 | Pending |
| OFFL-04 | Phase 6 | Pending |
| OFFL-05 | Phase 1 | Pending |
| NAV-01 | Phase 2 | Complete |
| NAV-02 | Phase 6 | Pending |
| NAV-03 | Phase 2 | Complete |
| NAV-04 | Phase 2 | Complete |
| NAV-05 | Phase 5 | Pending |
| STAT-01 | Phase 1 | Pending |
| STAT-02 | Phase 5 | Pending |
| STAT-03 | Phase 5 | Pending |
| STAT-04 | Phase 5 | Pending |
| STAT-05 | Phase 2 | Complete |
| ACCS-01 | Phase 5 | Pending |
| ACCS-02 | Phase 5 | Pending |
| ACCS-03 | Phase 3 | Pending |
| ACCS-04 | Phase 3 | Pending |
| PERF-01 | Phase 2 | Complete |
| PERF-02 | Phase 3 | Pending |
| PERF-03 | Phase 5 | Pending |
| PERF-04 | Phase 2 | Complete |
| PERF-05 | Phase 2 | Complete |
| PERF-06 | Phase 3 | Pending |
| DEPL-01 | Phase 6 | Pending |
| DEPL-02 | Phase 6 | Pending |
| DEPL-03 | Phase 6 | Pending |
| DEPL-04 | Phase 6 | Pending |
| DEPL-05 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 96 total
- Mapped to phases: 96
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after initial definition*
