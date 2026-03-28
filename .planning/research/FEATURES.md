# Feature Landscape

**Domain:** Perler Beads / Pixel Art Design Tool Mobile Apps
**Researched:** 2026-03-28
**Confidence:** MEDIUM (Based on existing PixelBead features, competitor analysis of Zippland/perler-beads, Pix app, and general mobile app ecosystem)

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Canvas Editor** | Core functionality for pixel art creation | High | Canvas rendering with zoom/pan, grid display, pixel placement |
| **Image Import** | Users want to convert photos to pixel art | Medium | File picker, image scaling, intelligent pixelization |
| **Basic Drawing Tools** | Standard art tool expectations | Medium | Brush, eraser, fill bucket, color picker (eyedropper) |
| **Color Palette System** | Perler beads work with fixed color sets | Medium | Predefined palettes, color selection UI |
| **Export to Image** | Users need to save/print their work | Low | PNG export with optional grid lines and color codes |
| **Undo/Redo** | Mistake recovery is essential | Medium | History stack management |
| **Project Save/Load** | Work persistence | Medium | Local storage (offline) + cloud sync (online) |
| **Zoom/Pan Controls** | Essential for large canvases | Medium | Touch gestures (pinch-zoom, pan) |
| **Responsive UI** | Mobile apps must adapt to all screen sizes | Medium | Adaptive layouts for phone/tablet |
| **Dark/Light Theme** | Modern app expectation | Low | Theme switching capability |
| **Touch-Optimized Controls** | Mobile-first requirement | Medium | Tap targets ≥44px, gesture support |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **AI-Powered Generation** | Generate pixel art from text descriptions | High | **High competitive advantage** - PixelBead already has this with multiple AI providers |
| **Advanced Color Merging** | Reduce colors intelligently while preserving details | High | HSL-based similarity threshold, region-based merging (inspired by Zippland) |
| **Multi-Brand Color Systems** | Support multiple Perler bead brands (MARD, COCO, etc.) | Medium | Automatic color code mapping, per-brand color keys |
| **Real-Time Color Statistics** | Count beads needed per color instantly | Medium | Auto-calculate and display bead quantities for purchasing |
| **Background Removal** | Clean up imported images automatically | Medium | Flood-fill algorithm, mark external background as excluded |
| **Color Exclusion/Remapping** | Remove unwanted colors, smartly redistribute | High | BFS-based region merging, intelligent color replacement |
| **Advanced Cropping** | Select specific regions of images for conversion | Medium | Free-form selection, 1:1 crop with alignment options |
| **Selection Tools** | Copy/paste/clear selections | High | Rectangle selection, clipboard operations |
| **Shape Tools** | Draw lines, rectangles, circles | Medium | Multi-pixel shape rendering |
| **Material Gallery** | Browse and share community designs | High | Like/favorite system, online-only feature |
| **Virtual Joystick Controls** | Precise canvas navigation on mobile | Medium | **Already implemented** - left joystick (pan), right joystick (zoom) |
| **Immersive View Mode** | Focus on artwork creation | Low | Full-screen mode, toggleable grids/rulers/color codes |
| **Color Highlighting** | Highlight all pixels of selected color | Low | Tap color in statistics to see distribution |
| **Layer Support** | Work on multiple layers (deferred) | High | Advanced feature for complex designs |
| **Template Library** | Pre-made designs for beginners | Medium | Quick-start designs, community contributions |
| **3D Preview** | See how design looks in 3D bead form | High | Three.js integration - **already in web version** |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Social Media Integration** | Bloates app, privacy concerns, development overhead | Use system share sheet (native iOS/Android share) |
| **In-App Purchases/Ads** | Violates CC BY-NC 4.0 license, user experience degradation | Keep app free and open-source |
| **Push Notifications** | PROJECT.md explicitly out of scope, user annoyance | **Do not implement** - explicitly excluded |
| **Account System with Password** | Unnecessary friction, privacy concerns | Anonymous usage, optional cloud sync via simple tokens |
| **Complex User Profiles** | Over-engineering for a creative tool | Minimal profile: optional username/avatar |
| **Video Tutorials Built-In** | Storage/bandwidth cost, maintenance overhead | Link to external resources (YouTube/docs) |
| **Real-time Collaboration** | Overkill for pixel art, technical complexity | Export/import for collaboration is sufficient |
| **Cross-Platform Sync** | PROJECT.md explicitly out of scope | **Do not implement** - mobile and web data separate |
| **Multiple Canvas Editing** | Confusing UX, rare use case | Single canvas with undo/redo is sufficient |
| **Plugin System** | Unnecessary complexity, security concerns | Feature set should be comprehensive out-of-the-box |

## Mobile-Specific Features

| Feature | Why Mobile-Specific | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Touch Gestures** | Primary input method on mobile | Medium | Pinch-zoom, two-finger pan, tap/long-press, swipe |
| **Virtual Joystick Navigation** | Precise control without obscuring canvas | Medium | **Already implemented** - unique PixelBead feature |
| **Offline-First Architecture** | Mobile users have intermittent connectivity | High | Core editing works offline, gallery requires online |
| **Local Storage** | Save work without internet | Medium | AsyncStorage or SQLite for project files |
| **Haptic Feedback** | Enhance touch interactions | Low | Vibration on tool changes, actions |
| **App Store Distribution** | Reach broader mobile audience | Medium | iOS App Store + Google Play Store |
| **Deep Linking** | Handle share links from other apps | Low | Parse share URLs in mobile app |
| **Push Notification Permissions** | Even if unused, need to handle permission prompts | Low | Gracefully decline, don't annoy users |
| **Adaptive Layouts** | Support various screen sizes/orientations | High | Phone/portrait, phone/landscape, tablet |
| **Performance Optimization** | Limited mobile resources | High | Efficient rendering, memoization, requestAnimationFrame |
| **Keyboard Shortcuts (External)** | Users may connect keyboards to tablets | Low | Support Bluetooth keyboard shortcuts matching web version |
| **Accessibility Features** | App Store requirement for many regions | Medium | VoiceOver, screen reader support, dynamic text sizes |

