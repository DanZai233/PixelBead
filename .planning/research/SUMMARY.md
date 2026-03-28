# Project Research Summary

**Project:** PixelBead Mobile App (React Native)
**Domain:** React Native Mobile App / Perler Beads Pixel Art Design Tool
**Researched:** 2026-03-28
**Confidence:** HIGH

## Executive Summary

PixelBead is a creative tool mobile app for designing Perler bead pixel art. Expert teams build this using Expo SDK 55 with React Native 0.84, leveraging monorepo architecture to share business logic between web and mobile platforms. The recommended approach emphasizes offline-first architecture with synchronous MMKV storage for performance, native component optimization for 200x200 canvas rendering, and lightweight state management with Zustand to avoid React Context's performance pitfalls.

The key risks are performance-critical: large canvas operations can block the JavaScript thread causing dropped frames, improper storage strategy (AsyncStorage) causes data wipes on Android devices, and naive canvas rendering fails to maintain 60 FPS. Mitigation requires using React Native Skia for GPU-accelerated rendering, implementing virtualized FlatList with viewport culling, and adopting MMKV for synchronous local storage. The research strongly recommends starting with a monorepo structure to avoid duplicate business logic across platforms.

## Key Findings

### Recommended Stack

PixelBead Mobile should use Expo SDK 55 with React Native 0.84 as the core framework, providing file-based routing via Expo Router and managed native modules. State management should use Zustand with MMKV persistence middleware for lightweight, efficient state handling. Storage requires MMKV (not AsyncStorage) for 30x better performance and synchronous access critical for canvas operations. UI styling should use NativeWind for Tailwind utility classes, enabling code sharing with the existing web app. Canvas rendering must use React Native Skia for high-performance 2D graphics, capable of handling 200x200 pixel grids (40,000 cells) at 60 FPS. A monorepo structure with Turborepo or pnpm workspace should extract shared business logic into internal packages (`@pixelbead/color-system`, `@pixelbead/shared-utils`, `@pixelbead/shared-types`) to ensure consistency across platforms.

**Core technologies:**
- **Expo SDK 55 + React Native 0.84**: Cross-platform framework with managed native modules and file-based routing — recommended by React Native team as official framework for new apps
- **Zustand 5.0.x**: Lightweight global state management with minimal boilerplate and TypeScript support — solves React Context's performance death spiral
- **MMKV 4.3.0**: Synchronous key-value storage with 30x faster performance than AsyncStorage — critical for canvas operations and prevents Android data wipes
- **React Native Skia**: High-performance 2D graphics library by Shopify — GPU-accelerated canvas rendering essential for 200x200 grids
- **NativeWind**: Tailwind CSS for React Native — enables code sharing with web app's utility classes

### Expected Features

PixelBead Mobile must deliver core creative tool expectations: canvas editor with touch-optimized controls, image import with intelligent pixelization, basic drawing tools (brush, eraser, fill, color picker), color palette system with predefined Perler bead colors, export to PNG, undo/redo, project save/load, zoom/pan with pinch gestures, responsive UI for phone/tablet, and dark/light theme support. These table stakes features define a complete creative tool.

**Must have (table stakes):**
- **Canvas Editor** — Core functionality for pixel art creation with zoom/pan and grid display
- **Image Import** — Users expect to convert photos to pixel art
- **Basic Drawing Tools** — Brush, eraser, fill bucket, color picker (eyedropper)
- **Color Palette System** — Predefined Perler bead color sets
- **Export to Image** — Users need to save/print their work
- **Undo/Redo** — Essential mistake recovery
- **Project Save/Load** — Work persistence (offline-first)
- **Zoom/Pan Controls** — Essential for large canvases

**Should have (competitive):**
- **AI-Powered Generation** — Generate pixel art from text (high competitive advantage, PixelBead already has this)
- **Advanced Color Merging** — Reduce colors intelligently while preserving details
- **Multi-Brand Color Systems** — Support multiple Perler bead brands (MARD, COCO, etc.)
- **Real-Time Color Statistics** — Count beads needed per color instantly for purchasing
- **Virtual Joystick Controls** — Precise canvas navigation (already implemented, unique PixelBead feature)
- **Background Removal** — Clean up imported images automatically
- **Color Exclusion/Remapping** — Remove unwanted colors, smartly redistribute

**Defer (v2+):**
- **Layer Support** — High complexity, limited use case for Perler beads
- **Real-time Collaboration** — Overkill for single-person creative tool
- **Cross-Platform Sync** — Explicitly out of scope per PROJECT.md

### Architecture Approach

The architecture should use a monorepo pattern with shared packages separating platform-specific UI code from platform-agnostic business logic. The mobile app (`apps/mobile`) uses Expo Router for file-based routing, Zustand for state management with MMKV persistence for offline-first data layer, and React Native Skia for native canvas rendering. Shared packages (`packages/color-system`, `packages/shared-utils`, `packages/shared-types`) contain color algorithms, utility functions, and TypeScript types used by both web and mobile apps. Canvas rendering must implement FlatList virtualization with viewport culling to render only visible cells, maintaining 60 FPS for 200x200 grids. Gesture handling should use react-native-gesture-handler consistently to avoid conflicts with navigation gestures.

