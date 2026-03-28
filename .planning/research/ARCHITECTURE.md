# Architecture Research

**Domain:** React Native Mobile App Architecture (Expo + Monorepo)
**Researched:** 2026-03-28
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Screens    │  │  Components  │  │  Navigation  │  │
│  │   (Router)   │  │   (Reusable)  │  │  (Expo Router) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │             │
├─────────┼──────────────────┼──────────────────┼─────────────┤
│         │                  │                  │             │
│  ┌──────▼──────────────────▼──────────────────▼───────┐    │
│  │              State Management Layer                   │    │
│  │  (Zustand + MMKV Persistence)                    │    │
│  └──────┬──────────────────────────────────────────────┘    │
│         │                                                │
├─────────┼────────────────────────────────────────────────────┤
│         │                                                │
│  ┌──────▼──────────────────────────────────────────────┐   │
│  │              Business Logic Layer                   │   │
│  │  (Shared Package: color-system, utils, hooks)    │   │
│  └──────┬──────────────────────────────────────────────┘   │
│         │                                                │
├─────────┼────────────────────────────────────────────────────┤
│         │                                                │
│  ┌──────▼──────────────────────────────────────────────┐   │
│  │              Data Access Layer                       │   │
│  │  Local Storage (MMKV) │ Network (Redis/MongoDB API)  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Screens** | Route-level components, full-page views, navigation setup | Expo Router file-based routes in `app/` directory |
| **Shared Components** | Reusable UI elements (buttons, modals, panels) | UI components library in `components/` |
| **Navigation** | Screen transitions, deep linking, route management | Expo Router (file-based) or React Navigation (programmatic) |
| **State Management** | Global state, cross-component state persistence | Zustand with MMKV middleware for offline-first |
| **Business Logic** | Color system algorithms, utility functions, domain rules | Shared package in `packages/` directory |
| **Data Access** | Local storage operations, API calls, caching | MMKV for local, fetch/axios for remote |

## Recommended Project Structure

```
pixelbead/
├── apps/                       # Application targets
│   ├── web/                    # Existing Vite + React app
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── components/
│   │       ├── utils/
│   │       └── services/
│   │
│   └── mobile/                 # New Expo + React Native app
│       ├── app/                 # Expo Router file-based routing
│       │   ├── index.tsx        # Home screen (editor)
│       │   ├── gallery.tsx      # Material gallery (online only)
│       │   ├── settings.tsx     # Settings screen
│       │   ├── _layout.tsx      # Root layout with navigation
│       │   └── (tabs)/         # Tab navigator group
│       │       ├── editor.tsx
│       │       └── gallery.tsx
│       │
│       ├── components/           # Mobile-specific UI components
│       │   ├── BeadCanvas.tsx   # Native canvas component
│       │   ├── VirtualJoystick.tsx
│       │   ├── ColorPicker.tsx
│       │   └── MobileToolbar.tsx
│       │
│       ├── hooks/               # Custom React hooks
│       │   ├── useCanvas.ts
│       │   ├── useOfflineSync.ts
│       │   └── useColorSystem.ts
│       │
│       ├── store/               # Zustand stores
│       │   ├── index.ts
│       │   ├── canvasStore.ts
│       │   └── settingsStore.ts
│       │
│       ├── assets/              # Images, fonts, etc.
│       │   └── images/
│       │
│       ├── package.json
│       ├── app.json            # Expo configuration
│       ├── tsconfig.json
│       └── metro.config.js     # Metro bundler config (auto from SDK 52+)
│
├── packages/                   # Shared packages (monorepo)
│   ├── color-system/           # Color system logic (shared)
│   │   ├── package.json
│   │   ├── index.ts
│   │   ├── paletteUtils.ts
│   │   ├── colorMapping.ts
│   │   └── colorAlgorithm.ts
│   │
│   ├── shared-utils/           # Utility functions (shared)
│   │   ├── package.json
│   │   ├── index.ts
│   │   ├── colorUtils.ts
│   │   ├── gridUtils.ts
│   │   └── exportUtils.ts
│   │
│   └── shared-types/          # TypeScript types (shared)
│       ├── package.json
│       ├── index.ts
│       ├── canvas.ts
│       ├── color.ts
│       └── palette.ts
│
├── package.json               # Root package.json with workspaces
├── pnpm-workspace.yaml        # pnpm workspace configuration
├── tsconfig.base.json          # Shared TypeScript config
└── turbo.json                 # Turbo (optional) or Nx build orchestration
```

### Structure Rationale

