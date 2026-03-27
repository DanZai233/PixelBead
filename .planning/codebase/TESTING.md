# Testing Patterns

**Analysis Date:** 2026-03-27

## Test Framework

**Runner:**
- **None detected** - No testing framework configured
- No test runner in `package.json` devDependencies
- No test configuration files present

**Assertion Library:**
- None (no testing framework used)

**Run Commands:**
```bash
# No test commands available
npm run lint    # Will fail - no ESLint config
npm run build   # Runs TypeScript compiler and Vite build (not tests)
```

## Test File Organization

**Location:**
- Not applicable - no test files exist in codebase
- Test directory structure not established

**Naming:**
- Not applicable - no test files present
- Common patterns not enforced (e.g., `*.test.ts`, `*.spec.ts`)

**Structure:**
```
# No test directories exist
# Suggested structure (if implemented):
tests/
├── unit/
│   ├── components/
│   ├── services/
│   └── utils/
├── integration/
│   └── api/
└── e2e/
    └── scenarios/
```

## Test Structure

**Suite Organization:**
- Not applicable - no tests exist

**Patterns:**
- Not applicable - no tests exist

**Setup/Teardown:**
- Not applicable - no tests exist

**Assertion patterns:**
- Not applicable - no tests exist

## Mocking

**Framework:** None

**Patterns:**
- Not applicable - no tests exist

**What to Mock:**
- External API services (`@upstash/redis`, AI providers)
- Browser APIs (Canvas API, LocalStorage, FileReader)
- Network requests (fetch calls)

**What NOT to Mock:**
- Not applicable - no tests exist

## Fixtures and Factories

**Test Data:**
- Not applicable - no test fixtures exist

**Location:**
- Not applicable - no fixture directory

**Suggested fixture locations:**
- `tests/fixtures/` for sample data
- `tests/mocks/` for mock implementations

## Coverage

**Requirements:** None enforced

**Current Coverage:** 0% (no tests written)

**View Coverage:**
- No coverage tool configured
- Cannot measure coverage without tests

**Coverage tools that could be added:**
- `c8` (built-in to Vitest)
- `istanbul`
- `@jest/transform` (if using Jest)

## Test Types

**Unit Tests:**
- **Scope:** None tested
- **Recommendation:**
  - Test utility functions in `utils/` (pure functions ideal for unit testing)
  - Test service layer functions (color conversions, palette mapping)
  - Test type guards and validation functions

**Integration Tests:**
- **Scope:** None tested
- **Recommendation:**
  - Test component integration (App component with sub-components)
  - Test service integrations (Upstash, AI services) with mocked APIs
  - Test state management flow across components

**E2E Tests:**
- **Framework:** Not used
- **Scope:** None tested
- **Recommendation:**
  - Test critical user flows (create design, export, share)
  - Test mobile responsiveness
  - Test cross-browser compatibility

**Tools that could be used:**
- Playwright (recommended for E2E)
- Cypress
- Puppeteer
- Vitest (for unit/integration testing)

## Common Patterns

**Async Testing:**
- Not applicable - no tests exist

**Error Testing:**
- Not applicable - no tests exist

**Snapshot Testing:**
- Not applicable - no tests exist

## Testing Gaps

**Untested areas:**

**Core functionality (CRITICAL):**
- Canvas rendering logic (`components/BeadCanvas.tsx` - 624 lines)
- Drawing tools (pencil, eraser, fill, line, rect, circle)
- Color palette and color system mapping (`utils/colorSystemUtils.ts`)
- Grid state management and operations
- Export functionality (PNG generation, JSON export)

**AI services (HIGH PRIORITY):**
- AI image generation (`services/aiService.ts` - 364 lines)
- Multi-provider API integration (OpenAI, OpenRouter, DeepSeek, etc.)
- Image processing and pixel art conversion

**Data persistence (HIGH PRIORITY):**
- Upstash Redis integration (`services/upstashService.ts` - 257 lines)
- Share link generation and loading
- Material gallery API calls
- LocalStorage persistence

**Utility functions (MEDIUM PRIORITY):**
- Color conversion utilities (`utils/colorUtils.ts` - 522 lines)
- HSL/RGB color space operations
- Image cropping and processing
- Color distance calculations

**Components (MEDIUM PRIORITY):**
- All 15 React components in `components/` directory
- Modal dialogs (ColorPicker, SettingsPanel, HelpModal)
- Complex components (MaterialGallery, ImageCropSelector, AdminPanel)

**State management (MEDIUM PRIORITY):**
- Undo/redo stack operations
- Selection and clipboard operations
- Zoom and pan controls
- Mobile virtual joystick controls

**API routes (LOW PRIORITY):**
- Vercel API routes in `api/` directory
- Material gallery endpoints
- Admin authentication endpoints

