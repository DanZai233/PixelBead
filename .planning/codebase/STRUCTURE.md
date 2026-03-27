# Codebase Structure

**Analysis Date:** 2026-03-27

## Directory Layout

```
[project-root]/
├── components/          # React UI components
├── services/            # External API integration layer
├── utils/               # Utility functions
├── api/                 # Vercel serverless API routes
├── public/              # Static assets
├── scripts/             # Build/deployment scripts
├── harmonyos/           # HarmonyOS native app (separate platform)
├── index.html           # HTML entry point
├── index.tsx            # React entry point
├── App.tsx              # Main application component
├── types.ts             # Type definitions and constants
├── colorSystemMapping.json  # Color system mappings
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite build configuration
├── tsconfig.json        # TypeScript configuration
└── vercel.json          # Vercel deployment config
```

## Directory Purposes

**`components/`:**
- Purpose: React UI components for pixel art editor
- Contains: Canvas renderers, panels, modals, gallery, tools
- Key files: `BeadCanvas.tsx`, `Bead3DViewer.tsx`, `MaterialGallery.tsx`, `SettingsPanel.tsx`

**`services/`:**
- Purpose: External API integration and data persistence
- Contains: AI generation, Redis (Upstash), material gallery API
- Key files: `aiService.ts`, `upstashService.ts`, `materialService.ts`

**`utils/`:**
- Purpose: Pure utility functions for color operations and transformations
- Contains: Color conversion, distance calculation, export image generation
- Key files: `colorUtils.ts`, `colorSystemUtils.ts`

**`api/`:**
- Purpose: Vercel serverless functions for MongoDB operations
- Contains: Material CRUD, view/like counting, admin operations
- Key files: `materials.ts`, `material/[id].ts`, `material-views.ts`, `material-likes.ts`, `admin/materials.ts`

**`public/`:**
- Purpose: Static assets served by Vite
- Contains: Logo, favicon, other static files

**`scripts/`:**
- Purpose: Build and deployment automation
- Contains: Custom scripts (check directory for specifics)

**`harmonyos/`:**
- Purpose: HarmonyOS native application (separate platform)
- Contains: Native app code for HarmonyOS deployment
- Generated: Partially
- Committed: Yes

## Key File Locations

**Entry Points:**
- `index.tsx`: React application entry, renders App component and analytics
- `index.html`: HTML entry with Tailwind CDN and root div
- `App.tsx`: Main application component with all state and logic

**Configuration:**
- `package.json`: Dependencies and npm scripts
- `vite.config.ts`: Vite bundler configuration, dev server settings, path aliases
- `tsconfig.json`: TypeScript compiler options, path aliases
- `vercel.json`: Vercel deployment configuration
- `.env.example`: Environment variable template

**Core Logic:**
- `App.tsx`: All application state, event handlers, business logic (120K+ lines)
- `types.ts`: TypeScript types, enums, constants (COLORS, TOOLS, SHORTCUTS)
- `colorSystemMapping.json`: Hex color to color system key mappings

**Testing:**
- No test directory found - testing not currently implemented

## Naming Conventions

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `BeadCanvas.tsx`)
- Services: camelCase with `.ts` extension (e.g., `upstashService.ts`)
- Utils: camelCase with `.ts` extension (e.g., `colorUtils.ts`)
- API routes: kebab-case with `.ts` extension (e.g., `material-likes.ts`)
- Config files: kebab-case or camelCase with extension (e.g., `vite.config.ts`)

**Directories:**
- Plural nouns for collections (components/, services/, utils/)
- Lowercase for directory names

**Components:**
- Exported components use PascalCase (e.g., `export const BeadCanvas`)
- Props interfaces use PascalCase with "Props" suffix (e.g., `interface BeadCanvasProps`)

## Where to Add New Code

**New Feature:**
- Primary code: Add state and handlers to `App.tsx`
- UI: Create component in `components/[FeatureName].tsx`
- Services: Add to `services/[feature]Service.ts` if external API needed
- Types: Add types to `types.ts`
- Tests: Create test files alongside components (not currently implemented)

**New Component/Module:**
- Implementation: `components/[ComponentName].tsx`
- Types: Add to `types.ts` if shared across multiple files
- Styles: Use Tailwind CSS classes inline (no separate CSS files)

**Utilities:**
- Shared helpers: Add to `utils/[utilityName].ts`
- Keep pure functions with no side effects
- Export functions individually

**API Routes:**
- Implementation: `api/[route-name].ts`
- Serverless functions follow Vercel API pattern
- Excluded from TypeScript compilation via tsconfig.json

**New Color System:**
- Add mapping to `colorSystemMapping.json`
- Add to `ColorSystem` enum in `types.ts`
- Update `colorSystemOptions` in utils

## Special Directories

**`api/`:**
- Purpose: Vercel serverless API routes for MongoDB operations
- Generated: No (hand-written)
- Committed: Yes
- Excluded from: tsconfig.json and Vite build (compiled separately by Vercel)

**`harmonyos/`:**
- Purpose: HarmonyOS native application
- Generated: Partially (contains generated and hand-written code)
- Committed: Yes
- Independent: Separate codebase from React app

**`node_modules/`:**
- Purpose: NPM dependencies
- Generated: Yes (by npm install)
- Committed: No (in .gitignore)

**`dist/`:**
- Purpose: Vite build output
- Generated: Yes (by npm run build)
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-03-27*
