# Piano di Implementazione Real-Time Sync (SSE + Postgres LISTEN/NOTIFY)

> Analisi completata il 27/05/2026. Da implementare in 3 sprint.

## Contesto

La PWA "Panificio - Gestionale" e un'app Next.js 16 (App Router, React 19) usata da piu persone contemporaneamente (titolare + staff) sullo stesso panificio. Attualmente, quando un utente fa una modifica (es. segna un prodotto come "fatto"), gli altri utenti **non la vedono** finche non ricaricano la pagina manualmente. L'obiettivo e che ogni modifica si propaghi a tutti i client connessi entro ~100ms, senza reload.

**Stack**: Next.js 16, Drizzle ORM + Postgres, SWR, Zustand, NextAuth v5, Tailwind CSS v4, Radix UI.

**Deploy**: server locale con `next start`, esposto tramite **Cloudflare Tunnel**. Le connessioni HTTP long-lived (SSE) sono supportate sia dal server Node.js sia dal tunnel Cloudflare. Il heartbeat ogni 25s mantiene la connessione viva entro il timeout idle di Cloudflare (~100s).

---

## Architettura

```
┌───────────┐   POST /api/orders/...      ┌──────────────┐
│  Client A │ ──────────────────────────► │   API Route  │
└───────────┘                             │  (mutation)  │
                                          └──────┬───────┘
                                                 │
                                       1. UPDATE su tabella
                                       2. notify() → pg_notify()
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │   Postgres   │
                                          └──────┬───────┘
                                                 │  LISTEN/NOTIFY
                                                 ▼
┌───────────┐  GET /api/events (SSE)     ┌──────────────┐
│  Client B │ ◄────────────────────────  │  Hub singleton│  ◄── sql.listen('bakery:{id}')
└───────────┘    data: {type, date}      │  (fan-out)    │
      │                                   └──────────────┘
      ▼
  mutate() SWR → refetch dati aggiornati
```

Il flusso e semplice: il server applica la mutation, poi emette `pg_notify()`. Un hub singleton con una connessione Postgres dedicata e in `LISTEN` sul canale del panificio e ri-emette gli eventi come SSE a tutti i client connessi. Ogni client riceve l'evento e chiama `mutate()` di SWR per rileggere i dati aggiornati.

---

## Problemi Risolti

| # | Problema | Dove | Impatto |
|---|---------|------|---------|
| 1 | **Nessun sync multi-utente** | Intero progetto | Staff e titolare vedono dati stale, devono ricaricare manualmente |
| 2 | **Ordini "fatto" non visibili** | `app/(app)/orders/` | Utente A segna un prodotto come fatto, utente B non lo vede |
| 3 | **Modifiche prodotti/clienti invisibili** | `app/(app)/manage/` | Admin aggiunge un prodotto, staff non lo vede finche non ricarica |
| 4 | **Nessun meccanismo di push** | `hooks/useData.ts` | Solo `mutate()` locale dopo la propria mutation, zero notifiche da altri utenti |

---

## Sprint 1: Infrastruttura Server (~2 ore)

### 1.1 Esporre il client raw Postgres

**File**: `lib/db/client.ts`

Attualmente il client `postgres` e interno al modulo — solo il wrapper Drizzle `db` e esportato. Serve esporre il client raw per usare `sql.listen()` e `sql.notify()`.

**Azione**: Aggiungere una riga:
```typescript
export const sql = client
```

**Perche**: `sql.listen(channel, callback)` e `sql.notify(channel, payload)` sono metodi della libreria `postgres` v3, non disponibili tramite Drizzle ORM.

---

### 1.2 Creare l'helper `notify()`

**Creare**: `lib/realtime/notify.ts`

```typescript
import { sql } from '@/lib/db/client'

export type RealtimeEventType =
  | 'orders.updated'
  | 'customers.updated'
  | 'products.updated'
  | 'production-groups.updated'
  | 'bakery.updated'
  | 'users.updated'
  | 'permissions.updated'
  | 'divisors.updated'

interface RealtimeEvent {
  type: RealtimeEventType
  entityId?: string
  date?: string
}

export async function notify(bakeryId: string, event: RealtimeEvent): Promise<void> {
  const channel = `bakery:${bakeryId}`
  await sql.notify(channel, JSON.stringify(event))
}
```

