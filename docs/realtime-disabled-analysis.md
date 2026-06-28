# Analisi: criticità di tenere il realtime DISATTIVATO

> Scenario: impostare `NEXT_PUBLIC_REALTIME_DISABLED=1` (o avere il realtime di fatto rotto).
> Contesto reale: **un panificio, più utenti** (titolare + staff) su **più dispositivi** (PC, tablet, telefono) che usano l'app **in contemporanea** durante la preparazione degli ordini.
>
> ⚠️ Analisi tecnica, non consulenza. Bozza basata sul codice attuale.

---

## Stato implementazione (fix applicati)

| Fix | File | Stato |
|---|---|---|
| A — `notify()` best-effort (try/catch) | `lib/realtime/notify.ts` | ✅ applicato |
| B1/B3 — salvataggio cliente+ricetta → invalida `orders`/`statistics` | `components/manage/CustomerEditDialog.tsx` + `hooks/useData.ts` (`useCustomers`) | ✅ applicato |
| B2 — sospendi/riattiva cliente → invalida `orders` | `hooks/useData.ts` (`useCustomers.update/remove`) | ✅ applicato |
| B4 — rinomina/elimina sezione → invalida `products` | `hooks/useData.ts` (`useSections`) | ✅ applicato |
| B5 — modifiche ordine → invalida `statistics` | `hooks/useData.ts` (`useOrders`) | ✅ applicato |

> Type-check: nessun errore introdotto. Richiede **rebuild/redeploy** per avere effetto (su Vercel il fix A è quello che ferma gli errori al salvataggio).

---

## 0. Conclusione operativa (TL;DR per ambiente)

| Ambiente | Realtime | Cosa fare |
|---|---|---|
| **Vercel (oggi, branch `main` = Production)** | ❌ NON può funzionare (serverless) | `NEXT_PUBLIC_REALTIME_DISABLED=1` (già impostato) + **rebuild** |
| **Locale + Postgres + Cloudflare Tunnel (target finale)** | ✅ Funziona (è lo scenario per cui è progettato) | rimuovere il flag + rebuild + `next start` |

**Due punti critici da non dimenticare in entrambi gli ambienti:**

1. **Il flag spegne solo il CLIENT, non `notify()`.** `NEXT_PUBLIC_REALTIME_DISABLED=1` disattiva solo l'EventSource lato browser (`useRealtimeSync`). Il **server chiama `notify()` a ogni salvataggio comunque** — quella chiamata **non è gated dal flag**. Se `notify()` lancia (es. su serverless con connessioni esaurite), torna **500 "errore al salvataggio"** anche col flag a 1. → Rendere **`notify()` best-effort (try/catch) è il fix che chiude il problema in entrambi gli ambienti**.
2. **Il realtime non deve essere l'unico meccanismo di correttezza.** Va affiancato dall'invalidazione locale dopo le mutazioni derivate (vedi §4 e §6).

---

## 1. A cosa serve il realtime (in una riga)

Quando un utente salva qualcosa, il server manda un "ping" (Postgres NOTIFY → SSE `/api/events`) a **tutti gli altri dispositivi** dello stesso panificio, e questi **ributtano la foto** (rivalidano la cache SWR) mostrando subito il dato aggiornato. Senza realtime, ogni dispositivo resta sulla **sua** copia finché non la ricarica da solo.

---

## 2. Cosa NON aggiorna più, e ogni quanto (il cuore del problema)

Senza realtime, una schermata si aggiorna **solo** in 3 modi: (a) l'azione la fa quel dispositivo stesso (`mutate()` locale), (b) c'è un `refreshInterval`, (c) si ricarica/rinaviga. La config attuale (`lib/swr-provider.tsx`, `hooks/useData.ts`) è:

- **`revalidateOnFocus: false`** a livello globale → tornare sull'app/tab **NON** rinfresca nulla.
- **Solo `useOrders(date)` ha `refreshInterval: 30s`.** Tutto il resto **non si auto-aggiorna mai**.

