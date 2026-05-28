# Piano di Ottimizzazione Performance PWA Panificio

> Analisi completata il 27/05/2026. Da implementare in 4 sprint.

## Contesto

La PWA "Panificio - Gestionale" e un'app Next.js 16 (App Router, React 19) usata quotidianamente su mobile dal personale di un panificio. Attualmente ha il manifest.json ma **zero service worker**, nessuna strategia di caching, e diversi colli di bottiglia nelle performance. L'obiettivo e rendere l'app veloce, reattiva e affidabile anche con connessione instabile.

**Stack**: Next.js 16, Drizzle ORM + Neon PostgreSQL, SWR, Zustand, NextAuth v5, Tailwind CSS v4, Radix UI. Deploy su Vercel.

---

## Problemi Identificati

### Critici

| # | Problema | Dove | Impatto |
|---|---------|------|---------|
| 1 | **Nessun Service Worker** | Intero progetto | App installabile ma zero cache degli asset, zero capacita offline |
| 2 | **Statistiche N+1** | `lib/api.ts` → `getOrdersForDateRange()` | Fino a 90 richieste HTTP separate (una per giorno), ognuna con 5 query DB = fino a 450 query |
| 3 | **API Orders pesante** | `app/api/orders/route.ts` | 5 query DB sequenziali per ogni richiesta di ordini giornalieri |
| 4 | **Zero caching server-side** | Tutte le API routes | Nessun header Cache-Control, ogni chiamata colpisce il DB direttamente |

### Alti

| # | Problema | Dove | Impatto |
|---|---------|------|---------|
| 5 | **SWR non ottimizzato** | `hooks/useData.ts` | Solo `revalidateOnFocus: false`, nessun cache persistente tra sessioni, nessun `dedupingInterval` |
| 6 | **Nessun `loading.tsx`** | Route `(app)/*` | Spinner a pagina intera mentre 4+ fonti dati si caricano, nessuno streaming |
| 7 | **Font Geist_Mono caricato ma non usato** | `app/layout.tsx` riga 8 | ~100KB+ di font scaricato inutilmente |
| 8 | **recharts/chart.tsx non usato** | `components/ui/chart.tsx` | Componente mai importato da nessuna pagina (tree-shaked da Next.js, nessun impatto reale sul bundle) |

### Medi

| # | Problema | Dove | Impatto |
|---|---------|------|---------|
| 9 | **Nessun header Cache-Control** | Tutte le API GET routes | Browser non puo cachare nulla |
| 10 | **Nessun `<Suspense>` boundary** | Tutte le pagine | Nessun loading progressivo |
| 11 | **Production page carica 4 fonti dati** | `app/(app)/production/page.tsx` | Blocca il render finche TUTTE non completano |
| 12 | **Tutte le pagine sono 'use client'** | Tutte le page.tsx | Nessun server-component per caricamento iniziale dati |

---

## Sprint 1: Quick Wins (~30 minuti)

### 1.1 Rimuovere font Geist_Mono inutilizzato

**File**: `app/layout.tsx`

Attualmente (righe 1, 7-8):
```typescript
import { Geist, Geist_Mono } from 'next/font/google'
const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
```

**Azione**: Rimuovere import `Geist_Mono` e la variabile `_geistMono`.

**Perche**: Il font e caricato via `next/font/google` ma la variabile non e mai applicata al DOM (nessun `_geistMono.className` o `_geistMono.variable` su nessun elemento). Il CSS `--font-mono` in `globals.css` referenzia `'Geist Mono'` per nome, ma senza il font loader che inietta il `@font-face`, il browser ricade sui font di sistema (Menlo, Monaco, Courier New) che vanno benissimo per gli usi attuali (bakery ID, permission keys).

**Risparmio**: ~100KB+ di font download per ogni primo accesso.

---

### 1.2 Rimuovere `images: { unoptimized: true }`

**File**: `next.config.mjs`