- **`apps/`**: Separates web and mobile applications at the root level, enabling independent deployment pipelines
- **`packages/`**: Contains platform-agnostic business logic that both web and mobile import, ensuring consistency
- **`mobile/app/`**: Expo Router's file-based routing convention, auto-generates navigation from directory structure
- **`mobile/store/`**: Centralized state management with Zustand, separated from presentation for testability
- **`mobile/hooks/`**: Custom React hooks encapsulate complex state logic and side effects
- **`packages/color-system/`**: The most critical shared domain logic — color algorithms, palette utilities, mapping rules
- **`pnpm-workspace.yaml`**: pnpm's workspace configuration (preferred over npm for monorepo due to faster installs and disk space efficiency)

## Architectural Patterns

### Pattern 1: Monorepo with Shared Packages (PRIMARY PATTERN)

**What:** A single repository containing multiple applications (web, mobile) that share code through internal packages

**When to use:**
- Multiple platforms sharing business logic
- Need for consistency across platforms
- Independent deployment but shared maintenance

**Trade-offs:**
- ✅ Single source of truth for business logic
- ✅ Reduced code duplication
- ✅ Easier to maintain consistency
- ⚠️ Increased complexity in setup and configuration
- ⚠️ Requires monorepo tooling knowledge

**Example:**
```json
// package.json (root)
{
  "name": "pixelbead-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:web": "pnpm --filter @pixelbead/web dev",
    "dev:mobile": "pnpm --filter @pixelbead/mobile start",
    "build:web": "pnpm --filter @pixelbead/web build",
    "build:mobile": "pnpm --filter @pixelbead/mobile build"
  }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// packages/color-system/package.json
{
  "name": "@pixelbead/color-system",
  "version": "1.0.0",
  "main": "index.ts",
  "dependencies": {},
  "peerDependencies": {
    "react": "^19.0.0"
  }
}
```

```json
// apps/mobile/package.json
{
  "name": "@pixelbead/mobile",
  "dependencies": {
    "@pixelbead/color-system": "workspace:*",
    "@pixelbead/shared-utils": "workspace:*",
    "@pixelbead/shared-types": "workspace:*"
  }
}
```

### Pattern 2: File-Based Routing with Expo Router

**What:** Navigation structure derived from filesystem, routes automatically generated from file paths

**When to use:**
- New Expo projects (SDK 52+ recommended)
- Want deep linking out of the box
- Prefer file-based organization over programmatic routing

**Trade-offs:**
- ✅ Zero boilerplate for navigation
- ✅ Automatic deep linking
- ✅ Typed routes (with TypeScript)
- ✅ Shared routing structure across platforms
- ⚠️ Less flexible than programmatic routing
- ⚠️ Learning curve for file-based conventions

**Example:**
```tsx
// mobile/app/index.tsx - Home screen (editor)
import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View>
      <Text>PixelBead Editor</Text>
      <Link href="/gallery">Go to Gallery</Link>
    </View>
  );
}
```

```tsx
// mobile/app/gallery.tsx - Gallery screen
import { useLocalSearchParams } from 'expo-router';

export default function GalleryScreen() {
  const { category } = useLocalSearchParams();

  // Online-only check - redirect if offline
  const isOnline = useOnlineStatus();
  if (!isOnline) {
    return <Text>Gallery requires internet connection</Text>;
  }

  return <GalleryList category={category as string} />;
}
```

```tsx
// mobile/app/_layout.tsx - Root layout
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: 'Editor' }} />
        <Stack.Screen name="gallery" options={{ title: 'Gallery' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </>
  );
}
```

### Pattern 3: State Management with Zustand + MMKV Persistence

**What:** Lightweight state management library with synchronous storage persistence for offline-first architecture

**When to use:**
- Need global state beyond React Context
- Offline-first requirements
- Performance-critical applications
- Prefer simplicity over Redux

**Trade-offs:**
- ✅ Minimal boilerplate
- ✅ TypeScript-first
- ✅ Easy testing (no providers)
- ✅ Fast synchronous access with MMKV
- ⚠️ Less tooling than Redux DevTools
- ⚠️ Need to organize stores manually for large apps

