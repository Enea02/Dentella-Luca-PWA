# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

PWA gestionale per panificio (ordini, produzione, totali, statistiche). Stack: Next.js 16 (App Router) + React 19, Drizzle ORM + Postgres (Neon), Auth.js v5 (Credentials/JWT), Tailwind 4 + shadcn/ui, SWR, Serwist (service worker). Lingua dell'UI: italiano.

## Commands

```bash
npm run dev          # dev server (Turbopack, NO service worker — see build note)
npm run dev:lan      # dev server bound to 0.0.0.0 (test from other LAN devices)
npm run build        # production build — MUST stay `next build --webpack`
npm run start        # production server (long-lived Node; required for realtime SSE)
npm run lint         # eslint

# Database (Drizzle + Neon)
npm run db:push      # apply schema directly (dev)
npm run db:generate  # generate a SQL migration from schema changes
npm run db:migrate   # apply generated migrations (prod) — tsx scripts/migrate.ts
npm run db:studio    # Drizzle Studio DB browser
npm run db:seed      # seed one bakery with realistic data
npm run bakery:create        # create a new bakery + first user (registration is CLI-only)
npm run db:add-admin-role    # extend role enum with `admin` + promote a user (idempotent)
```

No automated test suite exists. Verify changes by running the app (`npm run dev`) and exercising flows manually.

## Critical build/config constraints (non-obvious)

- **Build must use `--webpack`.** `@serwist/next` is a webpack plugin and always injects a `webpack` config key, which Next 16's default Turbopack rejects. `next.config.mjs` applies `withSerwist` **only** for production builds; `next dev` runs plain Turbopack with **no service worker**. Don't switch the build to Turbopack.
- **`typescript.ignoreBuildErrors: true`** in `next.config.mjs` — the build does **not** fail on type errors. Type problems surface only at runtime or via editor/`tsc`. Don't assume a green build means type-safe.
- **`allowedDevOrigins`** in `next.config.mjs` lists LAN IPs for cross-origin dev access; add new device IPs there when testing the PWA from phones/tablets.

## Architecture big picture

### Multi-tenancy
Every domain row is scoped by `bakery_id` (FK, cascade). A user belongs to exactly one bakery; queries always filter by `auth.bakeryId`. Registration is closed — only `bakery:create` (CLI) provisions a tenant. Realtime channels are per-bakery (`bakery:{id}`).

### Auth & permissions (the crystallized-JWT model)
- Auth.js v5, **JWT session strategy** (no DB session). `auth.ts` holds the Node-only Credentials provider; `auth.config.ts` holds the edge-safe callbacks + `middleware.ts` route protection.
- At **login**, `authorize()` loads role + computes effective permissions (base matrix + DB overrides) and bakes `role`, `permissions`, `bakeryId`, `mustChangePassword` into the JWT. The `jwt`/`session` callbacks only **copy** the token — they never re-query the DB.
- **Consequence:** changing a user's role or permissions does NOT take effect until that user logs out and back in (the JWT is stale). This is by design.
- `session.user.role` and the client `useAuth()` both **default to `'staff'`** when the role is missing from the token — a corrupted/undecodable JWT manifests as a silent admin→staff downgrade, not an error.
- Permissions: single source of truth is `lib/auth/permissions.ts` (`PERMISSIONS` matrix + `can()`). Same module is used by the frontend (`can(user, key)`) and backend. Runtime overrides live in `role_permission_overrides` / `user_permission_overrides`. The backend blocks any change that would leave the bakery with nobody holding `permissions:manage` (lock-out protection).
- Every API route is wrapped by `withAuth()` (`lib/api/handler.ts`): it validates the session, optionally enforces a `require` permission, runs the handler, and converts `ZodError`→400 / anything else→500. Input is parsed with `parseJson(req, zodSchema)`.

