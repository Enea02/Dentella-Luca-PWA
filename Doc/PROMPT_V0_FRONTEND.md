# Prompt per v0.dev — Frontend PWA Gestionale Panificio

> **Come usare questo file:** incollalo tutto in v0.dev come primo messaggio. v0 genererà il progetto Next.js con componenti shadcn/ui. Le parti di backend (API, DB, auth) saranno implementate separatamente da Claude Code: v0 deve lasciare stub o chiamate `fetch` a rotte `/api/...` che verranno create dopo.

---

## 1. Obiettivo

Costruisci il **frontend** di una Progressive Web App (PWA) gestionale per un panificio, da deployare su **Vercel**. L'app gestisce ordini giornalieri, clienti fissi/giornalieri, prodotti, produzione di laboratorio e totali, con due ruoli utente (**titolare** e **addetto**).

Questo è il frontend di un monorepo Next.js: le API routes e il DB (Neon Postgres) saranno aggiunti in un secondo momento. Il tuo compito è la UI, i componenti, lo stato client-side e i fetch verso endpoint `/api/*` che definiremo dopo.

---

## 2. Stack tecnico richiesto

- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** per i componenti base (Button, Input, Card, Dialog, Collapsible, Select, Tabs, ecc.)
- **lucide-react** per le icone
- **next-pwa** o configurazione manuale PWA (manifest + service worker)
- **SWR** o **TanStack Query** per il data fetching verso `/api/*`
- **Zod** per validazione form
- **React Hook Form** per i form più complessi (nuovo ordine, gestione cliente/prodotto)

Niente libreria di stato globale pesante: usa **Context + useReducer** o **Zustand** solo dove serve (es. ruolo utente corrente, data selezionata).

---

## 3. Configurazione PWA

- `public/manifest.json` con nome "Panificio", short_name "Panificio", icone 192x192 e 512x512 (placeholder SVG pane), theme_color `#0f172a`, background_color `#f1f5f9`, display `standalone`, orientation `any`.
- Service worker con cache degli asset statici e strategia `network-first` per le chiamate API.
- Meta tag iOS (`apple-touch-icon`, `apple-mobile-web-app-capable`).
- L'app deve essere installabile su desktop, Android e iOS.

---

## 4. Ruoli e autenticazione (lato frontend)

L'autenticazione è gestita dal backend via **JWT in cookie httpOnly** (lo implementerà Claude Code). Il frontend deve:

- Avere una pagina `/login` con form email + password che fa POST a `/api/auth/login`.
- Dopo il login, il server risponde con un cookie httpOnly. Il frontend legge il ruolo da un endpoint `/api/auth/me` che restituisce `{ id, email, role: "owner" | "staff", bakeryId }`.
- Un `AuthProvider` (Context) espone `user`, `role`, `logout()`, `isLoading` a tutta l'app.
- Un middleware Next.js (`middleware.ts`) reindirizza a `/login` se non autenticato.
- Le route dell'app sono sotto `(app)/` e quelle pubbliche sotto `(public)/`.

> **Importante:** mantieni anche uno **switch di ruolo demo** (solo in dev o dietro feature flag) che permette di passare da `owner` a `staff` senza rifare login, utile per presentare la demo al cliente. In produzione questo switch deve essere nascosto.

---

## 5. Architettura cartelle

```
app/
  (public)/
    login/page.tsx
  (app)/
    layout.tsx            // AuthProvider + TopNav
    orders/page.tsx
    totals/page.tsx
    production/page.tsx
    product-lists/page.tsx
    manage/page.tsx       // solo owner
  api/                    // placeholder, sarà riempito da Claude Code
  layout.tsx
  globals.css
components/
  layout/
    AppShell.tsx
    TopNav.tsx
    RoleBadge.tsx
  ui/                     // shadcn/ui
  orders/
    NewOrderPanel.tsx
    CustomerSearch.tsx
    CustomerList.tsx
    DayOrder.tsx
    ProductLineOwner.tsx
    ProductLineStaff.tsx
    SectionPicker.tsx
  totals/
    TotalsSection.tsx
    DivisorInput.tsx
  production/
    ProductionTable.tsx
  product-lists/
    ProductListCard.tsx
  manage/
    CustomersManager.tsx
    ProductsManager.tsx
    CustomerEditDialog.tsx
    ProductEditDialog.tsx
hooks/
  useAuth.ts
  useOrders.ts
  useCustomers.ts
  useProducts.ts
  useTotals.ts
  useDivisors.ts
lib/
  api.ts                  // wrapper fetch con credentials: 'include'
  types.ts                // interfacce TypeScript
  utils.ts                // clone, dayOfWeek, piecesOf, statusOfCustomer, ecc.
  constants.ts            // DAYS, ecc.
```

