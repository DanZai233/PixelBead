# Codebase Concerns

**Analysis Date:** 2026-03-27

## Tech Debt

### Monolithic Component Architecture
**Issue:** `App.tsx` is 2,602 lines with 50+ state variables, creating an unmaintainable monolith.
**Files:** `App.tsx`
**Impact:** Extremely difficult to debug, test, or extend. Any change risks breaking unrelated functionality. Causes performance issues due to excessive re-renders.
**Fix approach:** Extract features into separate components and custom hooks. Use React Context or state management library for shared state.

### Tailwind CSS via CDN
**Issue:** Tailwind CSS is loaded via CDN in `index.html` instead of being installed as an npm dependency.
**Files:** `index.html` (line 16)
**Impact:** No tree-shaking - entire Tailwind library (2MB+) loads in production. Slower initial page load, worse SEO, no build-time optimizations.
**Fix approach:** Install `tailwindcss` package, configure `tailwind.config.js`, run build process to purge unused styles.

### No ESLint Configuration
**Issue:** `package.json` includes lint script but no `.eslintrc*` or `eslint.config.*` file exists.
**Files:** `package.json` (line 11)
**Impact:** `npm run lint` will fail. No code quality enforcement. Potential bugs and inconsistent code style go undetected.
**Fix approach:** Create proper ESLint configuration with React and TypeScript rules. Install `eslint` as devDependency.

### Duplicate Code
**Issue:** `roundRect` canvas rendering function is duplicated in multiple files.
**Files:** `components/MaterialGallery.tsx` (lines 106-118, 199-211), `utils/colorUtils.ts` (lines 365-377)
**Impact:** Maintenance burden. Bug fixes must be applied in multiple places.
**Fix approach:** Extract to shared utility function.

### Incomplete Error Handling
**Issue:** Multiple `catch` blocks that only log to console without user feedback or recovery.
**Files:** `services/upstashService.ts`, `services/aiService.ts`, `services/materialService.ts`
**Impact:** Users see no error messages. Silent failures are confusing.
**Fix approach:** Implement proper error boundaries and user-friendly error toasts.

## Known Bugs

### Broken Lint Script
**Symptoms:** Running `npm run lint` fails with "eslint not found" error.
**Files:** `package.json`
**Trigger:** Any developer running `npm run lint`
**Workaround:** Use `npx tsc --noEmit` for type checking instead.

### DeepSeek Image Generation Error
**Symptoms:** Selecting DeepSeek AI provider always throws "DeepSeek 目前不支持图像生成" error.
**Files:** `services/aiService.ts` (line 20)
**Trigger:** Any attempt to use DeepSeek for AI image generation
**Workaround:** Use OpenAI, OpenRouter, VolcEngine, or Gemini instead.

### Material Gallery Pagination
**Symptoms:** Material list loads up to 200 items at once without pagination or virtualization.
**Files:** `api/materials.ts` (line 30)
**Trigger:** Opening material gallery with many items
**Workaround:** None - this impacts performance on large datasets.

## Security Considerations

### API Keys in Browser Storage
**Risk:** AI API keys stored in `localStorage` are accessible to any JavaScript running on the page.
**Files:** `App.tsx` (line 318), `services/aiService.ts`
**Current mitigation:** None. Keys stored in plain text.
**Recommendations:**
- Use Vercel serverless functions as proxy for AI API calls
- Store API keys only server-side
- Implement short-lived tokens instead of permanent keys
- Add environment variable validation

### Weak Admin Authentication
**Risk:** Custom HMAC-based token implementation is not a proper JWT. Simple string comparison of passwords.
**Files:** `api/admin/login.ts` (lines 4-9, 23)
**Current mitigation:** Uses Node.js `crypto.createHmac` for signing, but implementation is homegrown.
**Recommendations:**
- Use proper JWT library (e.g., `jsonwebtoken`)
- Implement password hashing (bcrypt)
- Add token expiration validation
- Use secure, httpOnly cookies for auth tokens
- Implement CSRF protection