**Major components:**
1. **Presentation Layer** — Screens (Expo Router file-based routes), reusable components, navigation management
2. **State Management Layer** — Zustand stores (canvasStore, settingsStore) with MMKV persistence middleware
3. **Business Logic Layer** — Shared packages for color system algorithms, utility functions, domain rules
4. **Data Access Layer** — Local storage (MMKV) for offline-first, network API (MongoDB/Redis) for optional online features

### Critical Pitfalls

**AsyncStorage Data Wipes on Android** — Never store large data (> 1MB) in AsyncStorage. Use MMKV or SQLite instead. Android's CursorWindow size limit causes complete storage wipe when single key-value pairs exceed 2MB, especially on Huawei/Samsung devices. Address in Phase 1 by choosing MMKV as primary storage.

**JavaScript Thread Blocking During Canvas Operations** — Large canvas rendering (200x200 grids) blocks the JS thread for 200ms+, causing dropped frames and unresponsive touch feedback. Use InteractionManager to defer non-critical work, implement chunked rendering, offload heavy computations to native modules, and use React Native Skia for GPU-accelerated rendering. Address in Phase 2 with performance testing.

**Context API Performance Death Spiral** — Using React Context for frequently-updated state (canvas pixel data, tool selection) causes catastrophic re-renders. Every state update triggers re-renders of ALL consuming components, dropping FPS to 15. Use Zustand or Redux with selector-based subscriptions. Address in Phase 1 by choosing Zustand.

**VirtualizedList Nested in ScrollView Breaks Scrolling** — Nested ScrollView components conflict with canvas area, causing janky scrolling and blank areas. Never nest VirtualizedList/FlatList inside ScrollView with same orientation. Use different scroll directions or absolute positioning for toolbars. Address in Phase 2 when implementing canvas controls.

**Gesture Handler Conflicts** — PanResponder conflicts with native gestures (navigation swipes, system gestures), causing unpredictable behavior. Use react-native-gesture-handler consistently, wrap app in GestureHandlerRootView, configure simultaneous gestures explicitly. Address in Phase 2 before building canvas interactions.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & Infrastructure
**Rationale:** Establish correct storage strategy, state management, and build infrastructure before writing feature code. Prevents catastrophic rework from wrong choices (AsyncStorage data wipes, Context API performance issues).
**Delivers:** Monorepo structure, Expo SDK 55 app skeleton, Zustand stores with MMKV persistence, build pipeline with console.log removal, TypeScript configuration
**Addresses:** Table stakes: Project save/load, settings persistence
**Avoids:** AsyncStorage data wipes, Context API performance death spiral, Console.log in production

### Phase 2: Core Canvas & Performance
**Rationale:** Build the canvas editor with performance-critical optimizations early. If canvas performance can't reach 60 FPS, the app is not viable. Testing with 200x200 grid reveals blocking issues before feature bloat.
**Delivers:** Canvas editor with React Native Skia, FlatList virtualization, viewport culling, touch gesture handling, basic drawing tools (brush, eraser, fill, picker), zoom/pan with pinch gestures, virtual joystick controls
**Uses:** React Native Skia, React Native Reanimated, react-native-gesture-handler, Zustand canvasStore
**Implements:** FlatList optimization pattern, gesture handling system, offline-first storage

### Phase 3: PixelBead Feature Migration
**Rationale:** Migrate existing web features to mobile to achieve feature parity. Leverage shared packages for color system logic. Builds on solid foundation from Phases 1-2.
**Delivers:** Advanced cropping, selection tools (copy/paste/cut), shape tools (line, rectangle, circle), multiple pixel styles (circle, square, rounded), HSL color picker + HEX input, color statistics display, undo/redo stack management
**Uses:** Shared packages (`@pixelbead/color-system`, `@pixelbead/shared-utils`), Zustand stores

### Phase 4: AI & Advanced Features
**Rationale:** Add differentiators after core canvas is performant. AI generation and advanced color processing are high-complexity features that build on stable foundation.
**Delivers:** AI pixel art generation (multiple providers), image import with intelligent pixelization, advanced color merging (HSL-based, adjustable threshold), background removal, color exclusion/remapping, real-time bead count statistics, multi-brand color code mapping
**Uses:** AI provider APIs, shared color system algorithms

### Phase 5: Community & Polish
**Rationale:** Optional enhancements that are not critical for launch. Material gallery and cloud sharing are online-only features that can be deferred.
**Delivers:** Material gallery (online-only with MongoDB integration), like/favorite system, cloud sharing (7-day TTL via Upstash Redis), template library, 3D preview (if performance allows), accessibility features

### Phase Ordering Rationale