## Feature Dependencies

```
Canvas Editor → All drawing features (brush, eraser, fill, etc.)
Color Palette System → Color Statistics → Bead Count Export
Image Import → Pixelization → Color Mapping → Color Merging
AI Generation → API Key Management → Text Input → Canvas Rendering
Virtual Joysticks → Touch Gesture System → Canvas Navigation
Project Save → Local Storage (offline) → Cloud Sync (online, optional)
Material Gallery → Network Request → MongoDB API → Like/Favorite System
Selection Tools → Clipboard Operations → Copy/Paste/Cut
Background Removal → Flood Fill Algorithm → External Background Marking
Color Exclusion → Color Remapping → Region-Based Color Merging
```

## MVP Recommendation

**Phase 1 (Core Editor - Table Stakes)**
1. Canvas Editor with touch-optimized controls
2. Basic drawing tools (brush, eraser, fill, color picker)
3. Color palette system with predefined palettes
4. Zoom/pan with pinch gestures
5. Undo/redo functionality
6. Project save/load (local storage)
7. Export to PNG with grid lines
8. Responsive UI (phone/tablet)
9. Dark/light theme

**Phase 2 (PixelBead Migration - Differentiators)**
1. Migrate all web editor features to mobile:
   - Advanced cropping (free-form, 1:1)
   - Selection tools (copy/paste/cut)
   - Shape tools (line, rectangle, circle)
   - Multiple pixel styles (circle, square, rounded)
   - HSL color picker + HEX input
   - Color statistics display
2. Import web color system logic (multi-brand palettes)
3. Virtual joystick controls (already implemented)

**Phase 3 (AI & Advanced Features - Strong Differentiators)**
1. AI pixel art generation (multiple providers)
2. Image import with intelligent pixelization
3. Advanced color merging (HSL-based, adjustable threshold)
4. Background removal
5. Color exclusion/remapping
6. Real-time bead count statistics
7. Multi-brand color code mapping

**Phase 4 (Community & Polish - Optional)**
1. Material gallery (online-only)
2. Like/favorite system
3. Cloud sharing (7-day TTL via Upstash Redis)
4. Template library
5. 3D preview (if performance allows)

**Defer:**
- Layer support: Complexity high, use case limited for Perler beads
- Real-time collaboration: Overkill for single-person creative tool
- Cross-platform sync: Explicitly out of scope per PROJECT.md
- Push notifications: Explicitly out of scope per PROJECT.md

## Complexity Ratings Explained

**Low Complexity:**
- Implementation straightforward (< 3 days)
- Well-understood patterns
- Minimal dependencies
- Examples: Export to image, dark theme, haptic feedback

**Medium Complexity:**
- Requires careful implementation (3-7 days)
- Multiple components interacting
- Some edge cases to handle
- Examples: Drawing tools, color palette system, touch gestures

**High Complexity:**
- Requires significant development (1-2+ weeks)
- Complex algorithms or large state management
- Performance-critical
- Examples: AI generation, advanced color merging, selection tools, layer support

## Mobile UX Considerations

**Navigation:**
- Bottom tab bar for main features (Editor, Gallery, Settings)
- Tool drawer sliding from side/bottom
- Gesture-based navigation where possible

**Canvas Interaction:**
- Virtual joysticks (left: pan, right: zoom) - unique PixelBead feature
- Two-finger gestures for common interactions (pinch zoom, two-finger pan)
- Long-press for context menus (color picker, copy, etc.)

**Performance Targets:**
- 60fps rendering for smooth panning/zooming
- < 100ms response to tool changes
- Handle 200x200 canvas without lag (40,000 pixels)

**Storage Strategy:**
- AsyncStorage for user preferences
- SQLite or AsyncStorage for project files (JSON format)
- IndexedDB via WebView for large projects (if needed)
- No cloud sync required (explicitly out of scope)

## Sources

- **PixelBead Web App** (/Users/danzai/PixelBead/README.md) - Comprehensive feature list, existing implementation
- **PROJECT.md** (/Users/danzai/PixelBead/.planning/PROJECT.md) - Mobile requirements, constraints, out-of-scope items
- **Zippland/perler-beads** (https://github.com/Zippland/perler-beads) - Color merging algorithms, multi-brand support
- **Illu/Pix** (https://github.com/Illu/Pix) - React Native mobile app, community features, Firebase integration
- **BeadMaker** (https://github.com/stone-j/BeadMaker) - Desktop app for Perler beads, image-to-bead mapping
- **Mobile App Best Practices** (general knowledge) - Touch gestures, offline-first, app store distribution

**Confidence Assessment:**
- High confidence: Table stakes features (standard creative tool requirements)
- High confidence: Mobile-specific considerations (React Native best practices)
- Medium confidence: Differentiators (based on PixelBead's existing unique features and competitor analysis)
- Medium confidence: Anti-features (based on PROJECT.md scope and open-source philosophy)
- Low confidence: Competitive landscape details (rate-limited web search, limited App Store access)

**Note:** Some competitor analysis was limited by API rate limits. Recommendations are based on available information, PixelBead's existing robust feature set, and general mobile app ecosystem knowledge.