**Perche**: Ogni API route che fa una mutation chiamera `notify()` dopo il commit. Il payload e minimale (`{type, date?}`) — nessun dato sensibile. Il client usera il `type` per decidere quale cache SWR invalidare.

**Dettagli tecnici**:
- `sql.notify()` esegue `SELECT pg_notify($1, $2)` sulla connessione pool standard (non la connessione LISTEN)
- Payload max Postgres: 8KB — il nostro JSON e ~50 byte, ampiamente sotto il limite
- Canale `bakery:{id}` per isolamento multi-tenant

---

### 1.3 Creare l'hub broadcaster (singleton)

**Creare**: `lib/realtime/hub.ts`

Responsabilita:
1. Mantiene **una** connessione Postgres in `LISTEN` per canale bakery (la libreria `postgres` v3 gestisce internamente una connessione `max: 1` dedicata per `.listen()`)
2. Tiene un `Map<bakeryId, Set<ReadableStreamDefaultController>>` per fan-out ai client SSE
3. Quando arriva un NOTIFY, fa `controller.enqueue()` su tutti i client del bakery

**Pattern singleton** (per sopravvivere a HMR in dev):
```typescript
const globalForHub = globalThis as unknown as { __realtimeHub?: Hub }
const hub = globalForHub.__realtimeHub ??= createHub()
if (process.env.NODE_ENV !== 'production') globalForHub.__realtimeHub = hub
```

**Comportamento**:

| Metodo | Quando | Cosa fa |
|--------|--------|---------|
| `subscribe(bakeryId, controller)` | Nuovo client SSE si connette | Aggiunge il controller al Set. Se e il primo per quel bakery, chiama `sql.listen('bakery:{id}', cb)` |
| `unsubscribe(bakeryId, controller)` | Client SSE si disconnette | Rimuove il controller. Se il Set e vuoto, chiama `unlisten()` per rilasciare il canale PG |
| `fanOut(bakeryId, payload)` | Arriva un NOTIFY da Postgres | Per ogni controller del bakery, fa `controller.enqueue(encoder.encode('data: ...\n\n'))` |

**Gestione errori nel fan-out**: Se `controller.enqueue()` lancia (stream chiuso), il client viene rimosso silenziosamente dal Set.

---

### 1.4 Creare l'endpoint SSE

**Creare**: `app/api/events/route.ts`

```typescript
export const runtime = 'nodejs'   // postgres richiede Node.js APIs
export const dynamic = 'force-dynamic'  // niente caching
```

**GET handler**:
1. Verificare la sessione con `auth()` (NextAuth v5). Se assente o senza `bakeryId`, ritornare 401
2. Creare un `ReadableStream` con `start(controller)` e `cancel()` callback
3. In `start`: registrare il controller nell'hub, inviare `: connected\n\n` come conferma
4. Heartbeat ogni 25s: `controller.enqueue(encoder.encode(': ping\n\n'))`
5. In `cancel`: deregistrare dall'hub, clearare l'interval del heartbeat
6. Ritornare `new Response(stream, { headers })` con:

| Header | Valore | Perche |
|--------|--------|--------|
| `Content-Type` | `text/event-stream` | Standard SSE |
| `Cache-Control` | `no-cache, no-transform` | Niente buffering/caching |
| `Connection` | `keep-alive` | Connessione persistente |
| `X-Accel-Buffering` | `no` | Disabilita buffering nginx (se presente) |

**Perche heartbeat 25s**: Il timeout idle di Cloudflare e ~100s. Inviando un ping ogni 25s, la connessione resta attiva anche attraverso il tunnel. Il ping e un commento SSE (`: ping`), ignorato da `EventSource` ma sufficiente a mantenere vivo il TCP.

---

## Sprint 2: Client-Side (~1 ora)

