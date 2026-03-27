# External Integrations

**Analysis Date:** 2026-03-27

## APIs & External Services

**AI Providers:**

- **OpenAI** - Image generation via DALL-E 3
  - SDK: Direct REST API calls
  - Base URL: `https://api.openai.com/v1`
  - Env var: `OPENAI_API_KEY` (optional - user-supplied keys supported)
  - Models: GPT-4o, GPT-4o-mini, GPT-4 Turbo, DALL-E 3
  - Implementation: `services/aiService.ts` - `generateOpenAI()` function

- **OpenRouter** - Multi-provider AI gateway
  - SDK: Direct REST API calls
  - Base URL: `https://openrouter.ai/api/v1`
  - Env var: `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`
  - Models: GPT-4o, Claude 3.5 Sonnet, Gemini Pro 1.5, DALL-E 3
  - Implementation: `services/aiService.ts` - `generateOpenRouter()` function

- **DeepSeek** - AI models (text only)
  - SDK: Not used directly (text-only provider)
  - Base URL: `https://api.deepseek.com/v1`
  - Env var: `DEEPSEEK_API_KEY`
  - Models: DeepSeek Chat, DeepSeek Coder, DeepSeek Aider
  - Note: Currently blocked in `services/aiService.ts` - does not support image generation

- **VolcEngine (火山引擎)** - Chinese AI provider
  - SDK: Direct REST API calls
  - Base URL: `https://ark.cn-beijing.volces.com/api/v3`
  - Env var: `VOLCENGINE_API_KEY`
  - Models: Doubao Seedream 4K/2K, Doubao Pro 32K, Doubao Lite 32K
  - Implementation: `services/aiService.ts` - `generateVolcEngine()` function

- **Google Gemini** - AI image generation
  - SDK: Direct REST API calls (not using @google/genai package)
  - Base URL: `https://generativelanguage.googleapis.com/v1beta`
  - Env var: `GEMINI_API_KEY` (optional - can be user-supplied)
  - Models: Gemini 2.0 Flash, Gemini 1.5 Pro
  - Implementation: `services/aiService.ts` - `generateGemini()` function
  - Note: @google/genai package is installed but unused

## Data Storage

**Databases:**

- **MongoDB Atlas** - Material gallery (素材广场)
  - Connection: `MONGODB_URI` (Vercel environment variable)
  - Client: mongodb 7.1.0 (official driver)
  - Database: `pixelbead`
  - Collection: `materials`
  - Purpose: Persistent storage for user-submitted materials (100x100+ grids)
  - Access: Vercel serverless API routes in `/api/` directory
  - API routes:
    - `api/materials.ts` - CRUD operations (GET list, POST create)
    - `api/material/[id].ts` - Individual material operations
    - `api/material-views.ts` - View counter (POST)
    - `api/material-likes.ts` - Like counter (POST)
    - `api/admin/materials.ts` - Admin operations (GET, PUT, DELETE)
  - Features: Search by title/description/author/tags, pagination, sorting by creation date

- **Upstash Redis** - Share links and material gallery fallback
  - Connection: `VITE_UPSTASH_REDIS_REST_URL`, `VITE_UPSTASH_REDIS_REST_TOKEN`
  - Client: @upstash/redis 1.36.3
  - Purpose 1: Share links (ephemeral data with 7-day TTL)
    - Key pattern: `bead:{timestamp}:{random}`
    - Data: Grid data, dimensions, pixel style, metadata
    - TTL: 7 days (604800 seconds)
    - Size limit: 1MB per entry
    - Implementation: `services/upstashService.ts` - `saveToUpstash()`, `loadFromUpstash()`
  - Purpose 2: Material gallery fallback (when MongoDB unavailable)
    - List key: `materials:list` (Redis list)
    - Key pattern: `material:{timestamp}:{random}`
    - Data: Full material record with grid, metadata, view/like counts
    - No expiration (permanent storage in fallback mode)
    - Implementation: `services/upstashService.ts` - `saveMaterialToUpstash()`, `getMaterialList()`, `searchMaterials()`
  - Browser-based: Called directly from client-side code (no proxy needed)
  - Security: Token-based authentication via REST API

**File Storage:**
- Local filesystem only - No external file storage service
- Images stored as Base64 strings in memory/state
- Exported images generated client-side via canvas APIs

**Caching:**
- MongoDB connection caching in serverless functions (`cachedDb` pattern)
- No dedicated caching layer

## Authentication & Identity

**Auth Provider:**
- Custom implementation (no third-party auth provider)
- Admin panel authentication:
  - Implementation: HMAC-based token system
  - Env vars: `ADMIN_USERNAME`, `ADMIN_PASSWORD`
  - Token creation: `api/admin/login.ts` - `createToken()` function
  - Token verification: `api/admin/materials.ts` - `verifyToken()` function
  - Token format: `base64(payload).hmac_signature`
  - Token expiration: 24 hours (86400000ms)
  - Crypto: Node.js `createHmac` with SHA-256

