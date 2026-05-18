# Real-time sync tra client (SSE + Postgres LISTEN/NOTIFY)

Documento di pianificazione, **non implementato**. Obiettivo: quando due (o più) utenti sono loggati da dispositivi diversi nella stessa panetteria, se uno fa una modifica gli altri la vedono entro ~100ms senza reload.

## Contesto

- Stack: Next.js (App Router) + Drizzle + Postgres + NextAuth + SWR-like hooks in `hooks/useData.ts`.
- Deployment previsto: **server locale** che esegue `next start` (non Vercel serverless). Questo è il fattore abilitante: le connessioni HTTP lunghe sono gratis e una connessione Postgres dedicata può restare aperta indefinitamente.
- Dati a bassa cardinalità (panetteria piccola): pochi client connessi, traffico esiguo.
- Già usiamo SWR con `mutate()` per invalidare cache lato client — è la chiave per integrare push senza riscrivere niente.

## Architettura

```
┌───────────┐   POST /api/orders/...      ┌──────────────┐
│  Client A │ ──────────────────────────► │   API Route  │
└───────────┘                             │  (mutation)  │
                                          └──────┬───────┘
                                                 │
                                       1. UPDATE su tabella
                                       2. NOTIFY 'bakery:{id}', payload
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │   Postgres   │
                                          └──────┬───────┘
                                                 │  pub/sub
                                                 ▼
┌───────────┐  GET /api/events (SSE)     ┌──────────────┐
│  Client B │ ◄────────────────────────  │  /api/events │  ◄── LISTEN 'bakery:{id}'
└───────────┘    stream eventi           │   handler    │
                                          └──────────────┘
                                                 │
                                          (1 connessione PG
                                           dedicata, persistente)
```

Il server applica la mutation e poi emette `NOTIFY`. Una sola connessione Postgres a livello processo è in `LISTEN` su un canale per bakery e ri-emette gli eventi a tutti i client SSE iscritti.

## Componenti da creare

### 1. Hub broadcaster (singleton lato server)
`lib/realtime/hub.ts`

- Mantiene **un'unica** connessione Postgres in `LISTEN` (la libreria `postgres` supporta `sql.listen(channel, cb)`).
- Tiene un `Map<bakeryId, Set<{ controller: ReadableStreamDefaultController }>>` per fan-out.
- Espone: `subscribe(bakeryId, controller)` / `unsubscribe(...)` / il listener PG che spinge a tutti i controller del bakery.

Nota: in dev, Next.js fa HMR e potrebbe creare più istanze del modulo. Usare `globalThis.__realtimeHub ??= createHub()` per garantire singleton.

### 2. Route SSE
`app/api/events/route.ts`

- `GET` handler che ritorna un `Response` con `ReadableStream`.
- Verifica sessione (riusa `auth()` da `auth.ts`), estrae `bakeryId` dal token.
- Si registra all'hub, scrive `data: ...\n\n` per ogni evento ricevuto.
- Gestisce close: deregistra dall'hub quando il client si disconnette (cancel del stream).
- Heartbeat ogni ~25s (un `: ping\n\n`) per evitare timeout di proxy.
- Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`.

### 3. Helper `notify()` per le mutation
`lib/realtime/notify.ts`

```ts
export async function notify(bakeryId: string, event: {
  type: 'orders.updated' | 'customers.updated' | 'products.updated' | ...,
  entityId?: string,
  date?: string,         // per orders: ricarica solo quella data
}): Promise<void>
```

- Esegue `sql\`NOTIFY \${sql.identifier(\`bakery:\${bakeryId}\`)}, \${JSON.stringify(event)}\``.
- Channel name: una sola NOTIFY per bakery → meno canali da gestire. Il tipo evento è nel payload.
- **Importante**: chiamare `notify()` **dopo** che la transazione è committata, altrimenti i client invalidano la cache e rileggono lo stato vecchio. Se si usano transazioni Drizzle, chiamare `notify` fuori dal blocco transazionale.

### 4. Hook client
`hooks/useRealtimeSync.ts`

- Apre `new EventSource('/api/events')` al mount.
- Per ogni evento ricevuto, chiama la `mutate` SWR appropriata: es. `mutate(['/api/orders', date])` per `orders.updated`.
- Auto-reconnect: `EventSource` lo fa nativo, ma loggare ed eventualmente backoff in caso di errori ripetuti.
- Cleanup su unmount.
- Da montare una volta sola in `AppShell` (sopra il children) così è attivo in tutte le pagine autenticate.

### 5. Cablaggio nelle API route esistenti
Per ogni mutation in `app/api/.../route.ts` aggiungere una chiamata a `notify()` dopo il commit. Tipica lista da coprire (verificare in `app/api/`):

- `app/api/orders/...` → `orders.updated` (passando `date`)
- `app/api/customers/...` → `customers.updated`
- `app/api/products/...` → `products.updated`
- `app/api/sections/...` → `products.updated` (cambio sezione invalida prodotti)
- `app/api/production-groups/...` → `production-groups.updated`
- `app/api/bakery/...` → `bakery.updated`
- `app/api/users/...` → `users.updated`
- `app/api/permissions/...` → `permissions.updated`

