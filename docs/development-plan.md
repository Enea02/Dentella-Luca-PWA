# Piano di sviluppo — richieste Luca

Piano tecnico per le richieste raccolte in `docs/new-requests.md`. Ogni sezione descrive
obiettivo, approccio tecnico (DB / API / frontend), file toccati, stima di complessità e
decisioni ancora aperte. Le voci sono ordinate per **fase di rilascio** (vedi roadmap in fondo),
non per numero originale.

Legenda stima: **S** = piccola (≤ 1 giorno) · **M** = media (1–2 giorni) · **L** = grande (3–5 giorni).

---

## Vincoli trasversali (validi per tutte le voci)

- **Migrazioni DB:** ogni modifica di schema passa da `npm run db:generate` (genera SQL) →
  `npm run db:migrate`. Mai `db:push` in produzione. Vedi `lib/db/schema.ts`.
- **Realtime OFF su Vercel** (`NEXT_PUBLIC_REALTIME_DISABLED=1`). Ogni nuova mutazione che tocca
  dati *derivati* (ordini → totali → statistiche) DEVE invalidare le chiavi SWR dipendenti a mano
  via `useSWRConfig().mutate(matcher)`, come già fatto in `hooks/useData.ts`. Non affidarsi al realtime.
- **Build `--webpack`** e `typescript.ignoreBuildErrors: true`: la build non fallisce sui type error.
  Verificare i tipi con l'editor / `tsc`, non dare per scontato che "build verde = type-safe".
- **Permessi:** ogni route API è avvolta da `withAuth()` con eventuale `require`. Vedi
  `lib/auth/permissions.ts`. Ricorda: i permessi sono cristallizzati nel JWT → una modifica di ruolo
  ha effetto solo dopo logout/login.
- **Verifica manuale:** nessun test automatico. Ogni voce si verifica con `npm run dev` esercitando il
  flusso a mano (e su tablet dove indicato).

---

## FASE 0 — Bug bloccante

### F1. Duplicazione righe ordine (bug prodotto replicato)

**Riferimento richiesta:** messaggio del 06/07 + `docs/order-item-duplication-bug.md`.

**Sintomo:** cliccando un prodotto a volte viene replicato, la selezione non "prende", si creano
righe extra; un refresh sistema. I totali risultano gonfiati (mostra qtà 2 mentre il DB ha 1/1/1).

**Causa (nota):** `daily_order_items` non ha vincolo univoco su `(dailyOrderId, productId)` e il path
di aggiunta (`POST` in `app/api/orders/items/route.ts`, e il seeding di `getOrCreateDailyOrder`)
inserisce senza deduplica → lo stesso prodotto può diventare più righe. Il refresh "sistema" perché
la GET ricalcola, ma le righe doppie restano nel DB.

**Approccio:**
1. **Migrazione dati:** collassare i duplicati esistenti in `daily_order_items` (per ogni
   `dailyOrderId + productId` tenere una sola riga; decidere se sommare o tenere la prima — vedi
   decisione aperta).
2. **Vincolo univoco:** aggiungere `unique('daily_order_items_order_product_key').on(dailyOrderId, productId)`
   in `lib/db/schema.ts` + migrazione.
3. **Upsert al posto dell'insert:** in `app/api/orders/items/route.ts` cambiare il `POST` (e il seeding
   in `getOrCreateDailyOrder`) da `insert` cieco a `onConflictDoUpdate` sul nuovo target, così un
   prodotto già presente aggiorna la riga invece di crearne una seconda. Verificare anche il `PATCH`
   strutturale (già fa `update` poi `insert` di fallback — proteggerlo dal conflitto).
4. **Verifica del race "click non seleziona":** riprodurre con toggle rapidi; l'update ottimistico in
   `useOrders.toggleItem` (`hooks/useData.ts`) + refresh 30s è coerente una volta rimossi i doppioni.