---

## 6. Tipi TypeScript (in `lib/types.ts`)

```ts
export type Role = "owner" | "staff";

export type Unit = "pieces" | "kg";

export type CustomerType = "fixed" | "single";

export interface Product {
  id: string;
  name: string;
  section: string;
  unit: Unit;
  piecesPerKg: number | null;
}

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unit: Unit;
  done: boolean;
}

export interface RecurringOrder {
  id: string;
  customerId: string;
  weekdays: number[]; // 1=lun, 7=dom
  items: Omit<OrderItem, "done">[];
}

export interface DailyOverride {
  date: string; // ISO yyyy-mm-dd
  customerId: string;
  items: OrderItem[];
}

export interface User {
  id: string;
  email: string;
  role: Role;
  bakeryId: string;
}
```

---

## 7. Top Navigation

**Una sola riga** di pulsanti, compatti, che occupa poco spazio verticale.

Pulsanti (in ordine): **Ordini**, **Totali**, **Produzione**, **Liste prodotti**. Tutti visibili a owner e staff.

Sulla destra (`ml-auto`), **solo se `role === "owner"`**: pulsante **Clienti e prodotti** (voce extra), poi un badge ruolo + logout.

Stile pulsanti:
- Attivo: `bg-slate-900 text-white`
- Inattivo: `bg-white text-slate-600 ring-1 ring-slate-200`
- Tutti `rounded-2xl px-4 py-2 text-sm font-semibold`

In alto a destra anche:
- Selettore data (default = oggi)
- Badge ruolo corrente
- Pulsante logout

Nella fascia mobile, la top nav diventa orizzontalmente scrollabile ma resta su una riga.

---

## 8. Pagina Ordini (`/orders`)

### Layout
Due colonne su desktop, stack verticale su mobile.

**Colonna sinistra:**
1. `NewOrderPanel` — tendina "Nuovo ordine" (solo owner)
2. Barra ricerca cliente
3. Lista clienti del giorno (scroll interno, `max-h-[62vh] overflow-y-auto`)

**Colonna destra:**
1. Intestazione cliente selezionato
2. Lista righe ordine del giorno (scroll interno `max-h-[65vh] overflow-y-auto`)

### NewOrderPanel (solo owner)

- È un `Collapsible` controllato da stato `isNewOrderOpen`.
- Si apre cliccando il titolo "Nuovo ordine".
- **Rimane aperto finché l'utente non preme "Salva ordine"** — non si chiude cliccando fuori o cambiando prodotto.
- Campi:
  - Input nome cliente (con suggerimenti da clienti esistenti)
  - Toggle tipo ordine: `giornaliero` | `fisso`
  - Se `fisso`: riga di 7 chip per i giorni della settimana (toggle multipli)
  - `SectionPicker` per scegliere il prodotto
  - Select unità: `pezzi` | `kg`
  - Input numerico quantità
  - Pulsante "Aggiungi prodotto" → aggiunge a lista temporanea `items`
  - Riepilogo prodotti aggiunti (lista con pulsante X per rimuovere)
  - Pulsante "Salva ordine" → POST a `/api/orders` e chiude il pannello

### SectionPicker

