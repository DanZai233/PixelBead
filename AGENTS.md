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

### Caveats

- **No ESLint config:** The `npm run lint` script exists in `package.json` but there is no `.eslintrc*` or `eslint.config.*` file, and `eslint` is not in `devDependencies`. The lint command will fail. Use `npx tsc --noEmit` for static analysis instead.
- **All external services are optional:** Upstash Redis (share/gallery) and AI API keys (generation) are not required for the core pixel art editor to function. API keys are configured in-app by users.
- **Tailwind CSS is loaded via CDN** in `index.html`, not installed as a dependency.