### 2.1 Creare l'hook `useRealtimeSync`

**Creare**: `hooks/useRealtimeSync.ts`

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { mutate } from 'swr'
```

**Mappatura eventi → chiavi SWR** (verificata su `hooks/useData.ts`):

| Evento SSE | SWR key da invalidare | Note |
|---|---|---|
| `orders.updated` + `date` | `['orders', date]` | Solo la data specificata |
| `orders.updated` senza `date` | tutti i `['orders', *]` | Recurring order cambiato, invalida tutte le date caricate |
| `customers.updated` | `'customers'` | |
| `products.updated` | `'products'` + `'sections'` | Prodotti e sezioni sono collegati |
| `production-groups.updated` | `'production-groups'` | |
| `bakery.updated` | `'bakery'` | |
| `users.updated` | `'users'` | |
| `permissions.updated` | `'users'` | Permessi invalidano la lista utenti |
| `divisors.updated` | `'divisors'` | |

**ATTENZIONE**: Le chiavi SWR reali sono stringhe semplici (`'products'`, `'customers'`, ecc.), **NON** con prefisso `/api/`. Verificato in `hooks/useData.ts` righe 129, 159, 189, 251, 284, 303, 348, 379.

**Reconnect con backoff esponenziale**:
- `EventSource` ha auto-reconnect nativo, ma senza backoff configurabile
- Usiamo reconnect manuale: 1s, 2s, 4s, 8s... max 30s
- Al successo (`onopen`), reset del contatore

**Per `orders.updated` senza `date`** (modifica ordine ricorrente):
```typescript
// Invalida tutte le chiavi SWR che iniziano con 'orders'
mutate(
  (key: unknown) => Array.isArray(key) && key[0] === 'orders',
  undefined,
  { revalidate: true }
)
```
Usa l'API filter di SWR v2 per invalidare tutti gli ordini caricati, indipendentemente dalla data.

---

### 2.2 Montare l'hook in AppShell

**File**: `components/layout/AppShell.tsx`

```typescript
import { useRealtimeSync } from '@/hooks/useRealtimeSync'

export function AppShell({ children }: AppShellProps) {
  useRealtimeSync()
  return (
    <div className="min-h-screen bg-slate-100">
      <TopNav />
      <main className="max-w-7xl mx-auto px-3 py-4 md:px-4 md:py-6">
        {children}
      </main>
    </div>
  )
}
```

**Perche qui**: `AppShell` e renderizzato dentro `AuthProvider` (vedi `app/(app)/layout.tsx`), quindi la sessione cookie e disponibile quando `EventSource` si connette. L'hook gira una sola volta per sessione autenticata — una connessione SSE per tab.

---

## Sprint 3: Cablare `notify()` nelle API routes (~1.5 ore)

### 3.1 Pattern di integrazione

Per ogni API route con mutation (POST, PATCH, PUT, DELETE), aggiungere:
1. `import { notify } from '@/lib/realtime/notify'` in testa al file
2. `await notify(auth.bakeryId, { type: '...' })` **dopo** il commit DB e **prima** del `return`

**Regola critica**: `notify()` va chiamata **dopo** che la transazione e committata. Se chiamata dentro un blocco `db.transaction()`, i client invaliderebbero la cache e rileggerebbero lo stato vecchio (la transazione non e ancora visibile).

**Esempio** per `app/api/products/route.ts` (POST):
```typescript
// PRIMA
const [created] = await db.insert(products).values({...}).returning({...})
return NextResponse.json({ ...created, section: body.section }, { status: 201 })