**Performance considerations (LOW PRIORITY):**
- Canvas rendering performance
- Large grid operations (200x200 grids)
- Image upload and processing performance

**Risk of untested code:**
- **High risk:** Canvas rendering bugs could break entire application
- **High risk:** AI service integration failures could cause user frustration
- **High risk:** Data loss risks (export/import, localStorage persistence)
- **Medium risk:** Color mapping errors could produce wrong designs
- **Medium risk:** State management bugs could corrupt user work

**Priority Recommendations:**

**Phase 1 - Critical Path (Immediate):**
1. Set up testing framework (Vitest recommended)
2. Write unit tests for utility functions (`utils/colorSystemUtils.ts`, `utils/colorUtils.ts`)
3. Write unit tests for color conversion functions (pure functions, easy to test)
4. Set up test coverage tracking

**Phase 2 - Integration (Week 1-2):**
1. Write integration tests for core drawing tools
2. Write integration tests for color palette operations
3. Mock Upstash API for testing
4. Write tests for export/import functionality

**Phase 3 - Component Testing (Week 2-3):**
1. Write tests for ColorPicker component
2. Write tests for SettingsPanel component
3. Write tests for BeadCanvas component interactions
4. Write tests for modal dialogs

**Phase 4 - API and Services (Week 3-4):**
1. Write tests for AI service functions with mocked APIs
2. Write tests for Upstash service functions
3. Write integration tests for API routes (Vercel functions)
4. Write E2E tests for critical user flows

## Recommended Testing Stack

**For Unit/Integration Testing:**
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "jsdom": "^23.0.0"
  }
}
```

**For E2E Testing:**
```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

**Configuration:**
```javascript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', 'api/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

**Test scripts to add:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Example Test Structure

**Unit test example for utility function:**
```typescript
// tests/utils/colorSystemUtils.test.ts
import { describe, it, expect } from 'vitest';
import { hexToRgb, rgbToHsl, colorDistance } from '@/utils/colorSystemUtils';

describe('colorSystemUtils', () => {
  describe('hexToRgb', () => {
    it('should convert valid hex to RGB', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should return null for invalid hex', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#ZZZ')).toBeNull();
    });
  });

  describe('colorDistance', () => {
    it('should calculate distance between colors', () => {
      const distance = colorDistance('#FF0000', '#0000FF');
      expect(distance).toBeGreaterThan(0);
    });

    it('should return infinity for invalid colors', () => {
      expect(colorDistance('invalid', '#000000')).toBe(Infinity);
    });
  });
});
```

**Component test example:**
```typescript
// tests/components/ColorPicker.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from '@/components/ColorPicker';

describe('ColorPicker', () => {
  const mockOnColorChange = vi.fn();
  const mockOnClose = vi.fn();

  it('should render when open', () => {
    render(
      <ColorPicker
        selectedColor="#FF0000"
        onColorChange={mockOnColorChange}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should call onColorChange when color is selected', () => {
    render(
      <ColorPicker
        selectedColor="#FF0000"
        onColorChange={mockOnColorChange}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    // ... interact with color picker
    expect(mockOnColorChange).toHaveBeenCalled();
  });
});
```

## Test Setup Files

**tests/setup.ts:**
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;
```

## Test Commands

**After setup is implemented:**
```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Run UI for interactive testing
npm run test:ui

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Mock External Dependencies

**Upstash Redis mock:**
```typescript
// tests/mocks/upstash.ts
import { vi } from 'vitest';

export const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  lrange: vi.fn(),
  lpush: vi.fn(),
};

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => mockRedis),
}));
```

**AI service mock:**
```typescript
// tests/mocks/aiService.ts
import { vi } from 'vitest';

export const mockGeneratePixelArtImage = vi.fn();

vi.mock('@/services/aiService', () => ({
  generatePixelArtImage: mockGeneratePixelArtImage,
}));
```

## Testing Best Practices

**When writing tests:**
1. Test behavior, not implementation details
2. Write descriptive test names
3. Use `describe` blocks for grouping related tests
4. Mock external dependencies (APIs, browser APIs)
5. Test happy path and error cases
6. Use page object pattern for E2E tests
7. Keep tests independent (no shared state between tests)

**Test coverage goals:**
- Utility functions: 100% (pure functions)
- Service layer: 80%+ (with mocked APIs)
- Component tests: 70%+ (critical paths)
- Overall coverage: 70%+ minimum

**Testing anti-patterns to avoid:**
1. Testing implementation details (e.g., checking internal state)
2. Over-mocking (testing mocks, not real behavior)
3. Brittle tests that break on UI changes
4. Testing third-party libraries (trust their tests)
5. Skipping error cases (test both success and failure)

---

*Testing analysis: 2026-03-27*