Attualmente:
```javascript
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },  // ← rimuovere
  allowedDevOrigins: [...]
}
```

**Azione**: Rimuovere la riga `images: { unoptimized: true }`.

**Perche**: `next/image` non e attualmente usato nel progetto (solo `<img>` nativo via Radix Avatar), quindi questa configurazione non ha effetto. Rimuoverla prepara il terreno per un uso corretto futuro di `next/image` con ottimizzazione automatica (WebP, resize, lazy loading).

---

### 1.3 recharts — MANTENERE

Il componente `components/ui/chart.tsx` importa recharts ma non e importato da nessuna pagina. Next.js lo tree-shaka automaticamente, quindi **nessun impatto sul bundle reale**. Lo manteniamo per uso futuro (grafici nelle statistiche).

---

### 1.4 Aggiungere `loading.tsx`

**Creare**: `app/(app)/loading.tsx`

```typescript
import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  )
}
```

**Perche**: Durante la navigazione tra pagine (es. `/orders` → `/statistics`), Next.js deve scaricare il JS chunk della nuova pagina. Senza `loading.tsx`, l'utente vede la vecchia pagina bloccata. Con `loading.tsx`, lo spinner appare istantaneamente creando una transizione fluida.

---

### 1.5 Migliorare manifest.json

**File**: `public/manifest.json`

Modifiche:
```json
{
  "id": "/orders",
  "lang": "it",
  "categories": ["business", "productivity"],
  "name": "Panificio - Gestionale",
  "short_name": "Panificio",
  "description": "Gestionale per panificio - ordini, clienti, produzione",
  "start_url": "/orders",
  "display": "standalone",
  "background_color": "#f1f5f9",
  "theme_color": "#0f172a",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

**Cambiamenti**:
- `"id": "/orders"` — identita PWA stabile. Evita che il browser tratti una modifica di URL come una PWA diversa.
- `"lang": "it"` — lingua corretta.
- `"categories"` — migliora la classificazione negli store.
- Icone con purpose separati — `"any maskable"` combinato forza il browser a usare la stessa icona per entrambi i contesti, risultando in padding sbagliato. Separandoli, ogni contesto usa la versione appropriata.

---

## Sprint 2: Ottimizzazione API (2-3 ore)

### 2.1 Nuovo endpoint batch `/api/orders/range`

**Creare**: `app/api/orders/range/route.ts`

**Problema attuale**: La pagina statistiche chiama `getOrdersForDateRange(from, to)` in `lib/api.ts` (riga 158-165) che fa:
```typescript
const dates = datesInRange(from, to).slice(0, 90)
const results = await Promise.all(dates.map((d) => ordersApi.getForDate(d)))
```
Per "Ultimi 30 giorni" = 30 richieste HTTP, ognuna con 5 query DB = **150 query DB**.

**Soluzione**: Un singolo endpoint che accetta un range di date e fa **4 query DB totali**:

```
GET /api/orders/range?from=2026-05-01&to=2026-05-27
```

**Logica**:
1. Validare `from` e `to`, clamp a max 90 giorni
2. `db.select().from(customers).where(eq(customers.bakeryId, auth.bakeryId))` — tutti i clienti (1 query)
3. `db.select().from(recurringOrders).where(eq(recurringOrders.bakeryId, auth.bakeryId))` + join con `recurringOrderItems` — filtro weekday per ogni data in app (1-2 query)
4. `db.select().from(dailyOrders).where(and(eq(dailyOrders.bakeryId, auth.bakeryId), between(dailyOrders.date, from, to)))` + join con `dailyOrderItems` — tutti gli ordini giornalieri nel range (1 query)
5. `db.select().from(dailyItemStatus).where(and(eq(dailyItemStatus.bakeryId, auth.bakeryId), between(dailyItemStatus.date, from, to)))` — tutti gli status override (1 query)
6. Assemblare per-data i `ComputedDayOrder[]` in memoria

**Risultato**: 4 query DB invece di 150-450. Risposta in ~200ms invece di ~5-10s.

**File da modificare**:
- `lib/api.ts` — aggiungere `getOrdersForRange(from: string, to: string)` che chiama il nuovo endpoint
- `hooks/useData.ts` — `useStatistics` usa `getOrdersForRange` invece di `getOrdersForDateRange`

---

### 2.2 Parallelizzare query in `/api/orders/route.ts`

**File**: `app/api/orders/route.ts`

Attualmente le query sono tutte sequenziali (righe 24-153). Le prime 3 sono indipendenti:

```typescript
// PRIMA (sequenziale, ~150ms)
const allCustomers = await db.select(...)
const recurringRows = await db.select(...)
// ...poi condizionali...
const dailyRows = await db.select(...)