### Overly Permissive CORS
**Risk:** All API routes allow requests from any origin (`Access-Control-Allow-Origin: *`).
**Files:** `api/materials.ts`, `api/admin/materials.ts`, `api/admin/login.ts`, etc.
**Current mitigation:** None.
**Recommendations:**
- Restrict CORS to specific domains (pindou.danzaii.cn, localhost)
- Remove CORS from admin routes (should be same-origin only)
- Implement origin validation for sensitive endpoints

### No Input Validation
**Risk:** Material uploads accept arbitrary data without validation of grid dimensions, color values, or content.
**Files:** `api/materials.ts` (line 41)
**Current mitigation:** Basic field presence check only.
**Recommendations:**
- Validate grid dimensions (min/max bounds)
- Validate color hex format
- Sanitize user-generated content (title, description, tags)
- Add rate limiting per user
- Implement content size limits

### No Rate Limiting
**Risk:** API endpoints have no rate limiting, vulnerable to abuse and DoS attacks.
**Files:** All API routes
**Current mitigation:** None.
**Recommendations:**
- Implement rate limiting middleware (e.g., `@upstash/ratelimit`)
- Add per-IP and per-user rate limits
- Implement exponential backoff for repeated failures

## Performance Bottlenecks

### Excessive State Management
**Problem:** App.tsx component has 50+ state variables, causing cascade re-renders.
**Files:** `App.tsx` (lines 52-131)
**Cause:** All application state in single component without proper memoization.
**Improvement path:**
- Split into multiple feature components
- Use `useMemo` for computed values
- Use `useCallback` for event handlers
- Consider state management library (Zustand, Redux, Jotai)

### Synchronous Thumbnail Generation
**Problem:** Material gallery generates thumbnails synchronously in useEffect, blocking UI.
**Files:** `components/MaterialGallery.tsx` (lines 173-183, 185-256)
**Cause:** Canvas operations executed on main thread during render cycle.
**Improvement path:**
- Move thumbnail generation to Web Worker
- Use `requestIdleCallback` for batched generation
- Implement progressive loading with placeholders
- Cache thumbnails in localStorage

### No List Virtualization
**Problem:** Material gallery renders all items at once regardless of viewport.
**Files:** `components/MaterialGallery.tsx` (lines 435-471)
**Cause:** Simple map render without virtualization library.
**Improvement path:**
- Implement `react-window` or `react-virtualized`
- Lazy load images with Intersection Observer
- Add pagination to API (already has limit, but needs pagination UI)

### Large Grid Rendering
**Problem:** Canvas rendering of 200x200 grids (40,000 cells) causes performance issues.
**Files:** `components/BeadCanvas.tsx`, `App.tsx`
**Cause:** Nested loops drawing each cell individually without optimization.
**Improvement path:**
- Implement canvas dirty rectangle rendering
- Use OffscreenCanvas for background rendering
- Add progressive rendering for large grids
- Consider WebGL for massive grids (100x100+)

## Fragile Areas

### App.tsx Component
**Files:** `App.tsx` (2,602 lines)
**Why fragile:** Every feature depends on this monolithic component. Changes frequently break unrelated functionality.
**Safe modification:**
- Always test entire application after any change
- Consider extracting features before modifying
- Add integration tests before refactoring
**Test coverage:** Zero tests. Any change is unverified.

### Color System Mapping
**Files:** `colorSystemMapping.json` (29,063 bytes), `utils/colorSystemUtils.ts`
**Why fragile:** Large JSON file with manual color mappings. Adding new brands or colors requires manual updates.
**Safe modification:**
- Validate mapping JSON structure in build step
- Add unit tests for color utility functions
**Test coverage:** Only one console.warn when palette empty.

### Canvas Event Handling
**Files:** `components/BeadCanvas.tsx` (lines 395-599)
**Why fragile:** Complex pointer/touch event handling with multiple refs and flags. Touch vs mouse logic intertwined.
**Safe modification:**
- Add unit tests for coordinate calculation
- Test on multiple devices (iOS, Android, desktop)
- Verify pinch-to-zoom and drag behavior
**Test coverage:** None. Manual testing only.

## Scaling Limits