**Example:**
```typescript
// mobile/store/canvasStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// Initialize MMKV instance
const storage = new MMKV();

// Zustand storage adapter for MMKV
const zustandStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => storage.delete(name),
};

interface CanvasState {
  grid: string[][];
  width: number;
  height: number;
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED';
  currentColor: string;
  tool: 'brush' | 'eraser' | 'fill' | 'picker';

  // Actions
  setGrid: (grid: string[][]) => void;
  setPixel: (x: number, y: number, color: string) => void;
  setColor: (color: string) => void;
  setTool: (tool: CanvasState['tool']) => void;
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      // Initial state
      grid: [],
      width: 50,
      height: 50,
      pixelStyle: 'SQUARE',
      currentColor: '#000000',
      tool: 'brush',

      // Actions
      setGrid: (grid) => set({ grid }),
      setPixel: (x, y, color) => {
        const { grid } = get();
        const newGrid = [...grid];
        newGrid[y][x] = color;
        set({ grid: newGrid });
      },
      setColor: (color) => set({ currentColor: color }),
      setTool: (tool) => set({ tool }),
      clearCanvas: () => set((state) => ({
        grid: Array(state.height).fill(null).map(() => Array(state.width).fill('#FFFFFF'))
      })),
    }),
    {
      name: 'canvas-storage',
      storage: zustandStorage, // MMKV storage
    }
  )
);
```

```tsx
// Usage in component
import { useCanvasStore } from '../store/canvasStore';

function BeadCanvas() {
  const { grid, currentColor, tool, setPixel } = useCanvasStore();

  const handleCellPress = (x: number, y: number) => {
    setPixel(x, y, currentColor);
  };

  return (
    <FlatList
      data={grid}
      renderItem={({ item, index }) => (
        <Row data={item} onPress={(colIndex) => handleCellPress(colIndex, index)} />
      )}
    />
  );
}
```

### Pattern 4: Offline-First Data Layer

**What:** Data access layer that prioritizes local storage and syncs when online

**When to use:**
- Core functionality must work offline
- User data needs persistence
- Network-dependent features are optional

**Trade-offs:**
- ✅ App works without network
- ✅ Better perceived performance
- ✅ Data protection (no data loss)
- ⚠️ Complexity in sync logic
- ⚠️ Need conflict resolution strategy

**Example:**
```typescript
// mobile/services/offlineStorage.ts
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'pixelbead-offline' });

export const offlineStorage = {
  // Canvas data
  saveCanvas: (id: string, grid: string[][], metadata: any) => {
    storage.set(`canvas:${id}`, JSON.stringify({ grid, metadata }));
  },

  getCanvas: (id: string) => {
    const data = storage.getString(`canvas:${id}`);
    return data ? JSON.parse(data) : null;
  },

  getAllCanvases: () => {
    const keys = storage.getAllKeys();
    const canvasKeys = keys.filter(k => k.startsWith('canvas:'));
    return canvasKeys.map(k => {
      const data = storage.getString(k);
      return data ? JSON.parse(data) : null;
    }).filter(Boolean);
  },

  deleteCanvas: (id: string) => {
    storage.delete(`canvas:${id}`);
  },

  // Settings
  saveSettings: (settings: any) => {
    storage.set('settings', JSON.stringify(settings));
  },

  getSettings: () => {
    const data = storage.getString('settings');
    return data ? JSON.parse(data) : null;
  },
};
```

```typescript
// mobile/hooks/useOfflineSync.ts
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { offlineStorage } from '../services/offlineStorage';

export function useOfflineSync() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        // Sync offline changes to server
        syncOfflineChanges();
      }
    });

    return () => unsubscribe();
  }, []);

  async function syncOfflineChanges() {
    const offlineCanvases = offlineStorage.getAllCanvases();

    for (const canvas of offlineCanvases) {
      if (canvas.metadata.synced === false) {
        try {
          // Upload to MongoDB via API
          await uploadToAPI(canvas);
          // Mark as synced
          canvas.metadata.synced = true;
          offlineStorage.saveCanvas(canvas.metadata.id, canvas.grid, canvas.metadata);
        } catch (error) {
          console.error('Sync failed for canvas', canvas.metadata.id, error);
        }
      }
    }
  }

  return { isOnline: useOnlineStatus() };
}

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  return isOnline;
}
```

### Pattern 5: Native Component Optimization for Large Grids

**What:** Using native components and virtualization to handle 200x200 grids at 60 FPS

**When to use:**
- Large data sets (thousands of items)
- Performance-critical scrolling/rendering
- Need to maintain 60 FPS

**Trade-offs:**
- ✅ Native performance
- ✅ Memory efficient
- ✅ Smooth scrolling
- ⚠️ Requires FlatList configuration
- ⚠️ More complex than simple map