## Mappatura eventi → SWR keys

| Evento                     | SWR key da invalidare                          |
|----------------------------|------------------------------------------------|
| `orders.updated` (date)    | `['/api/orders', date]`                        |
| `customers.updated`        | `'/api/customers'`                             |
| `products.updated`         | `'/api/products'` + `'/api/sections'`          |
| `production-groups.updated`| `'/api/production-groups'`                     |
| `bakery.updated`           | `'/api/bakery'`                                |
| `users.updated`            | `'/api/users'`                                 |
| `permissions.updated`      | `'/api/permissions'` + invalida sessione locale|

(Verificare le chiavi reali leggendo `hooks/useData.ts` prima di implementare.)

## Sicurezza / multi-tenancy

- **Isolamento bakery**: `bakeryId` arriva sempre dalla sessione server, mai dal client. Il canale `bakery:{id}` esiste per non spedire eventi di una panetteria ai client di un'altra.
- **Privacy del payload**: includere solo `{ type, entityId?, date? }`. Niente dati sensibili — il client farà la fetch via API che già verifica i permessi. Così l'evento è un semplice "trigger di refetch".
- **No PII in NOTIFY**: anche se NOTIFY è interno al DB, mantenere il payload minimale evita leak in log e semplifica gli audit.

## Gestione edge case

- **Riconnessione client**: `EventSource` riconnette in automatico; al riconnect i dati sono comunque coerenti perché SWR rivalida al focus/reconnect. Nessuna logica di "missed events" necessaria a questa scala.
- **Self-echo**: il client che fa la mutation riceverà anche il suo stesso evento → SWR farà una revalidate extra. Costo trascurabile, evita di gestire `originator IDs`. Se servisse ottimizzare: includere un `originId` (UUID per tab) nel header della POST + nel payload NOTIFY, ignorare gli eventi con `originId` proprio lato client.
- **Backpressure**: se un client è lento, il `controller.enqueue` può accumulare. Per panetteria con 2-5 client connessi non è un problema; se mai serve, mettere un cap (es. drop se > 100 eventi pending).
- **Postgres NOTIFY size limit**: payload max 8KB di default. Mantenendo solo `{type, entityId, date}` siamo molto sotto.
- **Errore connessione PG dell'hub**: se la connessione `LISTEN` cade, l'hub deve riconnettersi e fare di nuovo `LISTEN`. Loggare ogni perdita. I client non se ne accorgono (SSE resta aperto, ma non riceve nulla per il periodo del down).
- **Sessione scaduta**: la route SSE controlla `auth()`. Se la sessione scade durante la connessione, chiudere lo stream con un evento `{type:'auth.expired'}` → il client può rifare login.

## Note specifiche per Next.js

- App Router Route Handlers supportano nativamente `ReadableStream` come response body — non serve `next-connect` o altro.
- **Runtime**: forzare `export const runtime = 'nodejs'` nella route SSE (non Edge): la libreria `postgres` richiede Node.js APIs.
- **`dynamic = 'force-dynamic'`** per evitare caching della route SSE.
- **Standalone build**: se in futuro si fa `output: 'standalone'`, verificare che la connessione PG persistente sopravviva. Su `next start` non ci sono problemi.

## Test plan

1. Manuale: due browser/dispositivi sulla stessa panetteria, stessa data ordini. Spunto un item dal device A → device B vede lo spunto entro 1s. Stesso test per modifica nome cliente, aggiunta prodotto, override permesso.
2. Resilienza: spegnere wifi sul client per 30s → al ritorno vede stato attuale (auto-revalidate SWR + EventSource reconnect).
3. Restart server: chiudere `next start` mentre i client sono connessi → al restart i client riconnettono automaticamente.
4. Load (irrilevante per la scala, ma per dormire tranquilli): 10 client connessi, 50 update/min → CPU/RAM stabili.

## Effort stimato

- Hub + route SSE + hook client: ~3-4 ore di lavoro pulito.
- Cablare `notify()` in tutte le mutation: ~1-2 ore (dipende da quante route ci sono in `app/api/`).
- Test manuale e tuning: ~1 ora.

**Totale**: mezza-giornata abbondante per la prima implementazione end-to-end.

## Quando implementare

Fare il porting **dopo** aver verificato in produzione locale che il problema della "stale view" sia realmente percepito dagli utenti. Se nel reale si fanno modifiche raramente in contemporanea, potrebbe bastare un polling SWR a 5s (zero codice nuovo, basta `refreshInterval` negli hook).

Soglia di passaggio: se due utenti collidono percepibilmente più di un paio di volte alla settimana, vale la pena attivare SSE.

## Riferimenti

- `postgres` npm package: API `sql.listen(channel, callback)` — https://github.com/porsager/postgres#listen--notify
- Postgres docs `LISTEN` / `NOTIFY`: https://www.postgresql.org/docs/current/sql-listen.html
- MDN `EventSource`: https://developer.mozilla.org/en-US/docs/Web/API/EventSource
- SWR `mutate`: https://swr.vercel.app/docs/mutation
