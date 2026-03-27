# Technology Stack

**Analysis Date:** 2026-03-27

## Languages

**Primary:**
- TypeScript 5.8.2 - All application code (components, services, utilities)
- HTML5 - Application markup and template

**Secondary:**
- JSON - Configuration and data storage (color mappings, metadata, manifest)
- JavaScript - Runtime environment (transpiled from TypeScript)

## Runtime

**Environment:**
- Node.js - Development server and build runtime
- Browser - Production runtime (Chrome, Safari, Firefox, Edge)

**Package Manager:**
- npm - Package management
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- React 19.2.3 - UI component framework
- ReactDOM 19.2.3 - DOM rendering for React
- TypeScript 5.8.2 - Type system and compiler

**Build/Dev:**
- Vite 6.2.0 - Build tool and dev server
- @vitejs/plugin-react 5.0.0 - React plugin for Vite

**Testing:**
- Not detected - No testing framework configured

**UI/Styling:**
- Tailwind CSS (via CDN) - Utility-first CSS framework loaded in `index.html`
- Custom CSS - Custom styles defined in `index.html` `<style>` block

## Key Dependencies

**Critical:**
- @google/genai 1.34.0 - Google Gemini AI SDK (installed but not used in current codebase)
- @upstash/redis 1.36.3 - Redis client for Upstash (share links and material gallery fallback)
- @vercel/analytics 2.0.0 - Analytics integration for Vercel deployments
- @vercel/node 5.6.15 - Vercel serverless functions types and utilities
- mongodb 7.1.0 - MongoDB driver for material gallery persistence
- react-window 1.8.10 - Virtual scrolling library (installed but not used)

**Infrastructure:**
- @vitejs/plugin-react 5.0.0 - Vite React plugin
- @types/node 22.14.0 - Node.js TypeScript definitions
- @types/react-window 1.8.8 - TypeScript definitions for react-window

## Configuration

**Environment:**
- Environment variables: `.env` file (gitignored), `.env.example` template
- Required for AI: `GEMINI_API_KEY` (optional - can use browser-supplied keys)
- Required for Redis: `VITE_UPSTASH_REDIS_REST_URL`, `VITE_UPSTASH_REDIS_REST_TOKEN`
- Required for MongoDB: `MONGODB_URI` (Vercel environment only)
- Admin: `ADMIN_USERNAME`, `ADMIN_PASSWORD` (for admin panel authentication)

**Build:**
- Build config: `vite.config.ts`
- TypeScript config: `tsconfig.json`
- Path alias: `@/*` maps to project root
- Vite dev server: Port 3000, host `0.0.0.0`
- Build output: `dist/` directory

**Vite Configuration:**
- Excludes `/api/` routes from bundling (external to Rollup)
- Defines `process.env.GEMINI_API_KEY` at build time
- Path aliases configured via `vite.config.ts`

**TypeScript Configuration:**
- Target: ES2022
- Module: ESNext
- JSX: react-jsx
- Strict mode enabled
- Excludes: `api/` directory (serverless functions), `lib/` directory

## Platform Requirements

**Development:**
- Node.js (version compatible with TypeScript 5.8.2 and Vite 6.2.0)
- npm (package manager)
- Modern web browser for development

**Production:**
- Vercel hosting platform (recommended deployment target)
- Static site hosting capability for `dist/` build output
- HTTPS required for Upstash Redis REST API (browser-based calls)
- MongoDB Atlas database (for material gallery persistence)
- Upstash Redis database (for share links, optional fallback for materials)

**PWA Support:**
- Web App Manifest: `public/manifest.json`
- Apple mobile web app capable
- Standalone display mode
- Portrait-primary orientation

---

*Stack analysis: 2026-03-27*