| Dato | Auto-refresh senza realtime? | Quanto resta stale su un ALTRO dispositivo |
|---|---|---|
| **Ordini del giorno** (`orders`) | ✅ ogni 30s | fino a ~30s |
| **Prodotti** | ❌ mai | finché non ricarichi l'app |
| **Clienti** | ❌ mai | finché non ricarichi l'app |
| **Sezioni** | ❌ mai | finché non ricarichi l'app |
| **Gruppi produzione** | ❌ mai | finché non ricarichi l'app |
| **Divisori** (totali/produzione) | ❌ mai | finché non ricarichi l'app |
| **Dati panificio** | ❌ mai | finché non ricarichi l'app |
| **Utenti / permessi** | ❌ mai | finché non ricarichi l'app |

→ **Il punto critico non sono gli ordini (si salvano da soli ogni 30s), ma i dati di riferimento**: prodotti, clienti, divisori, sezioni, gruppi. Su un secondo dispositivo restano **vecchi a tempo indeterminato**.

---

## 3. Severità per QUESTO panificio

Siccome qui ci sono **più persone su più dispositivi insieme**, l'impatto è **medio-alto**. Non è un'app a utente singolo, dove il realtime sarebbe quasi superfluo.

### Scenari concreti (realistici)

1. **Titolare aggiunge/rinomina un prodotto sul PC.** Lo staff sul tablet **non lo vede** finché non ricarica → potrebbe non riuscire a inserirlo in un ordine, o vedere il nome vecchio. (gravità: media)
2. **Titolare corregge la "ricetta" di un cliente fisso** (Articoli fissi). Sugli altri dispositivi la schermata Ordine continua a mostrare le **quantità vecchie** → la produzione può sfornare le quantità sbagliate. *(È esattamente il bug osservato: bananine 20 kg invece di 0,5.)* (gravità: **alta** — errore di produzione)
3. **Cambio divisori.** I Totali/Produzione su un altro dispositivo calcolano con i divisori vecchi → numeri di impasto sbagliati. (gravità: alta)
4. **Modifica permessi/ruolo di un utente.** Non basta ricaricare: il permesso è "congelato" nel JWT → serve **logout/login** (questo vale anche CON realtime — vedi §5). (gravità: bassa/gestibile)
5. **Due persone sullo stesso ordine.** A spunta "fatto", B non lo vede per ~30s → rischio di preparare due volte o saltare un articolo. Mitigato dai 30s, non eliminato. (gravità: media)

### Severità sintetica
- **Uso a dispositivo singolo, una persona alla volta:** impatto **basso** (vedi sempre i tuoi cambiamenti; basta evitare i casi derivati).
- **Uso reale (più dispositivi in parallelo):** impatto **medio-alto**, con un caso **alto** (quantità/divisori sbagliati che arrivano in produzione).

---

## 4. C'è un buco anche a realtime ACCESO

Anche con realtime perfettamente funzionante, alcune mutazioni **non invalidano localmente** le viste derivate e si appoggiano **solo** all'evento SSE. Il caso noto: `CustomerEditDialog` salva la ricetta ricorrente ma **non** fa `mutate(['orders', …])`; rinfresca solo la lista `customers`. Quindi:
- con realtime ON → l'ordine si aggiorna grazie all'evento (ok, con piccola latenza);
- con realtime OFF → l'ordine resta stale fino ai 30s o a una navigazione.

**Conseguenza:** il realtime è diventato un **single point of failure** per la correttezza dei dati derivati, invece di essere solo un "di più" per la collaborazione. Questo è un difetto di design da correggere a prescindere dalla scelta on/off.

---

## 5. Limite strutturale indipendente dal realtime

Ruoli e permessi sono **cristallizzati nel JWT al login** (`auth.ts`). Cambiarli richiede **logout/login** dell'utente interessato, sia con realtime ON che OFF. Il realtime invalida la *lista* utenti/permessi nella UI di gestione, ma **non** ri-emette il token dell'utente coinvolto. Da tenere presente nelle istruzioni d'uso.

---

## 6. Se si decide di tenere il realtime SPENTO — mitigazioni

In ordine di efficacia/sforzo:

