# Cryptracker — Architecture & Design Decisions

Reference document for anyone evaluating the codebase. Covers the non-obvious choices, the tradeoffs, and the things worth defending in a code review or interview.

## API Layer

### Edge Proxy (`api/cg.ts`)

The Vercel Edge function forwards requests to CoinGecko. It exists for three reasons:

1. **CORS** — CoinGecko's free tier blocks browser requests. The proxy makes the API reachable from any origin.
2. **Caching** — Vercel Edge caches responses with `s-maxage=60, stale-while-revalidate=300`. This absorbs most repeat requests without hitting CoinGecko's rate limit.
3. **Key hiding** — A paid CoinGecko API key lives in environment variables, never in client code. The proxy injects `x-cg-pro-api-key` when `COINGECKO_API_KEY` is set.

**Security:** The proxy whitelists specific API paths. Any request that doesn't match `/coins/markets`, `/coins/`, `/search/trending`, `/search?`, or `/coins/categories` gets a 403. This prevents the edge function from being used as a general-purpose HTTP forwarder.

**Path routing:** Requests arrive at `/api/cg/*`, the rewrites in `vercel.json` strip the `/api/cg` prefix, and the handler operates on the remainder. This means the SPA calls `fetch('/api/cg/coins/markets?...')` and the proxy fetches `https://api.coingecko.com/api/v3/coins/markets?...`.

### API Client (`src/lib/api.ts`)

A thin fetch wrapper with typed response interfaces (`CoinMarket`, `CoinDetail`, `ChartData`, `TrendingCoin`). Every function returns `Promise<T>` — no Zod validation on the client side because CoinGecko's response shape is stable and well-documented. If you needed runtime safety here, Zod schemas would replace the interfaces and validate before return.

**Why no Zod here:** The Edge function already receives the data and passes it through. Adding another validation layer in the SPA doubles the parsing cost for a public API that doesn't change its contract without notice. The Zod boundary is at the function entry point on the Vercel edge side, not in the browser.

The API base is `/api/cg` — so the SPA always talks through the proxy, even in development. In dev, Vite proxies through its dev server (configured in `vite.config.ts` but proxied naturally since Vite picks up the same relative URL).

## State Management Strategy

Three concerns, three tools, zero overlap:

### 1. Server state → TanStack Query
Every API call is a `useQuery` with `queryKey` and `queryFn`. Query keys include relevant parameters (`['markets', page]`, `['chart', id, days]`) so cache invalidation is granular.