// DOPO (parallelo, ~50ms)
const [allCustomers, recurringRows, dailyRows] = await Promise.all([
  db.select(...).from(customers).where(eq(customers.bakeryId, auth.bakeryId)),
  db.select(...).from(recurringOrders).where(eq(recurringOrders.bakeryId, auth.bakeryId)),
  db.select(...).from(dailyOrders).where(and(eq(dailyOrders.bakeryId, auth.bakeryId), eq(dailyOrders.date, date))),
])

// Poi le query condizionali in parallelo:
if (activeRecurring.length > 0) {
  const [recItems, statusRows] = await Promise.all([
    db.select(...).from(recurringOrderItems)...,
    db.select(...).from(dailyItemStatus)...,
  ])
}

// Daily items (dipende da dailyRows):
if (dailyRows.length > 0) {
  const dailyItemsRows = await db.select(...).from(dailyOrderItems)...
}
```

**Risultato**: Da 5 query sequenziali (~150-250ms) a 2-3 step paralleli (~60-100ms). Miglioramento ~60% sulla latenza dell'endpoint piu usato.

---

### 2.3 Header Cache-Control sulle API

**File da creare/modificare**: `lib/api/handler.ts` — aggiungere helper

```typescript
export function jsonWithCache<T>(data: T, maxAge: number, swr: number = maxAge * 2) {
  const response = NextResponse.json(data)
  response.headers.set('Cache-Control', `private, max-age=${maxAge}, stale-while-revalidate=${swr}`)
  return response
}
```

**Applicare alle GET routes**:

| Route | maxAge | stale-while-revalidate | Rationale |
|-------|--------|----------------------|-----------|
| `api/bakery/route.ts` | 300s (5min) | 600s | Il nome del panificio non cambia quasi mai |
| `api/products/route.ts` | 60s | 120s | Prodotti cambiano raramente |
| `api/customers/route.ts` | 60s | 120s | Clienti cambiano raramente |
| `api/sections/route.ts` | 60s | 120s | Sezioni cambiano raramente |
| `api/production-groups/route.ts` | 60s | 120s | Gruppi cambiano raramente |
| `api/divisors/route.ts` | 60s | 120s | Divisori cambiano raramente |
| `api/orders/route.ts` | 0 (no-store) | — | Ordini cambiano frequentemente durante il giorno |
| `api/orders/range/route.ts` | 60s | 300s | Dati storici, stabili |
| `api/users/route.ts` | 0 (no-store) | — | Dati sensibili |

**Implementazione**: In ogni GET handler, sostituire `return NextResponse.json(data)` con `return jsonWithCache(data, 60)` (o il valore appropriato).

---

## Sprint 3: Ottimizzazione SWR (1-2 ore)

### 3.1 SWR Cache Provider persistente

**Creare**: `lib/swr-provider.tsx`

```typescript
'use client'

import { SWRConfig } from 'swr'
import type { ReactNode } from 'react'

const PERSIST_KEYS = ['products', 'customers', 'sections', 'production-groups', 'divisors', 'bakery']

