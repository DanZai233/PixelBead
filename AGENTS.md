# AGENTS.md

## Cursor Cloud specific instructions

This is a single-project React 19 + TypeScript + Vite 6 frontend application (拼豆糕手 / PixelBead Studio — a pixel art Perler Beads design tool).

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Vite Dev Server | `npm run dev` | 3000 | Only required service; host is `0.0.0.0` |

### Key commands

See `package.json` scripts. Summary:

- **Dev server:** `npm run dev`
- **Build:** `npm run build` (runs `tsc && vite build`)
- **Type check only:** `npx tsc --noEmit`

### Data storage architecture

- **Redis (Upstash):** Used for share links only — ephemeral data with 7-day TTL. Called directly from the browser via REST API. Env vars: `VITE_UPSTASH_REDIS_REST_URL`, `VITE_UPSTASH_REDIS_REST_TOKEN`.
- **MongoDB (Atlas):** Used for material gallery (素材广场) — persistent storage, supports larger grids (100x100+). Accessed via Vercel serverless API routes in `/api/`. Env var: `MONGODB_URI` (set in Vercel project settings, not exposed to browser).
- **Smart generate (拼豆智能生成):** `POST /api/ai/generate-image` — server-only env: `PIXELBEAD_AI_API_KEY` (required), optional `PIXELBEAD_AI_API_BASE`, `PIXELBEAD_AI_IMAGE_MODEL`. Client calls same-origin API; no user API keys in the app.
- The `/api/` directory is excluded from `tsconfig.json` and Vite build; it is compiled separately by Vercel's `@vercel/node` builder.

### Caveats

- **No ESLint config:** The `npm run lint` script exists in `package.json` but there is no `.eslintrc*` or `eslint.config.*` file, and `eslint` is not in `devDependencies`. The lint command will fail. Use `npx tsc --noEmit` for static analysis instead.
- **Material gallery API routes only work on Vercel:** The `/api/materials` endpoints require Vercel serverless functions and MongoDB. Locally, only the core editor and Redis share features are functional.
- **Capacitor iOS:** Use `npm run cap:sync` (runs `vite build --mode capacitor`) so `.env.capacitor` injects `VITE_API_BASE_URL`; native WebView otherwise requests relative `/api` against bundled assets and APIs fail.
- **Tailwind CSS is loaded via CDN** in `index.html`, not installed as a dependency.