1. **Invalidazione locale esplicita dopo ogni mutazione derivata** (il vero fix di correttezza). Es. dopo `upsertRecurringOrder`, fare `mutate(key => Array.isArray(key) && (key[0]==='orders' || key[0]==='statistics'))`. Rende l'app corretta **sul dispositivo che fa l'azione**, anche senza realtime.
2. **Aggiungere `refreshInterval` ai dati di riferimento** (products, customers, divisors, sections, production-groups) — es. 60s. Riduce la finestra di staleness cross-dispositivo da "infinita" a "1 minuto". Costo: più richieste di rete.
3. **Riattivare `revalidateOnFocus: true`** (almeno sui dati di riferimento): tornare sull'app forza un refresh. Era stato disattivato probabilmente per risparmiare rete/batteria su mobile — valutare il trade-off.
4. **"Pull to refresh" / pulsante Aggiorna** esplicito, o invalidazione su cambio pagina/tab.
5. **Disciplina d'uso** (palliativo): chi modifica anagrafiche/ricette avvisa gli altri di ricaricare. Non affidabile, ma a costo zero.

Con realtime spento e **senza** almeno il punto 1, l'app **non è affidabile** per l'uso multi-dispositivo in produzione.

---

## 7. Se si decide di tenere il realtime ACCESO — prerequisiti