- `staleTime`: 60s for markets (freshness matters), 5min for trending/coin detail/charts (stable data)
- `gcTime`: 30min — cache persists in memory for navigation but eventually GCs
- `retry`: custom logic that skips retry on 429 (rate limited — retrying won't help)
- `placeholderData`: keeps previous data visible during background refetch for pagination

### 2. Navigation state → Router params
The browse page's current `page` is stored in the URL search param (`?page=3`). This means:
- Back/forward browser navigation works correctly
- Deep linking to a specific page works
- No state reset on accidental refresh

Router handles validation via `validateSearch` which coerces the search param to a number.

### 3. User state → localStorage
Two keys survive page refresh:
- `cryptracker:watchlist` — array of coin IDs
- `cryptracker:theme` — `'light'` | `'dark'` | `'system'`

Both use try/catch for reading/writing because `localStorage` can throw (private browsing, storage full). The watchlist is cached in component state on mount and flushed on every toggle. No sync mechanism needed because the data is tiny and single-user.

**Why no Zustand/Redux/Context:** The app never shares complex state across routes. Each page fetches its own data. The watchlist is read once on mount and updated on toggle. Adding a state library would add bytes, bundle cost, and mental overhead without solving any problem that exists.

## Theme System

CSS custom properties defined in `src/index.css`. Two color schemes (light and `.dark`) with OKLCH color space for perceptual uniformity.

- **Primary:** `oklch(0.78 0.14 80)` dark / `oklch(0.65 0.13 75)` light — a gold/amber hue, roughly #D4A017. Matches SA number plate yellow, chosen deliberately.
- **Surfaces:** 5-level hierarchy (background, card, popover, secondary, muted). Flat — no gradients, no glass effects.
- **Gain/Loss:** Green (`#16a34a`) and red (`#dc2626`) for price movements. Visible to deuteranopes (red-green is problematic but we pair with ▲/▼ symbols and position context).
- **Dark mode detection:** Defaults to `'system'` (respects OS preference). User toggle flips between resolved light/dark, not mode. The `system` mode listens for `matchMedia('prefers-color-scheme: dark')` changes.

The theme mode toggle cycles: resolved dark → light, resolved light → dark. It never re-enters `'system'` once the user manually toggles. This is intentional — manual override should persist.

## Routing Architecture

TanStack Router with file-based routing:

```
src/routes/
  __root.tsx    — Layout shell (theme wrapper, QueryClientProvider, nav)
  index.tsx     — Dashboard
  browse.tsx    — Paginated coin list
  coin.$id.tsx  — Coin detail (dynamic segment)
  watchlist.tsx — Saved coins
```

Key features:
- **Auto code-splitting:** `autoCodeSplitting: true` in the Vite plugin generates lazy chunks for each route. The initial bundle is only the layout + dashboard.
- **File-based params:** `coin.$id.tsx` maps to `/coin/:id`. Params are type-safe through generated route tree.
- **Search params:** Browse page uses `validateSearch` to parse and coerce URL search params. `useSearch({ from: '/browse' })` gives type-safe access.
- **Active link detection:** The bottom nav checks `location.pathname.startsWith(item.path)` with a special case for the root path to avoid matching everything.
- **`defaultPreload: 'intent'`:** Hovering a link preloads its chunk and data. Taps feel instant.

## Chart Component (`PriceChart.tsx`)

Wraps `lightweight-charts` — a TradingView library designed for financial data. Creates a line series from `[timestamp, price]` tuples.

Key decisions:
- **Line color based on trend:** Green if the last price >= first price, red otherwise. Simple and honest — no smoothing, no moving averages.
- **Transparent background:** The chart inherits the page's theme via CSS. No background color set in the chart itself.
- **Disabled scroll/scale:** Mobile users shouldn't accidentally zoom a chart when trying to scroll the page. The chart is read-only.
- **Responsive:** A resize listener calls `chart.applyOptions({ width })` on container resize. No ResizeObserver because the simple event listener covers the single use case (orientation change).
- **Time formatting:** `tickMarkFormatter` adapts to the selected range: HH:MM for 1D, weekday for 7D, date for 30D/1Y.

## PWA Configuration

`vite-plugin-pwa` with `autoUpdate` strategy — the service worker updates in the background and the next page load uses the new version.

**Runtime caching:** API responses use `NetworkFirst` strategy with a 3-second network timeout. If the network responds within 3s, the fresh data is served and cached. If it times out, the cached response is served. This means the app shows recent data even offline or on slow connections.

**Manifest:**
- `display: standalone` — no browser chrome
- `orientation: portrait` — crypto data is vertically dense; landscape offers no benefit
- `theme_color: #0f172a` — dark status bar on Android
- `icons` include both `any` and `maskable` purposes
- Apple PWA meta tags for iOS — `apple-mobile-web-app-capable` and `status-bar-style: black-translucent`

## Component Architecture

### Shared Components

**`CoinRow`** — Flat list item used in Browse, Watchlist, and any future list view. Shows rank, icon, name, symbol, price, and 24h change. Accepts an optional `trailing` slot for actions (remove from watchlist). The link wraps the entire row so tapping anywhere navigates to detail.

**`CoinCard`** — Horizontal card used in Dashboard carousels. More compact than CoinRow, designed for snap-scroll containers. Links to detail page.

**Skeleton variants** — Both components have `Skeleton` export variants that match their layout exactly. Rendered during initial load, replaced by real data once the query resolves.

### Page Components

Each page is a single component in its route file. No shared page-level abstraction exists because the pages don't share layout beyond the root shell. The patterns repeat (skeleton loading, query hook, data render) but vary enough that extracting a generic page wrapper would add indirection without eliminating meaningful duplication.

### UI Primitives

Shadcn components installed and customized:
- `button`, `card`, `input`, `skeleton`, `tabs`, `badge`, `sheet` (available but unused as of v2)
- All styled through CSS variables, not Tailwind classes on the individual components

## Error Handling

Three layers:

1. **Network errors** — `fetchJson` throws on non-ok responses. TanStack Query catches these and surfaces them through the `error` field on the query result.
2. **Rate limiting** — 429 responses skip retry (retrying against a rate limit is counterproductive).
3. **Empty/null data** — Every render path guards against null values. `formatZar(null)` returns `'—'`, watchlist with no coins shows an empty state with a call-to-action button.

No global error boundary because pages are independent — a crash on the coin detail page shouldn't take down the dashboard.

## Performance

- Initial JS: ~84KB gzipped
- Route chunks: 0.4KB–4KB each
- Lighthouse estimates: 90+ Performance (no render-blocking resources, proper image sizing, efficient caching)
- Build time: 5-8s on Vite 8
- Chart rendering: ~1-3ms per frame via lightweight-charts canvas renderer

## What's Not Here (And Why)

- **No E2E tests** — The app queries a live API. Mocking CoinGecko for Playwright tests would test the mocks, not the app. Integration tests at the TanStack Query layer would provide more signal with less maintenance. Not built yet.
- **No Storybook** — shadcn components are standard UI primitives. The app-specific components (CoinRow, PriceChart) would benefit from stories but the ROI isn't there for a portfolio project.
- **No Sentry** — Error tracking adds noise for a project with no paying users.
- **No CI pipeline** — Vercel's GitHub integration handles deploy previews. Biome runs locally. A CI step would be redundant until there are contributors.