**File:** `lib/db/schema.ts`, nuova migrazione in `lib/db/migrations/`, `app/api/orders/items/route.ts`,
(controllo) `app/api/orders/daily/route.ts`, `app/api/orders/toggle/route.ts`.

**Stima:** M. **Priorità:** alta — è un bug di correttezza sull'uso quotidiano, va fatto prima di installare.

**Decisioni aperte:**
- Nella deduplica dei dati storici: **sommare** le quantità dei doppioni o **tenerne una** e scartare le
  altre? (Consiglio: tenerne una — i doppioni sono un artefatto, non ordini reali.)

---

## FASE 1 — Essenziali per l'installazione

> Luca: «la bacheca aggiunte + il punto 2 + il punto 5 sono le essenziali; completate quelle, si installa».

### A1. Bacheca "Aggiunte" nei totali ⭐

**Riferimento:** punto 1 / messaggi 06–08/07.

**Obiettivo:** in cima alla pagina Totali, una bacheca comprimibile (come le sezioni) che mostra, per i
soli prodotti "preferiti" (stellina), lo **scostamento rispetto alla base fissa** del giorno, con il
totale risultante. **Il delta e il totale si mostrano nell'unità di misura dell'articolo** (kg per gli
articoli in kg, pezzi per quelli a pezzi), non sempre in pezzi:
```
Semolino (pz)  →  + 50 pz = 350 pz
Comune (kg)    →  − 2 kg  = 18 kg
```

**Modello concettuale (chiave):**
- **Base** del giorno = somma, su tutti i clienti fissi attivi il cui `recurring_orders.weekdays`
  include quel giorno della settimana, delle quantità del template `recurring_order_items`.
  È "quello che sarebbe la giornata se non facessi nessuna modifica".
- **Attuale** = i totali già calcolati e mostrati in `components/totals/TotalsSection.tsx`
  (ordini computati = ricorrenti + override giornalieri + clienti singoli).
- **Scostamento** per prodotto = `attuale − base`. Mostrare solo i prodotti con scostamento ≠ 0.

Questo è elegante perché l'"attuale" è già disponibile lato client (hook `useOrders`), quindi serve solo
un secondo dato: la **base** ricorrente del giorno.

**Approccio tecnico:**
1. **Nuovo endpoint** `GET /api/orders/recurring-base?date=YYYY-MM-DD` → ritorna
   `[{ productId, quantity, unit }]` aggregando i `recurring_order_items` dei clienti fissi attivi per
   quel giorno della settimana. Riusa `dayOfWeek()` da `lib/utils`. (Nessuna scrittura, gated
   `orders:read`.)
2. **Stellina / prodotti osservati:** aggiungere colonna `additionsWatch boolean not null default false`
   a `products` (`lib/db/schema.ts` + migrazione). Toggle estendendo `PATCH /api/products/[id]`
   (già gated `products:write`, cioè **admin** — coerente con Luca admin, nessun permesso ad hoc).
3. **Frontend:** nuovo componente `components/totals/AdditionsBoard.tsx` montato in cima a
   `app/(app)/totals/page.tsx`. Calcola internamente `deltaPezzi = actualPieces(prod) − basePieces(prod)`
   con `toPieces()`, poi **converte alla vista nell'unità dell'articolo**: se `product.unit === 'kg'`
   mostra delta e totale in kg (`pezzi / piecesPerKg`), altrimenti in pezzi. Filtra ai prodotti con
   `additionsWatch = true`. Include un pannello impostazioni (popover) per stellinare i prodotti.
4. **Hook dati:** nuovo `useRecurringBase(date)` in `hooks/useData.ts` (SWR, chiave `['recurring-base', date]`).
   Invalidazione: la base cambia quando si modifica un template ricorrente → far invalidare
   `recurring-base` dalle mutazioni già esistenti (`upsertRecurringOrder`, `useCustomers`).