// DOPO
const [created] = await db.insert(products).values({...}).returning({...})
await notify(auth.bakeryId, { type: 'products.updated' })
return NextResponse.json({ ...created, section: body.section }, { status: 201 })
```

---

### 3.2 Tabella completa delle route da modificare

| Route | Metodo | Evento | Payload extra |
|-------|--------|--------|---------------|
| `api/products/route.ts` | POST | `products.updated` | — |
| `api/products/[id]/route.ts` | PATCH, DELETE | `products.updated` | — |
| `api/customers/route.ts` | POST | `customers.updated` | — |
| `api/customers/[id]/route.ts` | PATCH, DELETE | `customers.updated` | — |
| `api/orders/daily/route.ts` | POST | `orders.updated` | `date` |
| `api/orders/toggle/route.ts` | POST | `orders.updated` | `date` |
| `api/orders/items/route.ts` | POST, PATCH | `orders.updated` | `date` |
| `api/orders/recurring/[customerId]/route.ts` | PUT | `orders.updated` | — (senza date) |
| `api/sections/route.ts` | POST | `products.updated` | — |
| `api/sections/[id]/route.ts` | PATCH, DELETE | `products.updated` | — |
| `api/sections/reorder/route.ts` | POST | `products.updated` | — |
| `api/production-groups/route.ts` | POST | `production-groups.updated` | — |
| `api/production-groups/[id]/route.ts` | PATCH, DELETE | `production-groups.updated` | — |
| `api/production-groups/reorder/route.ts` | POST | `production-groups.updated` | — |
| `api/bakery/route.ts` | PATCH | `bakery.updated` | — |
| `api/users/route.ts` | POST | `users.updated` | — |
| `api/users/[id]/route.ts` | PATCH, DELETE | `users.updated` | — |
| `api/permissions/role/route.ts` | POST | `permissions.updated` | — |
| `api/permissions/user/[userId]/route.ts` | POST | `permissions.updated` | — |
| `api/divisors/[productId]/route.ts` | PATCH | `divisors.updated` | — |

**Note sulle sezioni**: Le mutation su `sections/*` emettono `products.updated` perche i prodotti sono joinati con le sezioni — una modifica di sezione invalida la vista prodotti.

**Note su ordini toggle/items**: Queste route hanno **piu punti di uscita** (es. daily order update vs dailyItemStatus upsert). Ogni `return` di successo deve avere il proprio `await notify()`.

---

## File riassunto

### Da creare

| File | Sprint | Scopo |
|------|--------|-------|
| `lib/realtime/notify.ts` | 1 | Helper per emettere `pg_notify()` dopo le mutation |
| `lib/realtime/hub.ts` | 1 | Hub singleton: LISTEN Postgres → fan-out SSE |
| `app/api/events/route.ts` | 1 | Endpoint SSE per stream eventi ai client |
| `hooks/useRealtimeSync.ts` | 2 | Hook client: EventSource → `mutate()` SWR |

### Da modificare

| File | Sprint | Cosa cambia |
|------|--------|-------------|
| `lib/db/client.ts` | 1 | Aggiungere `export const sql = client` (1 riga) |
| `components/layout/AppShell.tsx` | 2 | Aggiungere `useRealtimeSync()` (2 righe) |
| 18 API route files | 3 | Aggiungere `import` + `await notify(...)` dopo ogni mutation |

---

## Compatibilita Cloudflare Tunnel

L'architettura SSE funziona **senza modifiche** attraverso Cloudflare Tunnel:

| Aspetto | Dettaglio |
|---------|-----------|
| **LISTEN/NOTIFY** | Gira interamente in locale (server + DB sulla stessa macchina). Il tunnel non e coinvolto |
| **SSE attraverso il tunnel** | Cloudflare Tunnel supporta connessioni HTTP long-lived. `Content-Type: text/event-stream` e riconosciuto e non bufferizzato |
| **Timeout idle** | Cloudflare ha un timeout idle di ~100s. Il heartbeat ogni 25s lo previene |
| **Headers anti-buffering** | `Cache-Control: no-cache, no-transform` + `X-Accel-Buffering: no` disabilitano qualsiasi caching/buffering intermedio |
| **Fallback** | Se SSE dovesse avere problemi attraverso il tunnel (improbabile), l'alternativa e WebSocket (anch'esso supportato da Cloudflare Tunnel). Ma SSE e piu semplice e dovrebbe bastare |

---

## Gestione edge case

| Scenario | Comportamento | Azione richiesta |
|----------|--------------|-----------------|
| **Self-echo** | Il client che fa la mutation riceve anche il proprio evento SSE | Nessuna — SWR fara una revalidate extra, costo trascurabile. La prima `mutate()` locale ha gia aggiornato la UI |
| **Riconnessione client** | EventSource riconnette con backoff esponenziale (1s→30s) | Nessuna — al riconnect SWR rivalida i dati automaticamente |
| **WiFi off/on** | SSE si disconnette e riconnette | Nessuna — i dati sono comunque coerenti grazie a SWR revalidation |
| **Restart server** | Tutte le connessioni SSE cadono | I client riconnettono automaticamente in 1-30s |
| **Sessione scaduta** | La route SSE ritorna 401 al prossimo tentativo di connessione | EventSource smette di riconnettere dopo errori auth |
| **Connessione PG LISTEN cade** | La libreria `postgres` v3 riconnette e ri-fa LISTEN automaticamente | Nessuna — built-in nella libreria |
| **NOTIFY prima del commit** | Client legge dati vecchi | Prevenuto: `notify()` va chiamata fuori dal blocco `db.transaction()` |

---

## Sicurezza / multi-tenancy

- **Isolamento bakery**: Il `bakeryId` viene dalla sessione server (JWT), mai dal client. Il canale `bakery:{id}` garantisce che un panificio non riceva eventi di un altro
- **Privacy del payload**: Solo `{type, entityId?, date?}` — nessun dato sensibile nel NOTIFY. Il client fara la fetch via API che verifica i permessi
- **No PII in NOTIFY**: Anche se NOTIFY e interno al DB, il payload minimale evita leak in log

---

## Verifica end-to-end

1. **Sync ordini**: Due browser sulla stessa panetteria, stessa data. Spuntare un item dal device A → device B lo vede entro 1-2s
2. **Sync prodotti**: Aggiungere un prodotto da browser A → appare su browser B senza reload
3. **Sync clienti**: Modificare nome cliente da A → aggiornato su B
4. **Reconnect**: Spegnere wifi su un client per 30s → al ritorno vede stato attuale
5. **Restart server**: `Ctrl+C` su `next start` → riavviare → i client riconnettono automaticamente
6. **Cloudflare Tunnel**: Verificare che SSE funzioni con due dispositivi che accedono via tunnel (non localhost)
7. **Type-check**: `npx tsc --noEmit` deve passare senza errori
8. **Network tab**: Verificare che la connessione `/api/events` resti aperta e riceva i ping ogni 25s

---

## Tradeoff e decisioni

| Decisione | Pro | Contro |
|-----------|-----|--------|
| SSE invece di WebSocket | Piu semplice (HTTP standard, auto-reconnect nativo, niente librerie extra) | Unidirezionale (server→client), ma basta per il nostro caso |
| Postgres LISTEN/NOTIFY invece di Redis pub/sub | Zero dipendenze extra, gia abbiamo Postgres | Non scala a migliaia di client (irrilevante: 2-5 utenti per panificio) |
| `notify()` manuale in ogni route (non automatica in `withAuth`) | Tipo evento e payload precisi per ogni mutation | Una riga in piu per route (~20 righe totali) |
| Self-echo ignorato (niente `originId`) | Zero complessita aggiuntiva | Una revalidate SWR extra per chi fa la mutation (costo ~0) |
| Heartbeat 25s | Mantiene vivo SSE attraverso Cloudflare Tunnel | Traffico minimo (~40 byte ogni 25s per client) |
| Backoff esponenziale client (1s→30s) | Evita flood sul server in caso di problemi | Delay fino a 30s nel worst case di reconnect |

---

## Effort stimato

| Sprint | Tempo | Contenuto |
|--------|-------|-----------|
| Sprint 1 | ~2 ore | Hub + notify helper + endpoint SSE + export sql |
| Sprint 2 | ~1 ora | Hook client + montaggio in AppShell |
| Sprint 3 | ~1.5 ore | Cablare `notify()` in tutte le 18 route + test manuale |
| **Totale** | **~4.5 ore** | Mezza giornata abbondante |
