# Piano — Migliorie Gestione, Ordini e Produzione

> Stack: Next.js 16 (App Router), Drizzle + Postgres (Neon), SWR, NextAuth v5,
> Tailwind v4 + Radix/shadcn. Tutte le mutation passano da `withAuth` e fanno
> `notify()` (realtime). Le quantità sono `numeric(10,2)` su `recurring_order_items`
> e `daily_order_items` ([lib/db/schema.ts:127](../lib/db/schema.ts#L127), [:162](../lib/db/schema.ts#L162)).
>
> Sei richieste: 2 bug e 4 funzionalità. Sotto, per ognuna, causa esatta e fix
> con riferimento ai file reali. Questo è un documento di analisi, non l'implementazione.

---

## Riepilogo

| # | Tipo | Cosa | Area | Effort |
|---|------|------|------|--------|
| 1 | Feature | Cliente **attivo/disattivo** (sospendi senza cancellare) | Schema + API + Gestione | M |
| 2 | Feature | Clienti in **ordine alfabetico** in produzione | UI produzione | XS |
| 3 | Bug | Nome cliente **resta rosso** a tabella completata | UI produzione | S |
| 4 | Bug | **Quantità/unità** non salvate negli ordini (clienti fissi) | API ordini | M |
| 5 | Feature | Modifica **unità kg/pz** nella modifica cliente | UI gestione | S |
| 6 | Feature | **Grammature libere** (300g, 750g…) | UI (input) | XS |

---

## 1. Cliente attivo/disattivo `feature`

**Obiettivo.** Un interruttore on/off in *Gestione* per **sospendere** temporaneamente un cliente (es. chiuso per ferie): il suo ordine ricorrente sparisce da ordini/produzione/liste, ma **non viene cancellato**. Riattivandolo, torna tutto com'era.

**Approccio.** Colonna booleana `active` su `customers` (default `true`). Gli endpoint che **calcolano gli ordini** filtrano i clienti inattivi; la lista in *Gestione* li mostra comunque (per poterli riattivare).

**Schema** — [lib/db/schema.ts:86-97](../lib/db/schema.ts#L86-L97):
```ts
active: boolean('active').notNull().default(true),
```
Migration con `pnpm db:generate`. ⚠️ Come già visto, lo snapshot `0000` ha drift: **ridurre il file generato** al solo `ALTER TABLE "customers" ADD COLUMN "active" boolean DEFAULT true NOT NULL;` e applicare con la riga SQL diretta sui due branch Neon (test + prod).

**Tipi** — [lib/types.ts:41-45](../lib/types.ts#L41-L45): aggiungere `active: boolean` a `Customer`.

**API:**
- [app/api/customers/route.ts](../app/api/customers/route.ts) `GET`: aggiungere `active: customers.active` alla select (la lista Gestione deve vederlo). `POST`: nessuna modifica (default da schema).
- [app/api/customers/[id]/route.ts:9-12](../app/api/customers/[id]/route.ts#L9-L12): aggiungere `active: z.boolean().optional()` allo `UpdateSchema` (la PATCH usa già `.set(body)`, quindi si applica da sé).
- [app/api/orders/route.ts:24-27](../app/api/orders/route.ts#L24-L27): filtrare `allCustomers` con `and(eq(customers.bakeryId, auth.bakeryId), eq(customers.active, true))`. Così sia i ricorrenti sia i daily di un cliente inattivo vengono saltati (il codice fa già `if (!customer) continue`).
- `app/api/orders/range/route.ts`: stesso filtro (active-only) per coerenza nelle statistiche.

**UI** — [components/manage/CustomersManager.tsx](../components/manage/CustomersManager.tsx): aggiungere uno `Switch` per riga (chiama `customersApi.update(id, { active })` via `useCustomers().update`), e mostrare i clienti inattivi in grigio / con badge "Sospeso". In alternativa/aggiunta, uno switch "Attivo" dentro `CustomerEditDialog`.

**Note:**
- I customer-picker (es. `NewDailyOrderDialog`, `CustomerList`) usano `useCustomers()` che restituisce **tutti** i clienti → valutare se escludere gli inattivi dalla selezione di un nuovo ordine giornaliero.
- `totals` e `product-lists` derivano dagli stessi `orders` filtrati → si aggiornano da soli.

---

## 2. Clienti in ordine alfabetico in produzione `feature`

**Causa.** In [components/production/ProductionTable.tsx:27-29](../components/production/ProductionTable.tsx#L27-L29) `relevantOrders` è solo un `filter`, senza ordinamento → i clienti seguono l'ordine dell'API (ricorrenti poi daily, per inserimento).

**Fix (1 riga).** Dopo il filter:
```ts
const relevantOrders = orders
  .filter(order => order.items.some(item => allProductIds.includes(item.productId)))
  .sort((a, b) => a.customerName.localeCompare(b.customerName, 'it'))
```
Mettendolo qui vale per **tutte** le tabelle di produzione.

---

## 3. Bug — nome cliente resta rosso a tabella completata `bug`

**Causa esatta.** `STATUS_COLORS.partial = 'bg-red-100…'` ([lib/constants.ts:52-57](../lib/constants.ts#L52-L57)) → **rosso = parziale**. In `ProductionTable` lo stato del nome è calcolato con `getOrderStatus(order.items)` su **tutti** gli articoli del cliente ([ProductionTable.tsx:42](../components/production/ProductionTable.tsx#L42), [:122](../components/production/ProductionTable.tsx#L122), [:230](../components/production/ProductionTable.tsx#L230)), non solo quelli mostrati **in quella tabella**. Se il cliente ha articoli anche in **altri gruppi** non ancora fatti, lo stato globale resta `partial` → il nome resta rosso pur avendo completato la tabella corrente.

**Fix.** Calcolare lo stato sui soli articoli della tabella (quelli con `productId ∈ allProductIds`). In tutti e tre i punti:
```ts
const status = getOrderStatus(
  order.items.filter(i => allProductIds.includes(i.productId))
)
```
Meglio ancora: calcolare una volta `const relevantItems = order.items.filter(i => allProductIds.includes(i.productId))` per ogni `order` e riusarlo. Così completando la tabella il nome diventa verde.

---

## 4. Bug — quantità/unità non salvate negli ordini (clienti fissi) `bug`

**Sintomo.** In pagina Ordini: aggiungere un prodotto funziona; **cambiare la quantità non si salva**; **cambiare kg↔pz "non fa niente"** (clicchi, torna com'era).

**Causa esatta.** La PATCH [app/api/orders/items/route.ts:124-189](../app/api/orders/items/route.ts#L124-L189): se **non esiste** un `daily_order` per (bakery, data, cliente) — cioè il cliente è **ricorrente** e quel giorno non è ancora stato "materializzato" — la richiesta finisce nel ramo `dailyItemStatus` (righe 162-186), che **persiste solo `done` e `variant`** (quella tabella non ha colonne `quantity`/`unit`). Quindi quantità e unità vengono **silenziosamente ignorate**. Il select unità "non cambia" perché la modifica non viene salvata e al `mutate()` di SWR il valore torna a quello originale ([ProductLineOwner.tsx:97-99](../components/orders/ProductLineOwner.tsx#L97-L99) chiama correttamente `onUpdate`; il problema è lato API).

> La UI è corretta: blur quantità → `onUpdate(num, item.unit)` ([:29-38](../components/orders/ProductLineOwner.tsx#L29-L38)); cambio unità → `onUpdate(item.quantity, value)`.

**Fix.** Una modifica **strutturale** (quantità o unità) su un articolo **ricorrente** non può vivere in `dailyItemStatus`: va **materializzato** un `daily_order` per quel giorno. Nel `PATCH`, quando **non** c'è daily order **e** `updates` contiene `quantity` o `unit`:
1. Creare il `daily_order` per (bakery, data, cliente) e **copiarci dentro tutti gli articoli del ricorrente** di quel weekday (stessa logica già presente nel `POST` [:33-101](../app/api/orders/items/route.ts#L33-L101) — riusarla/estrarla in un helper `materializeDailyOrder(tx, …)`).
2. Applicare l'`update` (quantità/unità/done/variant) sul `daily_order_items` appena creato.

Il ramo leggero `dailyItemStatus` resta valido **solo** per update di `done`/`variant` (toggle/varianti) su ricorrenti. Pseudo:
```ts
const structural = updates.quantity !== undefined || updates.unit !== undefined
if (daily.length === 0 && structural) {
  // materializza il ricorrente in daily_order(+items) per `date`, poi update sull'item
} else if (daily.length > 0) {
  // update diretto su daily_order_items (già funzionante)
} else {
  // solo done/variant → dailyItemStatus (già funzionante)
}
```

---

## 5. Modifica unità (kg/pz) nella modifica cliente `feature`

**Causa.** In [components/manage/CustomerEditDialog.tsx:275-277](../components/manage/CustomerEditDialog.tsx#L275-L277) l'unità degli **articoli già presenti** è **testo statico** (`{item.unit === 'kg' ? 'kg' : 'pz'}`): non si può cambiare se non rimuovendo e riaggiungendo l'articolo. Il `<Select>` unità esiste solo nella riga "aggiungi" ([:307-315](../components/manage/CustomerEditDialog.tsx#L307-L315)).

**Fix.** Sostituire quel testo con un `<Select>` unità (come la riga aggiungi) e aggiungere un handler `updateUnit(localId, unit)` gemello di `updateQty` ([:145-149](../components/manage/CustomerEditDialog.tsx#L145-L149)). `DraftItem` ha già `unit` e `upsertRecurringOrder` lo invia già → nessun cambiamento API. (Funziona perché il `PUT` ricorrente riscrive tutti gli item.)

---

## 6. Grammature libere (300g, 750g…) `feature`

**Causa.** Gli input quantità limitano i valori:
- [CustomerEditDialog.tsx:269-270](../components/manage/CustomerEditDialog.tsx#L269-L270): `min="0.5" step="0.5"` → solo 0,5 / 1 / 1,5…
- [CustomerEditDialog.tsx:316-321](../components/manage/CustomerEditDialog.tsx#L316-L321) (riga aggiungi): `min="1"` → niente decimali.
- [ProductLineOwner.tsx:93](../components/orders/ProductLineOwner.tsx#L93): `step={item.unit === 'kg' ? 0.1 : 1}` → 0,1 kg (no 0,75 / 0,05).

**Fix.** Per i kg consentire valori liberi: `step="any"` (o `0.01`) e `min` basso (es. `0.01`), mantenendo i pezzi interi (`step={1}` quando `unit === 'pieces'`). Esempio orders:
```ts
step={item.unit === 'kg' ? 'any' : 1}
```

**Vincolo DB.** Le quantità sono `numeric(10,2)` → **risoluzione 10 g** (0,30 = 300 g; 0,75 = 750 g: OK). Se servisse il grammo singolo (es. 0,333 kg), portare la scala a `3` su `recurring_order_items.quantity` e `daily_order_items.quantity` (migration). Per "300g/750g" la scala 2 attuale **basta**.

---

## File riassunto

### Da modificare
| File | # | Cosa |
|------|---|------|
| `lib/db/schema.ts` | 1 | colonna `active` su `customers` |
| `lib/types.ts` | 1 | `active` su `Customer` |
| `app/api/customers/route.ts` | 1 | GET include `active` |
| `app/api/customers/[id]/route.ts` | 1 | PATCH accetta `active` |
| `app/api/orders/route.ts` | 1 | filtro clienti `active` |
| `app/api/orders/range/route.ts` | 1 | filtro clienti `active` |
| `app/api/orders/items/route.ts` | 4 | materializzazione daily su edit quantità/unità ricorrenti |
| `components/manage/CustomersManager.tsx` | 1 | switch attivo/sospeso |
| `components/manage/CustomerEditDialog.tsx` | 5, 6 | select unità per item esistenti + step libero |
| `components/orders/ProductLineOwner.tsx` | 6 | `step="any"` per kg |
| `components/production/ProductionTable.tsx` | 2, 3 | sort alfabetico + stato per-tabella |

### Da creare
| File | # |
|------|---|
| `lib/db/migrations/00xx_*.sql` (solo `ALTER customers ADD active`) | 1 |

---

## Ordine di implementazione consigliato

1. **Quick wins UI** (#2, #3, #6): poche righe, nessuna migration, alto valore percepito.
2. **Bug #4** (API materializzazione): è il fix più "logico", isolato in `orders/items/route.ts`.
3. **#5** (select unità in CustomerEditDialog): piccola UI.
4. **#1** (active): più ampio (schema + migration sui due branch + API + UI) → ultimo, con applicazione SQL su test e poi prod.

---

## Note / rischi

- **#1 migration**: applicare la colonna **sia su test sia su prod** (endpoint diretto Neon), come per `must_change_password`.
- **#4**: la materializzazione "congela" l'ordine di quel giorno (da quel momento le modifiche al ricorrente non si riflettono su quella data) — è il comportamento corretto e già implicito nel modello daily-override.
- **#3**: verificare anche la vista mobile (card, [:42](../components/production/ProductionTable.tsx#L42)) oltre alle due tabelle desktop.
- Tutte le mutation interessate emettono già `notify()` → il realtime continua a funzionare senza interventi.