### Redis Material List
**Current capacity:** Linear growth - materials list grows indefinitely
**Limit:** Will hit memory limits after ~10,000-50,000 materials (depends on Redis instance size)
**Files:** `services/upstashService.ts` (lines 154-156)
**Scaling path:**
- Implement pagination with cursor
- Add TTL to old materials
- Archive old materials to cold storage
- Implement material expiration/cleanup job

### MongoDB Query Performance
**Current capacity:** Materials collection not indexed properly
**Limit:** Queries will slow down after ~10,000 documents
**Files:** `api/materials.ts`, `api/admin/materials.ts`
**Scaling path:**
- Add compound indexes on `createdAt`, `author`, `tags`
- Implement MongoDB aggregation for analytics
- Add database query monitoring
- Consider sharding for large datasets

### Image Storage
**Current capacity:** Grid data stored inline in MongoDB documents
**Limit:** 16MB document limit will be hit with 200x200 grids
**Files:** `api/materials.ts` (line 45)
**Scaling path:**
- Move grid data to separate collection or cloud storage (S3, Cloudflare R2)
- Implement image compression (use fewer hex characters per color)
- Add data size validation before save

## Dependencies at Risk

### React 19 (Latest)
**Risk:** React 19 is very new. Some third-party packages may not support it yet.
**Impact:** Potential compatibility issues, breaking changes in future patch versions.
**Migration plan:**
- Pin to specific React version (e.g., 19.0.0)
- Monitor React ecosystem for package compatibility
- Have downgrade plan to React 18 ready

### Missing Three.js in package.json
**Risk:** Three.js is used (mentioned in README) but not listed in dependencies.
**Impact:** Build may fail, runtime errors possible.
**Files:** `package.json` (dependencies section)
**Migration plan:**
- Verify if Three.js is actually used
- If used: add `three` as dependency
- If not used: remove from README and clean up imports

### Tailwind via CDN
**Risk:** Production dependency on external CDN. If cdn.tailwindcss.com goes down, app breaks.
**Impact:** Complete application failure. No offline capability.
**Migration plan:**
- Install Tailwind as npm package
- Build CSS in production build
- Remove CDN dependency

## Missing Critical Features

### No Error Boundaries
**Problem:** React has no error boundary to catch and handle component errors.
**Blocks:** Graceful error handling, user-friendly error pages.
**Files:** `index.tsx`, `App.tsx`
**Impact:** Any uncaught error crashes entire application, showing blank screen.

### No Loading States
**Problem:** Async operations (AI generation, material loading) have no loading indicators.
**Blocks:** User feedback during long operations.
**Files:** `App.tsx`, `services/aiService.ts`
**Impact:** Users don't know if app is working or frozen.

### No Undo/Redo Persistence
**Problem:** Undo/redo history lost on page refresh.
**Blocks:** Recovery from accidental edits after reload.
**Files:** `App.tsx` (lines 138-142)
**Impact:** Data loss if user refreshes during editing.

### No Offline Support
**Problem:** No service worker or offline capability.
**Blocks:** Usage without internet connection.
**Files:** `index.html`
**Impact:** Application requires constant internet connection even for basic editing.

## Test Coverage Gaps

### Zero Test Files
**What's not tested:** Entire application codebase.
**Files:** All `*.ts` and `*.tsx` files
**Risk:** Any change can break existing functionality undetected.
**Priority:** High - Critical for maintenance and confidence in changes.

### No Component Tests
**What's not tested:** UI components, user interactions, state management.
**Files:** `components/*.tsx`
**Risk:** Regressions in UI behavior. Manual testing required for every change.

### No Integration Tests
**What's not tested:** API routes, database operations, AI service integration.
**Files:** `api/*.ts`, `services/*.ts`
**Risk:** Backend bugs may not be caught until production deployment.

### No E2E Tests
**Framework:** Not used
**What's not tested:** Complete user workflows (create design, AI generate, export, share).
**Risk:** Critical user paths may break without detection.

### No Type Validation Tests
**What's not tested:** TypeScript type safety, runtime type validation.
**Files:** `types.ts`, all type definitions
**Risk:** Runtime type errors from API responses or user input.

---

*Concerns audit: 2026-03-27*