### Orders domain model (recurring vs daily) — the trickiest part
- **Fixed customers** have a `recurring_orders` template (`recurring_order_items`) keyed by weekday. **The order shown for a date is COMPUTED, not stored** — `GET /api/orders?date=` derives quantities from the template.
- `daily_orders` (+ `daily_order_items`) are per-date materializations that **override the recurring template entirely** for that date.
- `daily_item_status` stores per-day `done`/`variant` overrides for recurring items **without** mutating the template (so marking an item done on one day doesn't change the recipe).
- `getOrCreateDailyOrder()` (in `app/api/orders/items/route.ts`) **materializes** the template into a real `daily_order` the first time a *structural* edit (add/remove item, change quantity/unit) happens for that date, carrying over any `daily_item_status` overrides and then deleting those now-redundant rows.
- Implication: editing the recurring template changes what every (non-materialized) date computes. The orders view for those dates is derived data and must be re-fetched to reflect template edits.
- **Known issue (open):** `daily_order_items` has **no unique constraint** on `(dailyOrderId, productId)`, and the add-item path appends without dedup — so the same product can become duplicate rows (e.g. when `getOrCreateDailyOrder` seeds the recurring template and an added item repeats a seeded product), inflating totals. A related "shows qty 2 while DB is correctly 1/1/1" display bug is still under investigation. See `docs/order-item-duplication-bug.md`.
- **Statistics range:** `GET /api/orders/range` assembles each date with the same recurring/daily merge as the single-date GET, clamped to `MAX_DAYS` (367 ≈ one year). Future dates project fixed customers from their recurring templates, so the statistics page (presets incl. *Ultimo anno* / *Prossimo anno*) can quantify past **and** projected annual production.

### Data layer & caching (SWR) — read before touching order/list views
- `lib/swr-provider.tsx` sets a **localStorage-backed SWR cache** but only persists *reference* keys (`products`, `customers`, `sections`, `production-groups`, `divisors`, `bakery`). Orders/statistics/users are never served from old localStorage.
- Global SWR config: **`revalidateOnFocus: false`**, `keepPreviousData: true`. Only `useOrders(date)` has a `refreshInterval` (30s); all other hooks have **no auto-refresh** — they update only via explicit `mutate()` after the user's own action, a remount/reload, or a realtime event.
- `lib/api.ts` (`fetchApi`) is the single client fetcher: `cache: 'no-store'`, redirects to `/login` on **401**, throws `err.error` on other non-2xx.
- **Cross-cutting invalidation is the main footgun.** Mutations that change *derived* data must invalidate the dependent keys **locally** — do NOT rely on realtime (it's off on Vercel). This pattern is now in place: `useCustomers` (update/remove) and `CustomerEditDialog` invalidate `orders`+`statistics`; `useSections` (rename/remove) invalidates `products`; `useOrders` mutations invalidate `statistics`. When adding a mutation, invalidate every key whose data is derived from the change via `useSWRConfig().mutate(matcher)` (array-key matchers, e.g. `key[0] === 'orders' || key[0] === 'statistics'`). Without this, a derived view stays stale until the 30s `useOrders` refresh, a navigation, or (if enabled) a realtime event.

### Realtime sync (Postgres LISTEN/NOTIFY → SSE)
- Server: after a write **commits**, the API calls `notify(bakeryId, {type})` (`lib/realtime/notify.ts`) → `sql.notify('bakery:{id}', payload)`. `GET /api/events` (Node runtime, `force-dynamic`) opens an SSE stream; `lib/realtime/hub.ts` is a singleton holding one Postgres LISTEN connection per bakery while ≥1 client is subscribed, fanning NOTIFYs out as SSE frames.
- Client: `useRealtimeSync()` (mounted in `AppShell`) opens the EventSource and maps each event type to the SWR key(s) to `mutate()` (uses the bound `useSWRConfig().mutate`, never the global import — the custom localStorage provider would be missed otherwise).
- **Operational requirements (see `docs/realtime-disabled-analysis.md`):** realtime needs (1) a **DIRECT** Postgres connection, NOT a `-pooler`/PgBouncer transaction-mode endpoint (breaks LISTEN/NOTIFY), and (2) a **long-lived server** (`next start`) — on serverless/Vercel the SSE function is killed at the timeout, causing reconnect storms that leak Postgres LISTEN connections. On such hosts set `NEXT_PUBLIC_REALTIME_DISABLED=1` (a `NEXT_PUBLIC_*`, inlined at build → **rebuild** after changing) to skip the EventSource entirely.
- `notify()` is **best-effort** (wrapped in try/catch in `lib/realtime/notify.ts`): it runs AFTER the transaction commits, so a NOTIFY failure is logged and swallowed and never turns a successful save into a 500. Keep it that way — every mutation route calls it un-guarded at the call site, relying on this.
- **Deployment reality:** production currently runs on **Vercel** (serverless) with `NEXT_PUBLIC_REALTIME_DISABLED=1` → realtime is OFF; correctness relies on the local SWR invalidation above + the 30s orders refresh. The intended target is **self-hosted `next start` + local Postgres + Cloudflare Tunnel**, where realtime works (unset the flag and rebuild; the 25s SSE heartbeat in `app/api/events/route.ts` is sized for the tunnel's idle timeout).

## Environment
`.env.local` (see `.env.example`): `DATABASE_URL` (Neon), `AUTH_SECRET` (`openssl rand -base64 32`), `AUTH_TRUST_HOST=true` (required behind proxies). Optional: `NEXT_PUBLIC_REALTIME_DISABLED=1`. `AUTH_SECRET` must be stable across deploys or existing sessions become undecodable (→ 401 / silent staff downgrade).

## Repo hygiene note
The working tree previously held ~28 stray `* 2.*` duplicate files (merge residue) — now **deleted**. They were never imported (the non-`2` versions are live) and some were stale (e.g. an old `notify 2.ts` without the try/catch). If `* 2.*` files reappear after a merge, just delete them — never import or edit them. Also: don't commit build artifacts `next-env.d.ts` / `tsconfig.tsbuildinfo` (regenerated by Next/TS).

## Reference docs
Deeper analyses live in `docs/`: `realtime-disabled-analysis.md` (realtime trade-offs per environment + the local-invalidation audit), `order-item-duplication-bug.md` (the daily-order dedup issue), and `docs/legal/` (privacy/cookie/ToS/disclaimer drafts).
