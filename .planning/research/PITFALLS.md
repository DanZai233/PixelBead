# Pitfalls Research

**Domain:** React Native Mobile App Development (PixelBead Mobile)
**Researched:** 2026-03-28
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: AsyncStorage Data Wipes on Android

**What goes wrong:**
On certain Android devices (notably Huawei and Samsung phones), AsyncStorage wipes all stored data when storage exceeds 4-6MB. Users lose all their saved settings and projects when reopening the app. The error manifests as: `E/SQLiteQuery: exception: Row too big to fit into CursorWindow requiredPos=0, totalRows=1; query: SELECT key, value FROM catalystLocalStorage WHERE key IN (?)`

**Why it happens:**
AsyncStorage uses SQLite on Android with a CursorWindow that has a size limit (typically 2MB per row). When a single key-value pair exceeds this limit, Android's SQLite implementation throws an error, causing data corruption or complete storage wipe on app restart. This is device-dependent - some Android devices have stricter limits than others.

**How to avoid:**
- **Never store large data in AsyncStorage** - use SQLite or MMKV for data > 1MB per key
- Use `MMKV` (from WeChat) or `WatermelonDB` for large datasets
- Implement data chunking if you must use AsyncStorage for larger objects
- Set `AsyncStorage_db_size_in_MB` in `android/gradle.properties` (this helps but doesn't fix the root issue)
- Store projects as individual keys rather than one massive JSON blob
- Implement data validation on app startup to detect corruption early

**Warning signs:**
- Reports of data loss from Android users (especially Huawei/Samsung)
- App crashes with SQLite errors on startup
- Storage operations throw "Row too big" errors
- User complaints about "app reset" after updates

**Phase to address:**
Phase 1 (Foundation) - Choose the right storage strategy before building data persistence features

---

### Pitfall 2: JavaScript Thread Blocking During Canvas Operations

**What goes wrong:**
Large canvas rendering (200x200 pixel grids) blocks the JavaScript thread for 200ms+ when users interact with the canvas. This causes dropped frames, unresponsive touch feedback, and animations freezing during drawing operations. The app feels sluggish and users think it's crashed.

**Why it happens:**
React Native has two threads: JavaScript thread (business logic) and main/UI thread (rendering). Canvas operations, pixel manipulation, and complex calculations run on the JavaScript thread by default. When processing 40,000 pixels (200x200 grid) with color calculations, fill operations, or pattern updates, the JS thread is overwhelmed. Main thread can scroll and handle native gestures, but touch responsiveness suffers because touch events must be processed on JS thread.

**How to avoid:**
- **Use `InteractionManager`** to defer non-critical work until after animations complete
- Implement **chunked rendering** - process grid in batches, not all at once
- Use **React Native Reanimated with native driver** for animations to keep them on UI thread
- Offload heavy computations to **native modules** (C++/Kotlin/Swift)
- Implement **virtualized canvas rendering** - only render visible viewport, not entire grid
- Use `requestAnimationFrame` for touch handlers to prevent blocking UI updates
- Consider **React Native Skia** for GPU-accelerated canvas rendering instead of standard Canvas API
- Cache computed results and avoid redundant recalculations

**Warning signs:**
- Touch feedback delayed (opacity changes on TouchableOpacity laggy)
- Animations freeze during drawing operations
- Perf Monitor shows JS FPS dropping to 15-30 FPS during interactions
- "Application not responding" warnings on Android

**Phase to address:**
Phase 2 (Core Features) - Performance test with 200x200 grid early, implement chunking strategy before building drawing tools

---

### Pitfall 3: Context API Performance Death Spiral

**What goes wrong:**
Using React Context API for frequently-updated state (e.g., canvas pixel data, tool selection, color changes) causes catastrophic performance degradation. Every state update triggers re-renders of ALL consuming components, even those that only use one field. Users experience 15 FPS (vs 60 FPS expected) as hundreds of components re-render unnecessarily on every pixel change.

**Why it happens:**
Context API's subscription model is coarse-grained - when Context value changes, ALL components consuming that Context re-render. With a monolithic Context (user, canvas, tools, colors, undo/redo), updating the current color re-renders the entire canvas. React doesn't know which components actually need the changed value. This multiplies: one pixel change = hundreds of re-renders × 60 times/second.

**How to avoid:**
- **Split contexts by domain** - separate AuthContext, CanvasContext, ToolsContext, ColorContext
- Use **Zustand** or **Redux** instead of Context for frequently-updated state
- Implement **selector-based subscriptions** (Zustand does this automatically)
- **Memoize Context values** to prevent unnecessary object recreation
- For pixel grid data, use **Immer** or **Immer.js** for efficient immutable updates
- Profile with React DevTools to identify hot spots before choosing state management
- Keep pixel grid data out of global state - use local state or specialized store

**Warning signs:**
- Perf Monitor shows hundreds of components re-rendering on every state change
- App feels slower as features are added (symptom of cumulative re-render cost)
- React DevTools Profiler shows high "committed time" for simple interactions
- State updates cause visible UI delays

**Phase to address:**
Phase 1 (Foundation) - Choose state management strategy (Zustand or Redux) before building canvas features

---

### Pitfall 4: VirtualizedList Nested in ScrollView Breaks Scrolling

**What goes wrong:**
Nested ScrollView components (common for toolbars, palettes, floating controls) conflict with the main canvas area. Scrolling becomes janky, gestures don't work correctly, and blank areas appear. Users can't reliably scroll through large canvases or interact with controls.

**Why it happens:**
React Native's `VirtualizedList` (basis of FlatList) relies on scroll position to determine which items to render. When nested in a plain ScrollView with the same orientation, parent ScrollView captures touch events, preventing VirtualizedList from receiving scroll gestures. This breaks windowing (virtualization) logic, causing the entire list to render at once (memory explosion) or fail to render at all (blank spaces). Both components try to control the same scroll view.

**How to avoid:**
- **Never nest VirtualizedList/FlatList inside ScrollView with same orientation**
- If you must nest, set **different scroll directions** (one horizontal, one vertical)
- Use **flexible layouts** instead of nested ScrollViews whenever possible
- Implement **custom gesture handling** with `PanGestureHandler` from react-native-gesture-handler to manage multi-touch scenarios
- For toolbars, use **absolute positioning** with `GestureDetector` wrapper instead of ScrollView
- Use `removeClippedSubviews={true}` with caution - it can cause missing content on iOS
- Consider **react-native-reanimated** for complex gesture interactions

**Warning signs:**
- Blank areas when scrolling large canvases
- Console warning: "VirtualizedLists should never be nested inside plain ScrollViews with the same orientation"
- Scrolling feels "sticky" or unresponsive
- Memory spikes when navigating between screens

**Phase to address:**
Phase 2 (Core Features) - Design gesture architecture before implementing virtual joysticks and canvas controls

---

### Pitfall 5: Gesture Handler Conflicts Break Touch Interactions

**What goes wrong:**
When using PanResponder (for canvas panning/zooming) alongside native gestures (react-navigation swipe-to-go-back, react-native-gesture-handler), gestures conflict unpredictably. Sometimes swiping works, sometimes not. Joysticks stop responding, or screen transitions trigger when drawing. Users cannot reliably interact with the app.

**Why it happens:**
React Native's gesture system allows multiple gesture recognizers to compete for touch events. Without explicit priority management, gestures may capture events in unintended ways. PanResponder, NativeGestureHandler, and platform gestures (navigation swipes, system gestures) all register simultaneously. React Native Gesture Handler uses a native gesture system that can conflict with PanResponder, especially on iOS where native swipes have higher priority.

**How to avoid:**
- **Use react-native-gesture-handler consistently** - avoid mixing PanResponder with RNGH
- Configure **simultaneous gestures** explicitly with `.simultaneousWithExternalGesture()`
- Set **gesture priority** with `.runOnJS(true)` or `.runOnJS(false)` to control which thread handles gestures
- Wrap your app in **GestureHandlerRootView** at the root level
- For canvas interactions, use **useAnimatedGestureHandler** with Reanimated for smoother performance
- Implement **exclusive gesture zones** - disable navigation gestures when drawing
- Test on both iOS and Android - gesture handling differs significantly between platforms
- Use `NativeViewGestureHandler` for integrating with native components

**Warning signs:**
- Drawing triggers navigation (screen changes when drawing)
- Joysticks unresponsive after certain interactions
- Gestures work on one platform but not the other
- Console errors about gesture conflicts

**Phase to address:**
Phase 2 (Core Features) - Implement unified gesture handling system before building canvas interaction features

---

### Pitfall 6: Memory Leaks from Improper Cleanup

**What goes wrong:**
App crashes after 15-30 minutes of use with "Out of memory" errors. Memory usage grows continuously even when users are idle. Instruments/Xcode shows retained ViewControllers and React Native components that never deallocate.

**Why it happens:**
React Native components use native memory (iOS: Objective-C/C++, Android: JNI). If event listeners, intervals, timers, or native subscriptions aren't cleaned up in `useEffect` cleanup functions, JavaScript references persist, preventing garbage collection. The garbage collector can't release native objects with active JavaScript references. Common culprits: `setInterval` without `clearInterval`, `addEventListener` without `removeEventListener`, native modules (like camera or BLE) without disconnect, and AsyncStorage/MMKV subscriptions.

**How to avoid:**
- **Always return cleanup function** from `useEffect` that cancels subscriptions
- Use **AbortController** for fetch requests to cancel ongoing network calls
- Implement **weak references** for long-lived callbacks where possible
- Test memory leaks with **Flipper React Native Debugger** or Xcode Instruments
- Use `react-native-mmkv` instead of AsyncStorage - it's more efficient with subscriptions
- For gesture handlers, ensure `onTouchEnd` or `onGestureEnd` properly resets state
- Profile memory regularly - memory growth should plateau, not continuously increase
- Use `useEffect` cleanup: `() => { clearInterval(interval); unsubscribe(); }`

**Warning signs:**
- App crashes after extended use (15-30 minutes)
- Memory usage increases in a straight line in profiling tools
- Performance degrades over time without obvious cause
- Xcode Instruments shows many "Malloc" allocations without matching frees

**Phase to address:**
Phase 2 (Core Features) - Implement memory leak detection in CI/CD, code review checklist for cleanup functions

---

### Pitfall 7: Console.log Statements Destroy Release Performance

**What goes wrong:**
Development mode feels acceptable, but release builds have terrible performance (dropping to 20-30 FPS). Touch responsiveness is slow, and users report app feeling "heavy."

**Why it happens:**
`console.log` statements aren't removed in release builds unless explicitly configured. They serialize objects to strings, allocate memory, and block the JS thread. In a canvas-heavy app with 60 FPS rendering, console operations add significant overhead. Even `redux-logger` or similar debugging middleware causes severe degradation. Third-party libraries also use console.log internally.

**How to avoid:**
- **Remove ALL console.log statements** before release builds
- Use **babel-plugin-transform-remove-console** to automatically strip console calls in production
- Set up **environment-specific logging** with a wrapper: `if (__DEV__) console.log(...)`
- Disable **redux-logger**, **redux-saga-logger**, and other middleware in production
- Configure Metro bundler to strip console logs: `transformer.minifierOptions.compress.drop_console = true`
- Create a pre-commit hook that fails if console.log is detected in production code

**Warning signs:**
- Dev builds feel smooth, release builds feel slow
- React Native DevTools shows "console.log" overhead in profiling
- Bundle size larger than expected

**Phase to address:**
Phase 1 (Foundation) - Set up console removal in build pipeline before writing any production code

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using AsyncStorage for all data | Simple API, no setup | Data wipes on Android > 6MB, poor query performance | NEVER - use MMKV or SQLite for > 1MB data |
| Context API for all state | No dependencies, built-in | Catastrophic re-render performance at scale | Only for rarely-changing state (theme, language) |
| Monolithic shared package (web+mobile) | Zero duplication, easy to start | Platform-specific APIs leak, bundle bloat, hard to test | NEVER - split by platform with shared core |
| `removeClippedSubviews={true}` everywhere | Reduces main thread work | Missing content on iOS, especially with transforms | Only after testing thoroughly on iOS |
| Inline anonymous functions in renderItem | Quick prototyping | New function every render, garbage collection pressure | NEVER - use useCallback |
| Skipping TypeScript | Faster development | Runtime errors, no IDE autocomplete | NEVER - critical for canvas logic |
| Directly importing platform-specific files | Works in development | Web builds fail, confusing error messages | NEVER - use .web.tsx, .native.tsx, .ios.tsx, .android.tsx |
| One giant component for canvas | Simple, no props | Impossible to test, 2000-line file, re-renders entire canvas | NEVER - break into sub-components |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| AsyncStorage (redux-persist) | Persisting entire 200x200 canvas (40k pixels) in one key | Store projects individually, use WatermelonDB or MMKV for large data |
| react-navigation (native-stack) | Using JavaScript-based stack navigator for better performance | Native stack is already native - use `@react-navigation/native-stack` for platform-native transitions |
| react-native-gesture-handler | Not wrapping app in `GestureHandlerRootView` | Add at root of App.js, wrap NavigationContainer |
| react-native-reanimated | Using Animated API (JS thread) for canvas animations | Use `useAnimatedStyle` with `useAnimatedProps` and native driver |
| MMKV | Storing complex nested objects | Flatten to simple key-value pairs, use JSON.stringify only for < 1KB values |
| SQLite (expo-sqlite) | Not closing database connections, not using transactions | Use connection pooling, wrap writes in transactions |
| Upstash Redis (share links) | Calling API from background, not handling network errors | Use NetInfo for offline detection, cache share links locally |
| Canvas API (react-native-skia) | Re-rendering entire canvas on every pixel change | Use `useCallback` for draw functions, only update modified regions |
| Hermes | Not enabling it, or debugging Hermes-specific errors | Enable by default, understand Hermes limitations (no Proxy, no eval) |
| Image caching (react-native-fast-image) | Not caching thumbnails, loading full-resolution images | Pre-generate thumbnails, cache aggressively with priority |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| **Re-rendering entire canvas on pixel change** | App freezes while drawing, 15 FPS | Use memoized sub-components, only re-render affected pixels | At 50x50 grids with frequent drawing |
| **FlatList without getItemLayout** | Blank spaces while scrolling, janky performance | Provide fixed item heights or use FlashList | With > 100 items in list |
| **Anonymous functions in render props** | Garbage collection spikes, memory growth | Use useCallback, define functions outside render | At 60 FPS with complex UI |
| **Large images in memory** | App crashes on image-heavy screens | Compress images, use thumbnails, lazy load | Loading > 20 high-res images |
| **Console.log in production** | 30 FPS vs 60 FPS in dev | Remove with babel plugin or conditional logging | Any production build |
| **Context API for 10k+ updates/sec** | Entire app re-renders, UI freezes | Use Zustand/Redux with selectors | Canvas pixel updates, real-time data |
| **Not using native driver for animations** | Animations stutter, drop frames | Set `useNativeDriver: true` in Animated | During screen transitions |
| **Blocking JS thread during startup** | App takes 5+ seconds to launch | Use InteractionManager, lazy load routes | With 50+ screens and heavy assets |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Storing auth tokens in AsyncStorage** | Tokens extracted from rooted/jailbroken devices | Use SecureStore (iOS Keychain/Android Keystore) for sensitive data |
| **API keys in client code** | Keys extracted from bundle with reverse engineering | Move to backend proxy, use environment variables with obfuscation |
| **Debug mode in production** | Dev menu accessible, console exposed | Ensure `__DEV__` is false in release builds |
| **Not validating user input before local storage** | XSS attacks, data corruption | Sanitize all user-generated content before persistence |
| **Unencrypted SQLite databases** | Data readable with file system access | Use SQLCipher or platform encryption APIs |
| **Ignoring SSL pinning** | Man-in-the-middle attacks on network | Implement certificate pinning for critical APIs |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **Web patterns on mobile** (right-click, hover states) | Features don't work, users confused | Implement touch equivalents (long-press, touch feedback) |
| **Small touch targets** (< 44x44px) | Users miss buttons repeatedly | Use minimum 44x44px, add hit-slop for visual padding |
| **No visual feedback on touch** | Users tap multiple times, uncertain if action registered | Use Touchable opacity changes, haptic feedback, loading indicators |
| **Blocking UI during save operations** | App feels frozen, users force-quit | Show progress indicators, run saves in background |
| **No offline indicator** | Users don't know why features don't work | Show clear "Offline" banner, disable online-only features visually |
| **Ignoring system gestures** (swipe-to-go-home on iOS) | Users can't navigate out of app | Use `react-native-screens` `enableFreeze()`, respect system gesture areas |
| **Same touch target for multiple actions** | Ambiguous interactions, accidental triggers | Separate touch zones, use long-press vs tap distinction |
| **No undo/redo for destructive actions** | Users lose work permanently | Implement undo stack for critical operations (clear canvas, delete) |

---

## "Looks Done But Isn't" Checklist

- [ ] **Canvas rendering:** Often missing viewport culling — verify only visible pixels render in Profiler
- [ ] **Gesture handling:** Often missing gesture conflicts — verify joystick doesn't trigger navigation
- [ ] **Offline storage:** Often missing data migration — verify projects survive app updates
- [ ] **State persistence:** Often missing error recovery — verify app recovers from corrupted storage
- [ ] **Memory management:** Often missing cleanup — verify no memory growth after 10 minutes of use
- [ ] **Platform differences:** Often missing iOS/Android parity — verify gestures work identically on both platforms
- [ ] **Large grid performance:** Often missing chunked rendering — verify 200x200 canvas renders at 60 FPS
- [ ] **Touch responsiveness:** Often missing touch feedback — verify opacity changes happen on same frame as touch
- [ ] **Bundle size:** Often missing tree-shaking — verify production bundle is < 15MB
- [ ] **Error boundaries:** Often missing error recovery — verify app doesn't crash on storage errors

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **AsyncStorage data wipe** | HIGH | Migrate to MMKV/WatermelonDB, implement data recovery from cloud if available, add migration script for existing users |
| **Context API performance death spiral** | MEDIUM | Split contexts by domain, migrate to Zustand gradually (one screen at a time), profile with React DevTools to identify hotspots |
| **Gesture conflicts** | MEDIUM | Replace PanResponder with react-native-gesture-handler, refactor to use GestureHandlerRootView, test all gesture combinations |
| **Memory leaks** | HIGH | Profile with Flipper/Instruments, identify unclosed subscriptions, add comprehensive useEffect cleanup, add memory tests to CI |
| **Console.log in production** | LOW | Add babel-plugin-transform-remove-console, release hotfix with console stripped, verify performance improvement |
| **VirtualizedList nesting** | MEDIUM | Redesign layout to avoid nested ScrollViews, use absolute positioning for controls, test on both platforms |
| **Native driver for animations** | LOW | Refactor Animated API calls to use native driver, verify animations work correctly on both platforms |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| AsyncStorage data wipes | Phase 1 (Foundation) | Load test with 10MB of data on Android devices, verify persistence across app restarts |
| JS thread blocking during canvas ops | Phase 2 (Core Features) | Profile 200x200 canvas interactions with Flipper, verify JS FPS stays > 55 |
| Context API performance death spiral | Phase 1 (Foundation) | Benchmark 10,000 state updates/sec with chosen state management, verify > 55 FPS |
| VirtualizedList nesting | Phase 2 (Core Features) | Test gesture conflicts on both iOS and Android, verify no "VirtualizedLists nested" warnings |
| Gesture handler conflicts | Phase 2 (Core Features) | Simulate 1000 touch interactions, verify all gestures fire correctly, no false positives |
| Memory leaks | Phase 2 (Core Features) | Run app for 30 minutes with continuous interaction, verify memory growth < 10% |
| Console.log in production | Phase 1 (Foundation) | Run release build with Flipper profiling, verify no console overhead in performance trace |
| Canvas re-renders | Phase 2 (Core Features) | Profile with React DevTools, verify < 10 components re-render on single pixel change |
| Touch responsiveness | Phase 2 (Core Features) | Measure touch-to-visual-feedback latency, verify < 16ms (one frame) on 95% of interactions |
| Offline storage migration | Phase 3 (Enhancement) | Test app upgrade from v1.0 to v2.0, verify all projects and settings persist |

---

## Sources

- **Official React Native Documentation** (Performance, FlatList optimization) - HIGH confidence
- **React Native GitHub Issues** (AsyncStorage #537 - data wipes on Android) - HIGH confidence
- **React Navigation Documentation** (Native stack navigator) - HIGH confidence
- **React Native Gesture Handler Documentation** (Troubleshooting guide) - HIGH confidence
- **React Native Skia Discussions** (Performance issues, memory leaks) - MEDIUM confidence
- **State Management Blogs** (Redux vs Context vs Zustand comparison) - MEDIUM confidence
- **Reddit Discussions** (React Native community issues, monorepo setups) - LOW confidence (community reports, not official)
- **GitHub Issues** (Gesture conflicts, memory leaks, performance problems) - MEDIUM confidence (reproducible issues)
- **Stack Overflow Q&A** (Specific error resolutions, workarounds) - LOW confidence (anecdotal solutions)

*Confidence notes:*
- Official documentation rated HIGH (authoritative source)
- GitHub issues rated MEDIUM (verified reproducible issues)
- Community discussions rated LOW (anecdotal, may be device-specific)
- Multiple independent sources discussing same pitfall increases confidence

---
*Pitfalls research for: React Native Mobile App Development (PixelBead)*
*Researched: 2026-03-28*