function localStorageProvider() {
  const map = new Map<string, any>(
    JSON.parse(localStorage.getItem('swr-cache') || '[]')
  )

  window.addEventListener('beforeunload', () => {
    const entries = [...map.entries()].filter(([key]) =>
      PERSIST_KEYS.includes(typeof key === 'string' ? key : '')
    )
    localStorage.setItem('swr-cache', JSON.stringify(entries))
  })

  return map
}

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{
      provider: localStorageProvider,
      revalidateOnFocus: false,
      dedupingInterval: 10_000,
      keepPreviousData: true,
    }}>
      {children}
    </SWRConfig>
  )
}
```

**Perche**:
- **Persistenza localStorage**: I dati di riferimento (prodotti, clienti, sezioni) sopravvivono al refresh della pagina. Al prossimo accesso, l'app mostra i dati cached istantaneamente mentre SWR revalida in background.
- **`dedupingInterval: 10_000`**: Previene richieste duplicate nello stesso 10 secondi (es. navigando rapidamente tra pagine che usano gli stessi dati).
- **`keepPreviousData: true`**: Quando la chiave SWR cambia (es. cambio data), mostra i vecchi dati con sfondo sfocato invece di un loader vuoto.
- **NON persiste ordini**: Gli ordini diventano stale rapidamente e non devono essere serviti da cache vecchia.

**File da modificare**: `app/(app)/layout.tsx`

```typescript
'use client'

import { AuthProvider } from '@/hooks/useAuth'
import { SWRProvider } from '@/lib/swr-provider'
import { AppShell } from '@/components/layout/AppShell'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SWRProvider>
        <AppShell>{children}</AppShell>
      </SWRProvider>
    </AuthProvider>
  )
}
```

---

### 3.2 Configurazione per-hook

**File da modificare**: `hooks/useData.ts`

Rimuovere `{ revalidateOnFocus: false }` da tutti i singoli hook (ora gestito dalla config globale del SWRProvider) e aggiungere tuning specifico:

| Hook | `dedupingInterval` | `refreshInterval` | Note |
|------|-------------------|-------------------|------|
| `useProducts` | 30_000 (30s) | 0 (manuale) | Dati di riferimento, cambiano raramente |
| `useCustomers` | 30_000 | 0 | Dati di riferimento |
| `useSections` | 30_000 | 0 | Dati di riferimento |
| `useProductionGroups` | 30_000 | 0 | Dati di riferimento |
| `useDivisors` | 30_000 | 0 | Dati di riferimento |
| `useBakery` | 60_000 (1min) | 0 | Non cambia quasi mai |
| `useOrders` | 5_000 (5s) | 30_000 (30s auto-refresh) | Cambia spesso; auto-refresh garantisce che piu utenti vedano gli aggiornamenti reciproci |
| `useStatistics` | 60_000 | 0 | On-demand, endpoint costoso |
| `useUsers` | 30_000 | 0 | Dati admin |

**Esempio** per `useOrders`:
```typescript
export function useOrders(date: string) {
  const { data, error, isLoading, mutate } = useSWR<ComputedDayOrder[]>(
    date ? ['orders', date] : null,
    () => ordersApi.getForDate(date),
    {
      dedupingInterval: 5_000,
      refreshInterval: 30_000,
      keepPreviousData: true,
    }
  )
  // ...
}
```

L'`auto-refresh` a 30s e cruciale: in un panificio, piu persone (titolare + staff) lavorano sugli stessi ordini. Senza refresh automatico, un utente non vede i "fatto" segnati dall'altro finche non ricarica manualmente.

---

### 3.3 Prefetch dati critici al mount

**File da modificare**: `lib/swr-provider.tsx` oppure `app/(app)/layout.tsx`

Aggiungere prefetch con `preload()` di SWR:

```typescript
import { preload } from 'swr'
import { productsApi, customersApi, sectionsApi } from '@/lib/api'

