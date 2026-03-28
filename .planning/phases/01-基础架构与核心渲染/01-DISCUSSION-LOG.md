# Phase 1: Foundation & Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves alternatives considered.

**Date:** 2026-03-28
**Phase:** 01-Foundation & Infrastructure
**Areas discussed:** Monorepo Structure, State Management Architecture, Build Configuration, MMKV Storage Strategy, Shared Package Organization, Expo Configuration, TypeScript Configuration

---

## Monorepo Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Expo SDK 52+ automatic monorepo | Official Expo monorepo support with automatic Metro configuration, pnpm workspaces | ✓ |
| Manual monorepo with Turborepo | Custom configuration, more control but higher complexity | |
| Single repo approach | Simpler but no code sharing between web and mobile | |

**User's choice:** [auto] Selected "Expo SDK 52+ automatic monorepo" (recommended default)

**Notes:**
- Expo SDK 52+ has native monorepo support, no manual metro.config.js needed
- Using pnpm workspaces with Expo automatic configuration is the modern approach
- Research indicates this is official recommendation from Expo team

---

## State Management Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Zustand with modular stores | Lightweight state management, avoids React Context performance issues | ✓ |
| Redux Toolkit | More boilerplate, but industry standard for complex state | |
| Recoil | Facebook's state management, less mature than Zustand | |

**User's choice:** [auto] Selected "Zustand with modular stores" (recommended default)

**Notes:**
- Research showed React Context causes performance death spiral with frequent state updates (60 FPS target)
- Zustand with modular stores (canvas, settings, ui) enables better separation of concerns

---

## Build Configuration

| Option | Description | Selected |
|--------|-------------|----------|
| babel-plugin-remove-console | Automatically strips console statements in production | ✓ |
| Manual console removal | Hand-coded remove in production builds only | |
| Keep console in production | Simpler but produces console noise | |

**User's choice:** [auto] Selected "babel-plugin-remove-console" (recommended default)

**Notes:**
- Meets FND-05 requirement for console.log removal in production builds
- Standard approach for React Native/Expo apps

---

## MMKV Storage Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Simple key-value with JSON serialization | Straightforward schema, MMKV handles complex values well | ✓ |
| Multiple MMKV instances per feature | More complex but better isolation | |
| Hybrid MMKV + AsyncStorage | Increases complexity, AsyncStorage deprecated for large data | |

**User's choice:** [auto] Selected "Simple key-value with JSON serialization" (recommended default)

**Notes:**
- Research showed AsyncStorage causes data wipes on Android for large data
- MMKV is 30x faster with synchronous API (critical for 200x200 canvas performance)
- Simple schema minimizes complexity while supporting nested structures via JSON

---

## Shared Package Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Three packages (color-system, shared-utils, shared-types) | Clear separation of concerns, reusable across platforms | ✓ |
| Single monolithic shared package | Simpler but harder to maintain as code grows | |
| Platform-specific shared packages | More control but duplicate code | |

**User's choice:** [auto] Selected "Three packages (color-system, shared-utils, shared-types)" (recommended default)

**Notes:**
- Matches research recommendation for monorepo code sharing
- Clear package boundaries enable better testing and maintenance
- Using @pixelbead/* namespace prevents conflicts

---

## Expo Configuration

| Option | Description | Selected |
|--------|-------------|----------|
| Expo SDK 55 with New Architecture | Latest stable SDK with New Architecture performance benefits | ✓ |
| Expo SDK 54 without New Architecture | Older SDK, synchronous JSI bindings not available | |
| Pure React Native (no Expo) | More control but lose Expo managed modules | |

**User's choice:** [auto] Selected "Expo SDK 55 with New Architecture" (recommended default)

**Notes:**
- New Architecture required for MMKV v4 with synchronous JSI bindings
- Research recommends Expo SDK 55 for 2025 new projects

---

## TypeScript Configuration

| Option | Description | Selected |
|--------|-------------|----------|
| Path aliases for shared packages | Clean imports, easy package refactoring | ✓ |
| Relative paths only | Simpler but harder to maintain | |
| TypeScript project references | More complex setup | |

**User's choice:** [auto] Selected "Path aliases for shared packages" (recommended default)

**Notes:**
- Enables clean imports like `import { mergeColors } from '@pixelbead/color-system'`
- Follows standard monorepo patterns

---

## agent's Discretion

None — all decisions were auto-selected with clear recommendations.

## Deferred Ideas

None — discussion stayed within Phase 1 scope (foundation and infrastructure only).