**File:** nuovo `app/api/orders/recurring-base/route.ts`, `lib/db/schema.ts` + migrazione,
`app/api/products/[id]/route.ts` (o nuovo route), `lib/api.ts`, `hooks/useData.ts`,
nuovo `components/totals/AdditionsBoard.tsx`, `app/(app)/totals/page.tsx`.

**Stima:** M.

**Decisioni chiuse:** stellina gestita da admin via `products:write` (Luca è admin). Le "aggiunte"
includono gli interi ordini dei clienti singoli (100% scostamento). Delta/totale nell'**unità
dell'articolo** (kg o pezzi).

### B1. Cancella / svuota cliente del giorno ⭐ ("punto 2")

**Riferimento:** punto 2 / messaggio 06/07.

**Obiettivo:** in `components/orders/DayOrder.tsx`, un pulsante che azzera in un colpo l'intero ordine
del cliente **solo per quella data**, senza toccare il template fisso.

**Comportamento:**
- **Cliente fisso** (template copre il giorno): materializzare un `daily_order` **vuoto** per la data
  (override del template con zero righe) e cancellare eventuali `daily_item_status` di quel
  cliente/data. Il template resta intatto; solo quel giorno risulta svuotato.
- **Cliente singolo** (o fisso che non copre il giorno): eliminare direttamente la riga `daily_orders`
  (cascade sugli item) + eventuali `daily_item_status`.
- **UI:** nascondere dalla lista (`components/orders/CustomerList.tsx`) gli ordini computati con 0 righe,
  così il cliente "sparisce" dal giorno come si aspetta Luca. (I clienti singoli non hanno mai 0 righe;
  un fisso a 0 righe è sempre uno svuotamento intenzionale.)

**Approccio tecnico:**
1. **Nuovo endpoint** `DELETE /api/orders/daily/clear` (o metodo su `app/api/orders/daily/route.ts`),
   body `{ date, customerId }`, gated `orders:edit`. Logica fisso/singolo come sopra, dentro una
   transazione, con `notify()` finale.
2. **Hook:** metodo `clearOrder(customerId)` in `useOrders` (`hooks/useData.ts`) con `mutate()` +
   invalidazione statistiche (già presente il matcher `isStatsKey`).
3. **UI:** pulsante "Svuota / Rimuovi dal giorno" nell'header di `DayOrder` (solo `canEdit`) con conferma
   `AlertDialog`; filtrare i 0-righe in `CustomerList`.

**File:** `app/api/orders/daily/route.ts` (o nuovo `clear/route.ts`), `lib/api.ts`, `hooks/useData.ts`,
`components/orders/DayOrder.tsx`, `components/orders/CustomerList.tsx`.

**Stima:** S–M.

**Decisioni aperte:**
- Dopo lo svuotamento di un **cliente fisso**, il nome deve **sparire** dal giorno (nascondi 0-righe) o
  restare visibile come ordine vuoto? (Consiglio: sparire.)

### C1. Riordino degli "insiemi di prodotti" (sezioni) ⭐ ("punto 5")

**Riferimento:** punto 5 / messaggio 07/07.

