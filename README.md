# Cryptracker

**ZAR-focused crypto price tracker.** Mobile-first PWA that hits the CoinGecko API through a Vercel Edge proxy. No backend. No database. No monthly bills.

**Live:** https://cryptracker.vercel.app
**Portfolio article:** https://karabo-portfolio.vercel.app/blog/cryptracker

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 19 + TypeScript 6 | Industry standard, hiring signal |
| Routing | TanStack Router v1 | File-based, type-safe params/search, auto-splitting |
| Data fetching | TanStack Query v5 | Cache management, stale-while-revalidate, pagination |
| Charts | lightweight-charts v5 | Trading-grade canvas, 60fps, no D3 dependency |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility-first, component primitives, dark mode |
| Icons | Lucide | Lightweight, tree-shakeable |
| PWA | vite-plugin-pwa | Offline cache, installable, auto-update |
| Proxy | Vercel Edge Function | CORS bypass, rate limit buffer, API key hiding |
| Validation | Zod v4 | Runtime type checking at the API boundary |
| Build | Vite 8 | Fast HMR, 5s production builds |
| Lint | Biome | Fast, unified formatter + linter, no ESLint/Prettier |

## Architecture

```
Browser (SPA)
  |
  +---> /api/cg/* ---> Vercel Edge Function ---> CoinGecko API
  |         (proxy)        (cache: 60s s-maxage)
  |
  +---> Static assets (Vite build, ~84KB gzip)
```

No server-side rendering. No Node.js runtime in production. The Edge function is a thin proxy that whitelists specific CoinGecko paths and forward-fetches with configurable caching. The SPA handles everything else.

## Key Decisions

### ZAR as primary currency
CoinGecko's free API includes ZAR prices out of the box. No API key required for basic usage. SA users see prices in their home currency without manual conversion. `Intl.NumberFormat('en-ZA')` handles formatting correctly across the board.

### No backend
The entire app is static files + one Vercel Edge function. No database, no auth, no server costs. The watchlist lives in localStorage. Data comes from a public API. This makes it deployable anywhere that serves static files and proxies API calls.

### No state manager
TanStack Query manages server state (caching, refetching, pagination). Router params manage navigation state (page number for browse). localStorage manages user state (watchlist, theme preference). That covers everything. Adding Zustand or Redux would be paying the complexity tax for zero benefit.

### Mobile-first layout
Fixed bottom navigation, `min-h-dvh` for dynamic viewport height, `env(safe-area-inset-bottom)` for notched phones, `overscroll-behavior-y: contain` to prevent pull-to-refresh from fighting the snap-scroll carousels. The layout is designed for one-handed use on a phone, not a 27" monitor.

### Gold/amber accent
The marquee yellow of SA number plates. Primary color sits at `oklch(0.78 0.14 80)` in dark mode, `oklch(0.65 0.13 75)` in light. Flat surfaces, borders for depth, no glassmorphism, no gradients, no shadows.

### Edge proxy
Sits between the browser and CoinGecko. Whitelists only known-good API paths. Sets `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` so Vercel's edge caches absorb the bulk of requests. Accepts an optional `COINGECKO_API_KEY` env var for rate limit upgrades. Without it, the free tier handles 10-30 req/min which is enough for a portfolio piece.

## Routes

| Path | Chunk | What it does |
|---|---|---|
| `/` | ~1KB | Dashboard: gainers, losers, trending horizontal carousels |
| `/browse` | ~1KB | Paginated coin list with client-side search filter |
| `/coin/$id` | ~4KB | Coin detail: chart, stats, description, watchlist toggle |
| `/watchlist` | ~2KB | Saved coins from localStorage, with remove action |

Every route is lazy-loaded via TanStack Router's auto-code-splitting. The initial payload is ~84KB gzipped.

## Running Locally

```bash
# Install
pnpm install

# Dev server (HMR at localhost:5173)
pnpm dev

# Build
pnpm build

# Preview production build
pnpm preview
```

The dev server calls CoinGecko directly from the browser. For production-accurate proxy behavior, deploy to Vercel:

```bash
pnpm vercel --prod
```

## Deploy

Push to GitHub triggers Vercel auto-deploy. The Edge function at `/api/cg.ts` is deployed as a Vercel serverless function with 256MB RAM and a 30s timeout — more than enough for CoinGecko's response times.

## PWA

Service worker registers on first visit with `autoUpdate`. API responses are cached with a `NetworkFirst` strategy (3s network timeout, then serve cache). The manifest declares `display: standalone` and `orientation: portrait`. Icons include a `maskable` variant for Android adaptive icons.

## What This Proves in an Interview

- I can ship a production-grade SPA with no runtime framework (no Next.js, no Remix)
- I chose TanStack Router + Query because they solve routing and caching better than framework defaults
- I built for a specific market (SA users, ZAR prices, mobile-first) instead of cloning a generic crypto dashboard
- I understand the deployment target (Vercel Edge) well enough to work around its limitations
- I kept the dependency list tight — no state manager, no charting library heavier than `lightweight-charts`
- The PWA works offline for previously viewed data