- User-facing features:
  - No authentication required for core editor
  - No user accounts or sessions
  - Anonymous access to material gallery
  - Anonymous material submission (no user attribution required)

## Monitoring & Observability

**Error Tracking:**
- Console logging only (no dedicated error tracking service)
- Error logging: `console.error()` throughout codebase

**Logs:**
- Browser console logs for client-side debugging
- Vercel platform logs for serverless functions
- No centralized logging service

**Analytics:**
- Vercel Analytics (@vercel/analytics 2.0.0)
- Implementation: `index.tsx` - `<Analytics />` component
- Purpose: Usage analytics and performance monitoring
- No custom analytics tracking configured

## CI/CD & Deployment

**Hosting:**
- Vercel - Primary hosting platform
  - Build command: `npm run build`
  - Output directory: `dist/`
  - Config: `vercel.json`
  - Serverless functions: `/api/` directory
  - Edge functions: None used
  - Environment variables: Configured in Vercel project settings
  - Automatic deployments from Git pushes

**CI Pipeline:**
- None configured
- No GitHub Actions, no automated testing
- Manual deployment via Vercel Git integration

## Environment Configuration

**Required env vars:**

**For development (optional):**
- `GEMINI_API_KEY` - Google Gemini API key (can be user-supplied in UI)
- `OPENAI_API_KEY` - OpenAI API key (can be user-supplied in UI)
- `OPENROUTER_API_KEY` - OpenRouter API key (can be user-supplied in UI)
- `DEEPSEEK_API_KEY` - DeepSeek API key (can be user-supplied in UI)
- `VOLCENGINE_API_KEY` - VolcEngine API key (can be user-supplied in UI)

**For Redis (share links):**
- `VITE_UPSTASH_REDIS_REST_URL` - Upstash Redis REST endpoint URL
- `VITE_UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST API token

**For MongoDB (production on Vercel):**
- `MONGODB_URI` - MongoDB Atlas connection string (set in Vercel project settings)

**For admin panel (production):**
- `ADMIN_USERNAME` - Admin username (default: "admin")
- `ADMIN_PASSWORD` - Admin password (required for admin access)

**Secrets location:**
- Development: `.env` file (gitignored)
- Production: Vercel environment variables dashboard
- Browser-exposed vars: `VITE_UPSTASH_*` prefix (required for client-side Redis calls)
- Server-only vars: `MONGODB_URI`, `ADMIN_*` (not exposed to browser)

## Webhooks & Callbacks

**Incoming:**
- None configured

**Outgoing:**
- None configured

**Internal API Routes:**
- Material Gallery API:
  - `GET /api/materials` - List materials with optional search
  - `POST /api/materials` - Create new material
  - `GET /api/material/[id]` - Get individual material
  - `POST /api/material-views` - Increment view count
  - `POST /api/material-likes` - Increment like count

- Admin API:
  - `POST /api/admin/login` - Admin authentication
  - `GET /api/admin/materials` - List materials with pagination
  - `PUT /api/admin/materials` - Update material
  - `DELETE /api/admin/materials` - Delete material

All API routes implement CORS headers with `Access-Control-Allow-Origin: *`

## Third-Party Libraries and Their Purposes

**@google/genai 1.34.0**
- Purpose: Official Google Gemini AI SDK
- Usage: Installed in dependencies but not used in current codebase
- Current implementation: Direct REST API calls in `services/aiService.ts`

**@upstash/redis 1.36.3**
- Purpose: Redis client for Upstash (HTTP-based Redis)
- Usage: Share links and material gallery fallback storage
- Implementation: `services/upstashService.ts`

**@vercel/analytics 2.0.0**
- Purpose: Vercel analytics integration
- Usage: Pageview and performance tracking
- Implementation: `index.tsx` - Analytics component

**@vercel/node 5.6.15**
- Purpose: Vercel serverless functions types and utilities
- Usage: Type definitions for VercelRequest and VercelResponse
- Implementation: All `/api/` route handlers

**mongodb 7.1.0**
- Purpose: Official MongoDB driver for Node.js
- Usage: Material gallery persistence
- Implementation: All `/api/` route handlers in `/api/materials.ts`, `/api/material-views.ts`, etc.

**react-window 1.8.10**
- Purpose: Virtual scrolling for large lists/grids
- Usage: Installed but not used in current codebase
- Note: May have been intended for performance optimization of large grids

**@types/node 22.14.0**
- Purpose: TypeScript definitions for Node.js built-in modules
- Usage: Type checking for Node.js APIs in serverless functions

**@types/react-window 1.8.8**
- Purpose: TypeScript definitions for react-window
- Usage: Unused (react-window package itself is also unused)

---

*Integration audit: 2026-03-27*