// Chiamare nel SWRProvider o in un useEffect nel layout:
preload('products', () => productsApi.list())
preload('customers', () => customersApi.list())
preload('sections', () => sectionsApi.list())
```

**Perche**: Quando l'utente atterra su `/orders`, i dati prodotti/clienti/sezioni iniziano a caricarsi subito. Navigando poi su `/production` (che usa gli stessi dati), sono gia in cache SWR → rendering istantaneo.

---

## Sprint 4: Service Worker con Serwist (2-3 ore)

### 4.1 Installazione e configurazione

**Installare**:
```bash
pnpm add @serwist/next serwist
```

**Modificare**: `next.config.mjs`

```javascript
import withSerwist from '@serwist/next'

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  allowedDevOrigins: ['192.168.1.213', '192.168.1.213:3000', 'localhost', 'localhost:3000', '172.20.10.2:3000', '172.20.10.2'],
}

export default withSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  reloadOnOnline: true,
})(nextConfig)
```

- `cacheOnNavigation: true` — precache le pagine mentre l'utente naviga (la prima visita a `/statistics` la mette in cache per le visite successive)
- `reloadOnOnline: true` — ricarica la pagina quando torna online per ottenere dati freschi

---

### 4.2 Service Worker source

**Creare**: `app/sw.ts`

```typescript
import { defaultCache } from '@serwist/next/worker'
import { Serwist } from 'serwist'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Dati di riferimento — StaleWhileRevalidate (mostra cache, aggiorna in background)
    {
      urlPattern: /\/api\/(products|customers|sections|production-groups|divisors|bakery)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-reference-data',
        expiration: { maxEntries: 20, maxAgeSeconds: 24 * 60 * 60 }, // 24h
      },
    },
    // Ordini giornalieri — NetworkFirst (fresco quando possibile, cache come fallback)
    {
      urlPattern: /\/api\/orders\?date=/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-orders',
        expiration: { maxEntries: 30, maxAgeSeconds: 5 * 60 }, // 5min
        networkTimeoutSeconds: 3,
      },
    },
    // Ordini range (statistiche) — StaleWhileRevalidate
    {
      urlPattern: /\/api\/orders\/range/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-orders-range',
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 }, // 1h
      },
    },
    // Font Google — CacheFirst (immutabili)
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 }, // 1 anno
      },
    },
    // Icone e asset statici — CacheFirst
    {
      urlPattern: /\/icons\/.*\.png$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 }, // 30 giorni
      },
    },
    // Default per il resto
    ...defaultCache,
  ],
})

serwist.addEventListeners()
```

**Strategie spiegate**:

| Strategia | Quando | Comportamento |
|-----------|--------|--------------|
| **CacheFirst** | Asset statici (font, icone) | Serve dalla cache, non va mai in rete se ha gia il file. Perfetto per risorse immutabili. |
| **StaleWhileRevalidate** | Dati riferimento (prodotti, clienti) | Serve dalla cache istantaneamente, poi aggiorna in background. L'utente vede i dati vecchi per un attimo, poi quelli nuovi al prossimo render. |
| **NetworkFirst** | Ordini giornalieri | Va in rete prima. Se la rete fallisce o e lenta (>3s), serve dalla cache. Critico per dati che cambiano durante la giornata. |

---

### 4.3 Pagina offline

**Creare**: `app/~offline/page.tsx`

```typescript
export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Sei offline</h1>
        <p className="text-slate-500 text-sm mb-6">
          Controlla la connessione Wi-Fi e riprova. 
          Le pagine visitate di recente sono disponibili anche offline.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Riprova
        </button>
      </div>
    </div>
  )
}
```

Serwist serve automaticamente questa pagina quando una navigazione fallisce e la pagina richiesta non e in cache.

---

### 4.4 Background Sync per mutazioni

Aggiungere in `app/sw.ts`:

```typescript
import { BackgroundSyncQueue } from 'serwist'

const toggleQueue = new BackgroundSyncQueue('toggle-sync', {
  maxRetentionTime: 24 * 60, // 24 ore
})

