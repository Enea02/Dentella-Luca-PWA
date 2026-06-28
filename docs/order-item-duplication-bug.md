# Bug: raddoppio quantità su ordine di cliente fisso (item duplicati)

> Stato: **diagnosticato, fix non ancora applicato.** Bug di dati, indipendente da realtime/cache.

## Sintomo
Su un **cliente fisso** (con articoli ricorrenti): si aggiunge un articolo con qtà 1, e nell'ordine risulta **qtà 2**. Rifacendo il salvataggio dal dialog "Nuovo ordine" torna a 1. L'ordine non esisteva prima per quel giorno.

## Causa
Quando si aggiunge un item a un cliente fisso per un giorno **non ancora materializzato**, `POST /api/orders/items` chiama `getOrCreateDailyOrder()` (`app/api/orders/items/route.ts`):

1. `getOrCreateDailyOrder()` materializza il daily order **copiando l'INTERO template ricorrente** in `daily_order_items` (righe ~90-103) → es. inserisce `P qtà 1`.
2. Subito dopo, il POST **appende il nuovo item in fondo senza controllare se quel prodotto è già stato seminato** (righe ~140-155) → inserisce di nuovo `P qtà 1`.

➡️ Due righe per lo stesso prodotto (1 + 1). I totali/quantità le sommano → **qtà 2**.

Abilitatore strutturale: la tabella `daily_order_items` **non ha vincolo univoco** su `(dailyOrderId, productId)` (solo un indice su `dailyOrderId`), quindi i duplicati sono permessi.

## Perché il "Nuovo ordine" mostra 1 (incoerenza tra i due percorsi)
`POST /api/orders/daily` (dialog "Nuovo ordine") **non semina** il template: nel ramo "ordine esistente" fa `delete` di tutti gli item + `insert` solo di quelli inviati. Quindi riscrive `P qtà 1` → 1 riga.
→ I due percorsi di scrittura trattano la materializzazione in modo **diverso e incoerente**.

## Condizioni di innesco (confermate)
- cliente **fisso** con template ricorrente attivo quel giorno;
- si aggiunge (dal dettaglio ordine, "+ aggiungi") un prodotto **già presente** nel template;
- è la **prima** modifica strutturale di quel giorno (daily non ancora materializzato).

## Fix proposto
1. **Backend — rendere l'add idempotente per prodotto**: in `POST /orders/items`, invece di `insert` cieco, fare **upsert** per `(dailyOrderId, productId)`: se il prodotto è già presente (anche perché appena seminato), aggiornare la riga esistente invece di crearne una nuova. Stessa logica da applicare a PATCH/DELETE che già passano da `getOrCreateDailyOrder`.
2. **Schema — vincolo univoco** su `daily_order_items(dailyOrderId, productId)` (migration) per impedire strutturalmente i duplicati. Richiede prima la **bonifica dei duplicati già presenti** nel DB.
3. **`POST /orders/daily`** — deduplicare `body.items` per `productId` (merge) prima dell'insert.
4. **Frontend (UX, opzionale)** — impedire di aggiungere un prodotto già presente nell'ordine: offrire invece di modificarne la quantità.
5. **Bonifica una tantum** — query per accorpare le righe duplicate esistenti (somma o tieni una sola riga) prima di applicare il vincolo univoco.

## Note
- Indipendente dai fix realtime/cache già applicati.
- Priorità **alta**: produce quantità errate in produzione su clienti fissi (caso d'uso principale dell'app).