**Example:**
```tsx
// mobile/components/BeadCanvas.tsx
import { FlatList, View } from 'react-native';

interface BeadCanvasProps {
  grid: string[][];
  width: number;
  height: number;
  pixelSize: number;
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED';
  onCellPress: (x: number, y: number) => void;
}

function BeadCanvas({ grid, width, height, pixelSize, pixelStyle, onCellPress }: BeadCanvasProps) {
  const renderRow = ({ item: row, index: rowIndex }: { item: string[]; index: number }) => (
    <View style={{ flexDirection: 'row' }}>
      {row.map((color, colIndex) => (
        <Cell
          key={colIndex}
          color={color}
          size={pixelSize}
          style={pixelStyle}
          onPress={() => onCellPress(colIndex, rowIndex)}
        />
      ))}
    </View>
  );

  // Critical for performance: fixed item height
  const getItemLayout = (_: any, index: number) => ({
    length: pixelSize,
    offset: pixelSize * index,
    index,
  });

  return (
    <FlatList
      data={grid}
      renderItem={renderRow}
      keyExtractor={(item, index) => `row-${index}`}
      getItemLayout={getItemLayout} // Skip measurement, improves performance
      removeClippedSubviews={true} // Unmount off-screen views
      maxToRenderPerBatch={10} // Render in batches
      windowSize={5} // Render only 5 screens of content
      initialNumToRender={10} // Initial render count
    />
  );
}

function Cell({ color, size, style, onPress }: any) {
  if (!color || color === '#FFFFFF') {
    return <View style={{ width: size, height: size, borderWidth: 1, borderColor: '#E5E7EB' }} />;
  }

  return (
    <TouchableOpacity onPress={onPress}>
      <View
        style={{
          width: size - 2,
          height: size - 2,
          margin: 1,
          backgroundColor: color,
          borderRadius: style === 'CIRCLE' ? size / 2 : style === 'ROUNDED' ? 4 : 0,
        }}
      />
    </TouchableOpacity>
  );
}
```

## Data Flow

### Request Flow

```
User Action (Touch/Interaction)
    ↓
Screen Component
    ↓
Zustand Store (State Update)
    ↓
MMKV Storage (Persistence) ←←←←←←←←←←←←←←←←←←← Offline path
    ↓
[Optional] Network API Sync ←←←←←←←←←←←←←←←←←←← Online only
    ↓
Response (UI Update via React re-render)
```

### State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Zustand Store                         │
│  ┌───────────────┐  ┌───────────────┐               │
│  │  canvasStore  │  │ settingsStore │               │
│  │   (persisted)  │  │   (persisted)  │               │
│  └───────┬───────┘  └───────┬───────┘               │
└──────────┼──────────────────┼─────────────────────────────┘
           │                  │
           ↓ (subscribe)      ↓
    ┌────────────────────────┴────────────────────────┐    │
    │             Components / Screens                 │    │
    │  (Read state, call actions)                  │    │
    └────────────────────────┬────────────────────────┘    │
                           │                               │
                           ↓ (action)                      │
                    ┌──────────────┐                        │
                    │ MMKV Write   │                        │
                    │ (Persistence) │                        │
                    └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Data Flows

1. **Canvas Editing (Offline-First):**
   - User taps cell → `canvasStore.setPixel()` → MMKV persistence → UI re-render
   - No network required → works offline instantly
   - Background sync when online (optional for later)

2. **Color System Application:**
   - User selects color system → `settingsStore.setColorSystem()`
   - `packages/color-system` applies mapping → new grid calculated
   - Result stored in `canvasStore` and MMKV

3. **Gallery Access (Online-Only):**
   - User navigates to gallery → Check `NetInfo.isConnected`
   - If offline: Show "Gallery requires internet" message
   - If online: Fetch from MongoDB API → Display results

4. **Image Export (Offline):**
   - User clicks export → `packages/shared-utils/exportUtils` generates image
   - Canvas rendered to native image format
   - Saved to device gallery (no network needed)

5. **Data Sync (Online-Optional):**
   - Periodic background sync when online
   - Check local canvases with `synced: false` flag
   - Upload to API, mark as synced on success
   - Conflicts resolved with "last-write-wins" strategy

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Monorepo fine, Zustand+MMKV sufficient, no changes needed |
| 1k-100k users | Optimize FlatList for large grids, implement lazy loading for gallery, add analytics |
| 100k+ users | Consider CDN for static assets, implement pagination for gallery, add A/B testing infrastructure |

### Scaling Priorities

1. **First bottleneck:** Large grid rendering (200x200) - Fixed with FlatList optimization and native components
2. **Second bottleneck:** Local storage size - MMKV handles millions of keys efficiently, but implement cleanup/aging strategy
3. **Third bottleneck:** Gallery API calls - Implement caching, pagination, and offline gallery indexing

## Anti-Patterns

### Anti-Pattern 1: Duplicated Business Logic in Web and Mobile

**What people do:** Copy color system algorithms, utility functions, and business rules into both `apps/web/src/utils` and `apps/mobile/utils`