(Dalle note di progetto e dal codice — `docs/`, memory.)
1. `DATABASE_URL` = endpoint Neon **DIRECT**, mai il `-pooler` (PgBouncer transaction mode non supporta LISTEN/NOTIFY).
2. Server **long-lived** (`next start`, self-host / Cloudflare Tunnel), **non** serverless/Vercel (l'SSE viene killato al timeout → tempeste di riconnessioni + leak di connessioni Postgres).
3. Rendere comunque `notify()` **best-effort** (try/catch) così un realtime ko non fa fallire i salvataggi (oggi un errore di `notify()` → 500 con dato già salvato).
4. Chiudere il buco del §4 (invalidazione locale) **comunque**: difesa in profondità.

### Checklist per il target finale: locale + Postgres + Cloudflare Tunnel
È lo scenario per cui il realtime è stato progettato, quindi **funzionerà** rispettando questi punti:

- [ ] Avvio con `npm run build && npm run start` (processo **long-lived**; non `next dev` in produzione). L'hub singleton (`lib/realtime/hub.ts`) sopravvive tra le richieste → niente leak di connessioni `LISTEN`.
- [ ] `DATABASE_URL` → Postgres **locale** (connessione diretta per natura, niente pooler → `LISTEN/NOTIFY` pieno).
- [ ] `NEXT_PUBLIC_REALTIME_DISABLED` **rimosso** (o ≠ `1`) e **rebuild** (è una `NEXT_PUBLIC_*`, inlined a build-time: cambiare la env su un server già avviato non basta).
- [ ] Più processi? Va comunque bene: ogni processo apre il proprio `LISTEN` sullo stesso canale `bakery:{id}`, Postgres fa il fan-out a tutti.
- [ ] Cloudflare Tunnel: l'SSE ci passa; l'heartbeat da 25s in `app/api/events/route.ts` è già pensato per il timeout idle (~100s) del tunnel. `X-Accel-Buffering: no` è già impostato per evitare il buffering.
- [ ] `notify()` best-effort + invalidazione locale applicati lo stesso (difesa in profondità).

---

## 8. Raccomandazione

- **A breve:** applicare il **punto 1 del §6** (invalidazione locale) + rendere `notify()` best-effort. Questi due interventi **eliminano i sintomi visibili** (errore al salvataggio + quantità stale) **a prescindere** dallo stato del realtime, e sono a basso rischio.
- **Scelta on/off:** se l'uso è realmente **multi-dispositivo in contemporanea** (lo è), il realtime **acceso** è la scelta giusta — ma solo se rispetti i prerequisiti del §7 (Neon DIRECT + server long-lived). Se l'hosting non può garantirli, tienilo **spento** ma **obbligatoriamente** con i punti 1–2 del §6, accettando finestre di staleness di ~1 minuto sui dati di riferimento.
- In nessuno scenario il realtime dovrebbe restare l'**unico** meccanismo che garantisce dati corretti: va sempre affiancato dall'invalidazione locale.

---

## 9. Audit completo: altri punti con lo stesso problema

Verificato su tutto il codice (non solo ordini). I difetti sono **due**, e sono **sistemici**.

### Fronte A — `notify()` non best-effort → 500 al salvataggio (TUTTE le route)
**Tutte le 21 route di mutazione** chiamano `await notify(...)` fuori da try/catch (~31 punti). Quindi *ogni* salvataggio dell'app — non solo gli ordini — può tornare **500 col dato già committato** se il realtime ha un problema. Elenco route coinvolte:

`customers` (route + `[id]`), `customers/[id]` toggle, `divisors/[productId]`, `sections` (route + `[id]` + `reorder`), `products` (route + `[id]`), `bakery`, `production-groups` (route + `[id]` + `reorder`), `permissions/role`, `permissions/user/[userId]`, `users` (route + `[id]` + `reset-password`), `orders/daily`, `orders/toggle`, `orders/items` (POST/PATCH/DELETE), `orders/recurring/[customerId]`.

➡️ **Fix unico**: avvolgere il corpo di `notify()` (`lib/realtime/notify.ts`) in try/catch. Protegge **tutti** i 31 punti in una riga sola. Nessuna modifica alle route.

### Fronte B — invalidazione locale mancante per dati DERIVATI (sistemico)
Nessun componente fa invalidazione cross-key (`useSWRConfig().mutate` su chiavi diverse dalla propria): ogni mutazione si affida al `mutate()` del proprio hook (che tocca **solo** la sua chiave) o al realtime. Quindi senza realtime, ogni vista *derivata* resta stale. Gap reali per gravità:

| # | Azione (client) | Invalida solo | Chiave derivata NON invalidata | Gravità | Auto-fix |
|---|---|---|---|---|---|
| B1 | Salva ricetta ricorrente + cliente (`CustomerEditDialog`, via `upsertRecurringOrder`) | `customers` | **`orders`**, `statistics` | **ALTA** (quantità errate in produzione) | orders: 30s · stats: no |
| B2 | Sospendi/riattiva cliente (`CustomersManager.toggleActive`) | `customers` | **`orders`** | MEDIA | orders: 30s |
| B3 | Rinomina/cambia tipo cliente (`CustomerEditDialog`) | `customers` | **`orders`** (`customerName`/`customerType` sono server-side, righe 104/154 di `app/api/orders/route.ts`), `statistics` | MEDIA | orders: 30s · stats: no |
| B4 | Rinomina/crea/elimina sezione (`SectionDialog`) | `sections` | **`products`** (il server emette `products.updated`) | BASSA (etichetta) | no (fino a reload) |
| B5 | Modifiche item ordine (`useOrders.*`) | `orders[date]` | `statistics` | BASSA (vista report) | no |

**Non problematici** (le viste si ri-renderizzano già da React leggendo la lista aggiornata): crea/modifica/elimina **prodotto** (gli ordini mostrano il nome dal `useProducts`), **divisori** (Totali/Produzione calcolano dalla lista divisori), **gruppi produzione**, **bakery**, **utenti/permessi** (vista gestione).

### Approccio di fix consigliato (fronte B)
Invece di toppare ogni singolo componente, **centralizzare nell'hook**: far sì che `useCustomers` (update/remove) invalidi anche `orders`+`statistics`, e spostare/avvolgere `upsertRecurringOrder` in modo che invalidi `orders`+`statistics`. Così **ogni** chiamante (sia `CustomersManager` che `CustomerEditDialog`) ne beneficia senza duplicare la logica. Per B4, far invalidare `products` a `useSections`. Per B5, aggiungere `statistics` alle mutazioni di `useOrders`.

### Priorità
1. **A** (`notify()` best-effort) — elimina l'errore al salvataggio ovunque. Rischio minimo.
2. **B1** (ricetta ricorrente → orders/statistics) — è il bug osservato, impatto produzione.
3. **B2 + B3** (toggle/rinomina cliente → orders) — stessa famiglia, stesso fix se centralizzato nell'hook.
4. **B4, B5** — rifinitura.