// Intercetta le richieste di toggle che falliscono offline
serwist.registerRoute(
  /\/api\/orders\/toggle$/,
  async ({ request }) => {
    try {
      return await fetch(request.clone())
    } catch (error) {
      await toggleQueue.pushRequest({ request })
      return new Response(JSON.stringify({ queued: true }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
  'POST'
)
```

**Perche**: L'operazione piu frequente in produzione e segnare un prodotto come "fatto" (`POST /api/orders/toggle`). Se il WiFi cade per un attimo, la richiesta viene messa in coda e inviata automaticamente quando la connessione torna.

**Limiti**: NON facciamo background sync per la creazione ordini (`POST /api/orders/daily`) perche richiede generazione UUID e validazione server-side. Toggle e update sono operazioni idempotenti e sicure da riprovare.

---

## File riassunto

### Da creare
| File | Sprint | Scopo |
|------|--------|-------|
| `app/api/orders/range/route.ts` | 2 | Endpoint batch per statistiche |
| `app/(app)/loading.tsx` | 1 | Loading state per navigazione |
| `lib/swr-provider.tsx` | 3 | SWR cache provider persistente |
| `app/sw.ts` | 4 | Service worker Serwist |
| `app/~offline/page.tsx` | 4 | Pagina offline |

### Da modificare
| File | Sprint | Cosa cambia |
|------|--------|-------------|
| `app/layout.tsx` | 1 | Rimuovere Geist_Mono |
| `next.config.mjs` | 1+4 | Rimuovere `images: unoptimized`, aggiungere `withSerwist()` |
| `public/manifest.json` | 1 | Aggiungere `id`, `lang`, separare icon purposes |
| `app/api/orders/route.ts` | 2 | Parallelizzare query con `Promise.all` |
| `lib/api.ts` | 2 | Aggiungere `getOrdersForRange()` |
| `lib/api/handler.ts` | 2 | Aggiungere helper `jsonWithCache()` |
| `hooks/useData.ts` | 2+3 | Usare nuovo endpoint stats + SWR tuning per-hook |
| `app/(app)/layout.tsx` | 3 | Wrappare con `<SWRProvider>` |
| Tutte le GET API routes | 2 | Aggiungere Cache-Control headers |
| `package.json` | 4 | Aggiungere `@serwist/next` + `serwist` |

---

## Verifica end-to-end

1. **Build**: `pnpm build` deve completare senza errori
2. **Lighthouse PWA audit**: Punteggio PWA deve salire (attualmente fallisce per mancanza service worker)
3. **Network tab**: Verificare Cache-Control headers sulle risposte API
4. **Statistiche**: "Ultimi 30 giorni" deve fare **1 richiesta HTTP** invece di 30
5. **Offline test**: DevTools → Application → Service Worker → Offline → navigare tra pagine cached deve funzionare
6. **SWR cache**: Ricaricare la pagina, prodotti/clienti devono apparire istantaneamente da localStorage
7. **Navigazione**: Passare tra `/orders` e `/production`, verificare che `loading.tsx` appaia e la transizione sia fluida
8. **Background sync**: Mettere offline → segnare un prodotto come "fatto" → rimettere online → verificare che il toggle si sincronizzi

---

## Tradeoff e decisioni

| Decisione | Pro | Contro |
|-----------|-----|--------|
| localStorage per SWR cache (non IndexedDB) | Semplice, sincrono, zero dipendenze | Limite ~5MB. OK per questo volume dati (<100KB per entity type) |
| NetworkFirst per ordini (non StaleWhileRevalidate) | Staff vede sempre dati aggiornati quando online | Leggermente piu lento del cache-first (deve aspettare rete) |
| Background sync solo per toggle/update | Sicuro, idempotente | Creazione ordini offline non supportata |
| Auto-refresh ordini ogni 30s | Multi-utente consistente | Traffico rete costante (mitigato da dedupingInterval) |
| Mantenere recharts | Pronto per grafici futuri | ~250KB in node_modules (ma tree-shaked, zero impatto bundle) |