**Why it's wrong:**
- Inconsistency bugs when logic diverges
- Maintenance burden - need to fix in two places
- Violates DRY principle

**Do this instead:**
- Move business logic to `packages/color-system` and `packages/shared-utils`
- Both web and mobile import from shared packages
- Single source of truth, tested once, shared everywhere

### Anti-Pattern 2: Using AsyncStorage for Large Grids

**What people do:** Store entire 200x200 grids (40,000 cells) in AsyncStorage

**Why it's wrong:**
- AsyncStorage is async - adds latency to every read/write
- No synchronous access needed for real-time canvas updates
- Slower than MMKV by 30%+ (based on benchmarks)

**Do this instead:**
- Use MMKV for synchronous access to canvas data
- Store grid data in Zustand with MMKV persistence middleware
- Only use AsyncStorage for small, infrequently accessed data

### Anti-Pattern 3: Hardcoded Navigation Paths

**What people do:** Use string literals for navigation like `navigation.navigate('GalleryScreen')`

**Why it's wrong:**
- Type errors when screen names change
- Deep linking doesn't work automatically
- Refactor requires updating all occurrences

**Do this instead:**
- Use Expo Router file-based routing (automatic deep linking)
- Use typed routes with TypeScript
- Let the filesystem define navigation structure

### Anti-Pattern 4: Naive Grid Rendering with Simple `map`

**What people do:** Render 200x200 grid using nested `grid.map(row => row.map(cell => ...))`

**Why it's wrong:**
- Renders all 40,000 cells at once
- Causes jank, drops frames, freezes UI
- Unacceptable performance on mobile devices

**Do this instead:**
- Use `FlatList` with `getItemLayout` for virtualization
- Implement `removeClippedSubviews`, `windowSize`, `maxToRenderPerBatch`
- Only render visible cells, unmount off-screen views

### Anti-Pattern 5: Blocking UI with Synchronous Operations

**What people do:** Perform heavy computations (color mapping, image processing) on JavaScript thread during user interaction

**Why it's wrong:**
- Blocks JavaScript thread → UI freezes
- Dropped frames → unresponsive app
- Poor user experience

**Do this instead:**
- Use `InteractionManager.runAfterInteractions()` for heavy work
- Use native modules for computationally intensive tasks
- Use `LayoutAnimation` for UI transitions (runs on native thread)

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **MongoDB (Atlas)** | REST API via `/api/` routes | Only for material gallery, accessed from mobile when online |
| **Redis (Upstash)** | Direct REST API calls | For share links, accessed from mobile when online |
| **React Native API** | Native modules via Expo | Use `expo-document-picker`, `expo-image-picker`, `expo-sharing` |
| **Device APIs** | Expo modules | Camera, File system, etc. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Web ↔ Mobile** | Shared packages | Both import `@pixelbead/color-system`, `@pixelbead/shared-utils` |
| **Screens ↔ Store** | Zustand hooks | Components use `useCanvasStore()`, `useSettingsStore()` |
| **Store ↔ Storage** | MMKV persistence | Automatic via Zustand middleware |
| **Mobile ↔ API** | fetch/axios | Only when online, handle offline gracefully |
| **Canvas ↔ Color System** | Shared package | Mobile imports from `@pixelbead/color-system` |

## Sources

- [Expo Monorepo Documentation](https://docs.expo.dev/guides/monorepos/) - **HIGH confidence** - Official Expo documentation on monorepo setup with workspaces
- [React Native Core Components](https://reactnative.dev/docs/next/intro-react-native-components) - **HIGH confidence** - Official React Native documentation
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/) - **HIGH confidence** - Official Expo Router documentation on file-based routing
- [React Navigation Documentation](https://reactnavigation.org/docs/getting-started) - **HIGH confidence** - Official React Navigation documentation
- [AsyncStorage Documentation](https://docs.expo.dev/versions/latest/sdk/async-storage/) - **HIGH confidence** - Official Expo AsyncStorage documentation
- [React Native Performance](https://reactnative.dev/docs/0.84/performance) - **HIGH confidence** - Official React Native performance guide
- [MMKV vs AsyncStorage comparisons](https://www.linkedin.com/posts/ajay-duhan-827929286_reactnative-mobiledevelopment-mmkv-activity-7371453311083991040-0BqT) - **MEDIUM confidence** - Community comparison, multiple sources agree MMKV is faster
- [Zustand Documentation](https://github.com/pmndrs/zustand) - **MEDIUM confidence** - GitHub README, widely adopted state management library

---
*Architecture research for: React Native Mobile App (Expo + Monorepo)*
*Researched: 2026-03-28*