**Obiettivo:** far funzionare il drag-and-drop di riordino degli **insiemi/sezioni** in Gestione →
Prodotti anche da desktop (Luca l'ha provato solo da computer e non si sposta).

**Stato attuale:** il riordino è implementato con `hooks/useDragReorder.ts` (Pointer Events) e commit via
`sectionsApi.reorder` → `PUT /api/sections/reorder`. Usato in `components/manage/ProductsManager.tsx`
(sezioni) e in `components/production/ProductionGroupsManager.tsx` (gruppi di produzione).

**Approccio (diagnosi guidata — va prima riprodotto):**
1. Riprodurre in `npm run dev` su browser desktop; osservare in Network se il `PUT /api/sections/reorder`
   parte al rilascio.
2. Cause probabili da verificare:
   - **Selezione testo** durante il drag col mouse: le righe/handle hanno `touch-none` ma non
     `select-none`; su desktop il mouse può avviare una selezione invece del drag. → aggiungere
     `select-none` a riga e handle in `ProductsManager`.
   - **Pointer capture dentro `ScrollArea` Radix:** verificare che gli eventi `pointermove` arrivino con
     `clientY` corretto mentre si è dentro il viewport scrollabile (`h-[60vh]`).
   - **Persistenza:** controllare che `app/api/sections/reorder/route.ts` scriva davvero la colonna
     `order` (altrimenti dopo il `mutate()` la lista torna all'ordine vecchio → sembra "non si sposta").
3. Applicare il fix minimo emerso e verificare **su desktop e tablet**. Applicare la stessa correzione a
   `ProductionGroupsManager` se condivide il difetto.

**File:** `components/manage/ProductsManager.tsx`, `hooks/useDragReorder.ts`,
`app/api/sections/reorder/route.ts`, (eventuale) `components/production/ProductionGroupsManager.tsx`.

**Stima:** S (una volta riprodotto). **Nota:** richiede riproduzione prima di stimare il fix con certezza.

---

## FASE 2 — Qualità dati clienti fissi

### D1. Cliente fisso con base + sottoinsiemi per giorno ("punto 4")

**Riferimento:** punto 4 / messaggi 07/07.

**Obiettivo:** un **unico** cliente fisso con un ordine **base** (valido per tutti i giorni attivi) e
**varianti per giorno della settimana** (aggiungi/togli/cambia quantità rispetto alla base). Modificando
la base si aggiornano tutti i giorni; le statistiche sommano sotto un solo nome. Elimina la necessità dei
7 cloni "Luca L / Luca M …".

**Modello attuale (limite):** `recurring_orders` ha UN solo `weekdays[]` e UN solo set di
`recurring_order_items`, identico per tutti i giorni coperti. Nessuna variazione per giorno → oggi si
creano clienti separati.

**Design proposto — item ricorrenti "taggati per giorno":**
- Estendere `recurring_order_items` (`lib/db/schema.ts`) con:
  - `weekday smallint` **nullable**: `null` = riga **base** (tutti i giorni); `1..7` = override per quel
    giorno.
  - `removed boolean not null default false`: tombstone per "togli questo prodotto in questo giorno".
- **Calcolo effettivo per il giorno W** (usato ovunque si legga il template):
  1. parti dalle righe base (`weekday IS NULL`);
  2. applica le righe con `weekday = W`: se `removed` → rimuovi il prodotto; altrimenti
     imposta quantità/unità; i prodotti non presenti nella base vengono aggiunti.
- **Retro-compatibilità:** i template esistenti hanno tutte le righe con `weekday = null` (= base per
  tutti i giorni) → comportamento invariato, nessuna migrazione dati necessaria oltre all'aggiunta delle
  colonne. I cloni "Luca L/M/…" già creati restano; consolidarli è un'operazione **manuale** (non
  automatizzabile in modo sicuro).

**Punti di modifica del calcolo** (tutti devono usare il merge base+giorno):
- `app/api/orders/route.ts` (GET singola data) — assemblaggio item ricorrenti.
- `app/api/orders/range/route.ts` (statistiche / proiezioni) — stesso merge.
- `getOrCreateDailyOrder()` in `app/api/orders/items/route.ts` — il seeding deve usare il set effettivo
  del giorno, non le righe base grezze.
- `app/api/orders/recurring/[customerId]/route.ts` (GET/PUT) — payload esteso: base + override per giorno.
- Se realizzata, l'endpoint `recurring-base` di **A1** deve usare lo stesso merge.

**Frontend:** riprogettare `components/manage/CustomerEditDialog.tsx` con tab
`Base | Lun | Mar | … ` (solo i giorni attivi). Il tab **Base** modifica le righe base; ogni tab-giorno
mostra la base (in sola lettura/attenuata) e consente aggiunte/rimozioni/override — esattamente lo schema
disegnato da Luca (`Semolino (base) 300 +/− x = tot`).

**Statistiche:** già aggregano per `customerId` su tutte le date (`computeStats` in `hooks/useData.ts`) →
con un solo cliente i numeri si unificano automaticamente.

**File:** `lib/db/schema.ts` + migrazione, `app/api/orders/route.ts`, `app/api/orders/range/route.ts`,
`app/api/orders/items/route.ts`, `app/api/orders/recurring/[customerId]/route.ts`, `lib/api.ts`,
`lib/types.ts`, `components/manage/CustomerEditDialog.tsx`.

**Stima:** L. **Rischio:** alto (tocca il cuore del dominio ordini). Da fare **dopo** l'installazione.

**Decisioni aperte:**
- Rappresentazione della rimozione per giorno: flag `removed` (consigliato) vs quantità 0.
- Migrazione dei cloni "Luca L/M/…" esistenti: manuale, con una breve guida. Confermare.

---

## FASE 3 — Pagina foglio (stile Excel)

### E1. Pagina "Excel": griglia prodotti × clienti del giorno

**Riferimento:** punto 3 / messaggi 07–08/07.

**Obiettivo:** una pagina a griglia per una data: **righe = clienti**, **colonne = prodotti** raggruppati
per sezione (bordo più spesso tra i gruppi, ordine ereditato da Gestione prodotti), celle = quantità
(pezzi o kg). **Totale di colonna** in fondo. Le modifiche si riflettono sulla pagina ordini principale.
Riga finale "**+ Aggiungi cliente**" (crea riga con nome). Solo modifica prodotto/cliente **del giorno**
(nessuna modifica del template).

**Natura:** è una vista *trasposta ed editabile* degli ordini del giorno. Legge gli stessi dati di
`useOrders(date)` e scrive con gli endpoint item già esistenti — **nessuna nuova logica di dominio**.

**Approccio tecnico:**
1. **Route/nav:** nuova pagina `app/(app)/sheet/page.tsx` (es. "Foglio") + voce nel menu (`components/layout`).
2. **Colonne:** tutti i prodotti ordinati per `sections.order`; separatore (bordo spesso) tra sezioni;
   intestazione = nome prodotto sotto l'etichetta di sezione. L'ordine segue Gestione prodotti (come
   richiesto: le modifiche in gestione si riflettono qui).
3. **Righe:** i clienti con un ordine per quella data + riga "aggiungi cliente" (eventuale toggle "mostra
   tutti i clienti attivi"). Modificare la cella di un cliente fisso = override giornaliero
   (materializza il `daily_order`) — stesso comportamento della pagina ordini.
4. **Editing cella:** input per cella. Alla modifica: se l'item esiste → `updateItem(qty)`; se svuotata →
   `removeItem`; se nuova → `addItem`. Riusa i metodi di `useOrders`. Toggle pz/kg per cella (default
   `product.unit`) — risponde al "posso inserire sia pezzi che kg?": **sì**.
5. **Totali colonna:** somma in pezzi (via `toPieces`) nell'ultima riga per prodotto.
6. **Aggiungi cliente:** input nome → `customersApi.create` (tipo `single`) → nuova riga. Risponde al
   "+ crea riga con nome".
7. **Sync:** gli endpoint usati invalidano già ordini+statistiche (`hooks/useData.ts`), quindi la pagina
   ordini principale si aggiorna da sola.

**Sfida principale:** UX/performance di una griglia larga (molti prodotti × molti clienti) su tablet →
scroll orizzontale con **prima colonna (clienti) e header (prodotti) sticky**; eventuale virtualizzazione.

**File:** nuovo `app/(app)/sheet/page.tsx`, nuovi componenti in `components/sheet/`, `components/layout`
(voce menu), riuso di `hooks/useData.ts` e `lib/api.ts`.

**Stima:** L. **Rischio:** medio (soprattutto UX/perf; rischio architetturale basso perché riusa gli
endpoint esistenti).

**Decisioni aperte:**
- Quali clienti come righe: solo quelli con ordine oggi + "aggiungi", oppure tutti gli attivi (toggle)?
- pz/kg per cella: default `product.unit` con possibilità di toggle. Confermare.
- Layout tablet: header/colonna sticky (consigliato).

---

## FASE 4 — Stagionale (richiede una call)

### G1. Panettoni e colombe

**Riferimento:** messaggio 08/07. Scadenza: **ottobre** ideale, **metà febbraio** come limite.

**Stato:** descrizione ancora troppo vaga per progettare. Serve una **call di discovery** per definire:
prodotti stagionali, gestione pre-ordini (Natale = panettoni, Pasqua = colombe), varianti/gusti,
tempistiche di produzione, se serve una vista/flusso separato dagli ordini quotidiani.

**Azione:** pianificare la call entro **fine settembre** per arrivare pronti a ottobre; fallback metà
febbraio per la stagione Pasqua. Fuori scope finché non definito.

---

## Roadmap consigliata

| Fase | Voce | Stima | Nota |
|------|------|-------|------|
| 0 | **F1** Bug duplicazione righe | M | Correttezza — prima dell'installazione |
| 1 | **B1** Svuota cliente del giorno | S–M | Essenziale (punto 2) |
| 1 | **C1** Riordino insiemi (desktop) | S | Essenziale (punto 5) — riprodurre prima |
| 1 | **A1** Bacheca "Aggiunte" | M | Essenziale |
| — | **→ Installazione** | — | Dopo Fase 0 + 1 (come da Luca) |
| 2 | **D1** Cliente fisso per giorno | L | Alto rischio, alto valore dati |
| 3 | **E1** Pagina foglio (Excel) | L | UI ampia, riusa endpoint |
| 4 | **G1** Panettoni e colombe | ? | Call prima; ott / feb |

## Stima in ore (implementazione focalizzata)

Ore di sviluppo attivo. La **verifica** richiede l'app in esecuzione con il DB (`npm run dev` + Neon) e,
dove indicato, prova su tablet: quella parte dipende dall'ambiente ed è esclusa dal conteggio "codice".

| Voce | Ore | Confidenza |
|------|-----|-----------|
| **F1** Bug duplicazione righe | 2–3 h | alta |
| **B1** Svuota cliente del giorno | 2–3 h | alta |
| **C1** Riordino insiemi (desktop) | 1–2 h | media (dipende dalla riproduzione) |
| **A1** Bacheca "Aggiunte" | 4–6 h | media |
| **D1** Cliente fisso per giorno | 8–12 h | bassa (tocca il cuore del dominio) |
| **E1** Pagina foglio (Excel) | 8–12 h | bassa (UI ampia / perf tablet) |
| **G1** Panettoni e colombe | — | esclusa (serve call) |

- **Fasi 0–1 (blocco installazione: F1 + B1 + C1 + A1):** ~**9–14 ore**.
- **Tutto (Fasi 0–3, esclusa G1):** ~**25–38 ore**.

Note: D1 ed E1 concentrano quasi tutta l'incertezza e il rischio; conviene affrontarle una alla volta,
dopo l'installazione, con verifica manuale a ogni step. Migrazioni DB e collaudo su tablet vanno
comunque eseguiti nell'ambiente reale.

## Domande residue con Luca (non bloccano l'inizio)

1. **B1:** dopo lo svuotamento di un fisso, il nome sparisce dal giorno o resta come ordine vuoto?
   (Consiglio: sparisce.)
2. **E1:** righe = solo clienti con ordine + "aggiungi", o tutti gli attivi (con toggle)?
3. **G1:** call di discovery per definire lo scope stagionale (entro fine settembre).