- **Foundation first**: Wrong storage or state management choices cause catastrophic rework (AsyncStorage data wipes, Context API performance death spiral). Address these in Phase 1 before feature development.
- **Performance early**: Canvas performance is make-or-break for a pixel art tool. Test 200x200 grid rendering in Phase 2 to detect JS thread blocking issues before feature complexity hides the problem.
- **Shared packages enable migration**: Phase 3 leverages monorepo structure established in Phase 1. Shared color system and utilities reduce duplication and ensure consistency.
- **Differentiators last**: AI and advanced features are high-complexity but not table stakes. Build them after core canvas is performant to avoid debugging performance issues through complex feature code.
- **Online features deferred**: Material gallery and cloud sharing require network connectivity and can be developed independently of offline-first core editor.

This ordering addresses pitfalls proactively: Phase 1 prevents AsyncStorage and Context API catastrophes, Phase 2 prevents JS thread blocking and gesture conflicts before they're hidden by feature complexity.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Canvas performance optimization — React Native Skia specific optimization patterns for 200x200 grids need validation. Virtualized rendering strategy may need tuning for mobile devices.
- **Phase 4:** AI integration — API key management strategies for mobile (SecureStore vs obfuscation), error handling for API failures, offline fallback for AI features.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Monorepo setup, Expo initialization, Zustand+MMKV configuration — all well-documented with official guides and examples.
- **Phase 3:** Feature migration from web to mobile — established patterns for shared packages, platform-specific components, React Native equivalents of web APIs.
- **Phase 5:** Material gallery and cloud sharing — standard REST API integration patterns, MongoDB/Redis usage matches web app implementation.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified with official React Native and Expo documentation. All technologies have stable releases and active maintenance. |
| Features | MEDIUM | Based on PixelBead's existing robust web feature set and general mobile app ecosystem knowledge. Competitor analysis limited by API rate limits. |
| Architecture | HIGH | Official Expo monorepo documentation, React Navigation patterns, and performance guidelines. Anti-patterns identified from community issues. |
| Pitfalls | MEDIUM | Critical pitfalls verified with official docs and GitHub issues. Some technical debt patterns based on community discussions (LOW confidence). |

**Overall confidence:** HIGH

Stack and architecture research relies on official documentation with clear version compatibility matrices. Feature research has high confidence for table stakes (standard creative tool requirements) and medium confidence for differentiators (based on PixelBead's existing features and limited competitor analysis). Pitfall research is high confidence for critical issues (official docs, GitHub issues) and medium confidence for technical debt patterns (community consensus).

### Gaps to Address

- **Competitor landscape detail**: Limited by API rate limits during web search. Recommendations based on PixelBead's existing feature strength and general mobile app knowledge rather than comprehensive competitive analysis. Address during planning by reviewing App Store descriptions and user reviews for top pixel art apps.
- **React Native Skia canvas optimization**: Performance patterns for 200x200 grids documented but not empirically tested. Address in Phase 2 by prototyping canvas rendering early and profiling with 200x200 grid on actual devices.
- **AI API key management**: Mobile-specific security patterns for API keys need validation. Address during planning by researching Expo SecureStore usage and industry best practices for mobile API key storage.

## Sources

### Primary (HIGH confidence)
- [React Native Docs - Get Started](https://reactnative.dev/docs/getting-started) — Recommends Expo as framework for new apps
- [Expo Router Docs - Introduction](https://docs.expo.dev/router/introduction) — Official routing solution with file-based convention
- [Expo Docs - EAS Build](https://docs.expo.dev/build/introduction) — Build and deployment service
- [React Navigation Docs](https://reactnavigation.org/docs/getting-started) — Navigation primitives
- [Expo Monorepo Documentation](https://docs.expo.dev/guides/monorepos/) — Official monorepo setup with workspaces
- [React Native Performance Docs](https://reactnative.dev/docs/performance) — Performance optimization guidelines
- [MMKV GitHub](https://github.com/mrousavy/react-native-mmkv) — Latest v4 with JSI and New Architecture
- [React Native Skia Docs](https://react-native-skia.org) — High-performance 2D graphics

### Secondary (MEDIUM confidence)
- [Zustand GitHub](https://github.com/pmndrs/zustand) — v5.0.12, lightweight state management
- [NativeWind Docs](https://www.nativewind.dev) — Tailwind CSS for React Native
- [React Native GitHub Issues #537](https://github.com/facebook/react-native/issues/537) — AsyncStorage data wipes on Android
- Community discussions on Reddit and GitHub recommending MMKV over AsyncStorage for performance-critical apps
- React Native ecosystem trends in 2025 favoring Zustand over Redux for new projects

### Tertiary (LOW confidence)
- State management blogs (Redux vs Context vs Zustand comparison) — Community consensus, needs validation
- Stack Overflow Q&A — Specific error resolutions, anecdotal solutions
- Mobile App Best Practices (general knowledge) — Touch gestures, offline-first, app store distribution

---
*Research completed: 2026-03-28*
*Ready for roadmap: yes*