- Mostra i prodotti raggruppati per sezione (es. `Dolci`, `Pane comune`, `Salati`, `Pizze farcite`, `Focacce farcite`, `Specialità`).
- Ogni sezione è un `Collapsible`.
- **Una sola sezione aperta alla volta**: aprendone una, le altre si chiudono.
- Click su un prodotto → lo seleziona (highlight), la sezione **non si chiude** subito dopo il click (così l'utente vede cosa ha scelto).

### CustomerList

Clienti del giorno ordinati così:
1. Stato `pending` (da fare) — `bg-slate-50 text-slate-700`
2. Stato `partial` (iniziato) — `bg-red-100 text-red-700`
3. Stato `done` (completato) — `bg-emerald-100 text-emerald-800`

A parità di stato: ordine alfabetico.

Cliente selezionato: `bg-slate-900 text-white` (sovrascrive il colore di stato).

Ogni riga: nome cliente, piccolo indicatore "X / Y prodotti fatti".

### DayOrder — vista titolare (owner)

Usa `ProductLineOwner` per ogni riga:
- Nome prodotto + sezione
- Input numerico quantità (modificabile)
- Select unità
- Pulsante icona cestino per eliminare la riga
- **Nessun toggle "pesato"**
- Se quantity scende a ≤ 0 alla modifica, riga rimossa

In fondo, pulsante "+ Aggiungi prodotto a questo cliente" che apre un mini-form (riusa `SectionPicker`).

### DayOrder — vista addetto (staff)

Usa `ProductLineStaff`:
- Nome prodotto + quantità + unità, **sola lettura**
- Tutta la riga è cliccabile → toggle `done`
- Quando `done === true`: riga con `bg-emerald-50 line-through opacity-70`
- Quando `done === false`: riga bianca normale

Il toggle chiama `PATCH /api/orders/:orderId/items/:index`.

---

## 9. Pagina Totali (`/totals`)

Una sola card grande con sezioni collapsible (una per sezione prodotto: Dolci, Salati, ecc.).

- **Una sola sezione aperta alla volta.**
- All'interno di ogni sezione: lista prodotti con:
  - Nome prodotto
  - Totale complessivo **in pezzi** (conversione kg→pezzi usando `piecesPerKg`)
  - Per **owner**: input numerico "Divisore" editabile + risultato calcolato (`totale / divisore` arrotondato)
  - Per **staff**: divisore in sola lettura + risultato evidenziato in grande

### Persistenza divisori
I divisori vanno salvati lato backend (tabella `divisors` legata al prodotto). Il frontend fa:
- `GET /api/divisors` al mount
- `PATCH /api/divisors/:productId` al blur dell'input (debounce 500ms)

---

## 10. Pagina Produzione (`/production`)

Due tabelle verticali: **Produzione Dolci** e **Produzione Salati**.

### Struttura tabella (componente riutilizzabile `ProductionTable`)

Props:
```ts
interface ProductionTableProps {
  title: string;
  columns: { key: string; label: string }[];
  rows: ProductionRow[];
  onToggleCell: (customerName: string, columnKey: string, entryIndex: number) => void;
}

interface ProductionRow {
  customerName: string;
  rowDone: boolean;     // tutte le celle completate
  rowStarted: boolean;  // almeno una cella completata
  cells: Record<string, {
    entries: {
      index: number;
      quantity: number;
      done: boolean;
      name: string;      // nome prodotto specifico
      showName: boolean; // true per pizze/focacce farcite
    }[];
  }>;
}
```

### Colonne Dolci
Una colonna per ogni prodotto dolce principale (es. ALB, CIOC, VUOTA, VENEZIANA). Le colonne sono derivate dai prodotti della sezione "Dolci" esistenti.

### Colonne Salati
Colonne **raggruppate**:
- **PIZZE** → include sia pizze semplici sia pizze farcite
- **FOCACCE** → include sia focacce semplici sia focacce farcite
- **PALE** → prodotti della sezione "Pale" (o categoria equivalente)

### Celle
- Cella vuota se il cliente non ha quel prodotto
- Cella con **quantità** al centro
- Sotto la quantità, **nome del prodotto** visibile se `showName === true` (solo per farciti, in font più piccolo)
- Click sulla cella → toggle `done`
- Cella `done === true`: `bg-emerald-100`
- Cella `done === false`: `bg-white ring-1 ring-slate-200`

### Colonna nome cliente (prima colonna)
- `bg-slate-50` se `rowStarted === false`
- `bg-red-100` se `rowStarted === true && rowDone === false`
- `bg-emerald-100 text-emerald-800 font-semibold` se `rowDone === true`

### Effetto su Ordini
Quando una cella viene toggled qui, l'ordine del giorno del cliente deve riflettere lo stesso cambiamento (tramite la stessa API e invalidazione della query). Usa SWR/TanStack Query `mutate`/`invalidateQueries` sulla chiave degli ordini del giorno.

---

## 11. Pagina Liste prodotti (`/product-lists`)

- Intestazione con titolo "Liste prodotti"
- Barra ricerca prodotto (filtra per nome)
- Griglia di card, una per prodotto ordinato nel giorno

Ogni card `ProductListCard`:
- Nome prodotto (bold, grande)
- Sezione (badge piccolo)
- Unità
- Numero totale clienti che lo hanno ordinato
- Lista scrollabile `cliente → quantità (unità)` ordinata alfabeticamente per cliente

Disponibile sia a owner che staff.

---

## 12. Pagina Clienti e prodotti (`/manage`) — SOLO OWNER

Protetta dal middleware (redirect se `role !== "owner"`).

Due tab shadcn/ui: **Clienti** | **Prodotti**.

### Tab Clienti (`CustomersManager`)
- Barra ricerca
- Lista clienti in ordine alfabetico, scroll interno
- Ogni riga: nome + badge tipo (`fisso`/`giornaliero`) + icona matita + icona cestino
- Click matita → apre `CustomerEditDialog`
- Pulsante "+ Nuovo cliente" in alto

`CustomerEditDialog`:
- Input nome
- Toggle tipo cliente
- Se fisso: chip giorni settimana
- Sezione "Ordine associato" con `SectionPicker` + lista prodotti dell'ordine fisso (per fissi) o ordine modello (per giornalieri)
- Ogni riga: prodotto + quantità + unità + pulsante X
- Pulsante "Salva" → `PATCH /api/customers/:id` + gestione recurring orders
- Pulsante "Elimina cliente" (con conferma) → `DELETE /api/customers/:id`

### Tab Prodotti (`ProductsManager`)
- Barra ricerca
- Lista prodotti in ordine alfabetico, scroll interno
- Ogni riga: nome + sezione + unità + icona matita + cestino
- Pulsante "+ Nuovo prodotto"

`ProductEditDialog`:
- Input nome
- Input sezione (combobox con sezioni esistenti + possibilità di scriverne una nuova)
- Toggle unità: `pezzi` | `kg`
- Se unità = kg: input numerico "pezzi per 1 kg" (obbligatorio)
- Pulsante "Salva" → `POST`/`PATCH /api/products`
- Pulsante "Elimina" (con conferma, avviso che rimuoverà il prodotto da ordini giornalieri/fissi) → `DELETE /api/products/:id`

---

## 13. Logica client-side (utility in `lib/utils.ts`)

Reimplementa in TypeScript le utility della demo:

```ts
export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export function dayOfWeek(isoDate: string): number {
  const raw = new Date(`${isoDate}T12:00:00`).getDay();
  return raw === 0 ? 7 : raw;
}

export function groupedProducts(products: Product[]) {
  const map: Record<string, Product[]> = {};
  products.forEach((p) => {
    const key = p.section || "Senza sezione";
    if (!map[key]) map[key] = [];
    map[key].push(p);
  });
  return Object.entries(map)
    .map(([section, items]) => ({
      section,
      items: [...items].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.section.localeCompare(b.section));
}

export function piecesOf(product: Product | undefined, quantity: number, unit: Unit): number {
  if (!product) return 0;
  if ((unit || product.unit) === "kg") {
    return quantity * (product.piecesPerKg || 0);
  }
  return quantity;
}

export type CustomerStatus = "pending" | "partial" | "done";

export function statusOfCustomer(items: OrderItem[] = []): CustomerStatus {
  if (!items.length) return "pending";
  const doneCount = items.filter((i) => i.done).length;
  if (doneCount === 0) return "pending";
  if (doneCount === items.length) return "done";
  return "partial";
}
```

---

## 14. Chiamate API (wrapper in `lib/api.ts`)

Wrapper `fetch` con:
- `credentials: "include"` (cookie JWT httpOnly)
- header `Content-Type: application/json`
- gestione errori centralizzata (redirect a `/login` su 401)
- tipizzazione tramite generics

```ts
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
```

### Endpoint attesi (li implementerà Claude Code)

- `POST /api/auth/login` → `{ email, password }` → 200 + cookie
- `POST /api/auth/logout` → 204
- `GET /api/auth/me` → `User`
- `GET /api/customers` → `Customer[]`
- `POST /api/customers` → crea cliente
- `PATCH /api/customers/:id` → aggiorna
- `DELETE /api/customers/:id`
- `GET /api/products` → `Product[]`
- `POST /api/products`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/orders?date=YYYY-MM-DD` → ordini del giorno per tutti i clienti (include fissi applicati)
- `POST /api/orders` → crea override/ordine
- `PATCH /api/orders/:id` → aggiorna quantità di una riga
- `PATCH /api/orders/:id/items/:index/toggle` → toggle done
- `DELETE /api/orders/:id/items/:index`
- `GET /api/recurring` → ordini fissi
- `POST /api/recurring` / `PATCH /api/recurring/:id` / `DELETE /api/recurring/:id`
- `GET /api/divisors` → `{ [productId]: number }`
- `PATCH /api/divisors/:productId` → `{ value: number }`
- `GET /api/totals?date=YYYY-MM-DD` → totali aggregati in pezzi per prodotto

---

## 15. Linee guida di stile

- **Sfondo app:** `bg-slate-100`
- **Card:** `rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5`
- **Pulsanti primari:** `bg-slate-900 text-white rounded-2xl px-4 py-2 text-sm font-semibold`
- **Pulsanti secondari:** `bg-white text-slate-600 ring-1 ring-slate-200 rounded-2xl px-4 py-2 text-sm`
- **Input:** `rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-900`
- **Tipografia:** font di sistema, `text-sm` di base, titoli `text-lg font-semibold`
- **Colori di stato:**
  - neutro / da fare → `bg-slate-50 text-slate-700`
  - iniziato / incompleto → `bg-red-100 text-red-700`
  - completato → `bg-emerald-100 text-emerald-800`
  - selezionato / focus → `bg-slate-900 text-white`
- **Angoli arrotondati generosi** (`rounded-2xl`, `rounded-3xl`)
- **Spazio verticale contenuto:** navigazione su una riga, card compatte, scroll interni dove c'è lista lunga

---

## 16. Dati di esempio (mock iniziale)

Mentre il backend non è pronto, il frontend deve funzionare con **dati mock** serviti da un `lib/mockApi.ts` che intercetta le chiamate `apiFetch` quando `process.env.NEXT_PUBLIC_USE_MOCK === "true"`.

Includi dati realistici:
- 6–8 prodotti dolci (cornetti vari, veneziane)
- 8–10 prodotti salati (pizze, focacce semplici e farciti, pale)
- 3–4 specialità con conversione kg → pezzi (es. semolino 1 kg = 16 pezzi)
- 4 clienti fissi (bar, ristoranti) con ordini fissi popolati
- 3 clienti giornalieri

---

## 17. Accessibilità e UX

- Tutti i toggle/button hanno `aria-label`
- Focus visibile tramite `focus:ring-2 focus:ring-slate-900`
- Colori non sono l'unico veicolo di stato (aggiungi icone: ✓ per done, ○ per pending)
- Dialog shadcn/ui hanno trap focus
- Conferma per azioni distruttive (elimina cliente, elimina prodotto)
- Toast (shadcn `sonner`) per successo/errore delle mutazioni

---

## 18. Cosa NON fare

- ❌ Non implementare l'autenticazione reale (niente hashing password, niente generazione JWT). Lascia gli endpoint `/api/auth/*` come chiamate a server da completare.
- ❌ Non implementare la connessione al database. Usa solo `mockApi.ts` o gli endpoint `/api/*` vuoti.
- ❌ Non creare uno state manager globale complesso. Context + SWR/TanStack Query bastano.
- ❌ Non scrivere tutto in un unico file. Rispetta la struttura cartelle del §5.
- ❌ Non usare `localStorage` per dati persistenti (ordini, divisori): quello lo fa il backend. Usa `localStorage` solo per preferenze UI locali (es. ultima data selezionata, sezione aperta in totali).

---

## 19. Deliverable atteso da v0

1. Progetto Next.js 14 App Router completo e avviabile con `npm install && npm run dev`
2. Tutte le pagine del §5 implementate con dati mock funzionanti
3. Componenti riusabili nella cartella `components/`
4. `manifest.json`, icone PWA, service worker configurato
5. Middleware che protegge `(app)/*` con redirect a `/login` se non autenticato (per ora può controllare solo presenza di un cookie qualsiasi, la validazione vera la fa Claude Code)
6. File `README.md` con istruzioni di avvio e variabili d'ambiente attese (`NEXT_PUBLIC_USE_MOCK`, ecc.)

Quando tutte le pagine e i componenti sono pronti e girano con mock, il frontend è considerato completo. Il backend sarà agganciato sostituendo `mockApi.ts` con le vere API routes.
