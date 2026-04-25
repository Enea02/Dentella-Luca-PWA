# Prompt per Claude Code — Backend PWA Gestionale Panificio

> **Come usare questo file:** aprilo con `claude` nella root del progetto Next.js generato da v0.dev. Claude Code userà questo documento come specifica per implementare DB schema, migrations, API routes, autenticazione e sicurezza. Il frontend (cartelle `app/(app)/*`, `app/(public)/*`, `components/`, `hooks/`) è già stato generato da v0 e **non va toccato nella sua UI**, solo collegato alle vere API.

---

## 1. Obiettivo

Implementare il **backend completo** di una PWA gestionale per panificio, nel progetto Next.js monorepo già esistente. Lo stack è:

- **Next.js 14+ App Router** (API Routes sotto `app/api/*`)
- **Neon Postgres** come database (serverless, via driver `@neondatabase/serverless`)
- **Drizzle ORM** per schema, migrations e query tipizzate
- **Autenticazione JWT** con cookie httpOnly (email + password, bcrypt)
- **Deploy su Vercel**
- **Multi-tenant ready**: schema predisposto, ma per ora un solo panificio attivo

Il database deve essere **isolato per-bakery già dal giorno uno**: ogni tabella di dominio ha una `bakery_id` FK e ogni query filtra per bakery dell'utente autenticato. Questo permette di aggiungere nuovi panifici in futuro senza migration traumatiche.

---

## 2. Variabili d'ambiente

Aggiungi al `.env.local` (e documenta in `.env.example`):

```bash
# Database
DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/panificio?sslmode=require

# Auth
JWT_SECRET=                     # 64+ char random, generato con: openssl rand -hex 64
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Cookie
COOKIE_NAME=panificio_session
COOKIE_SECURE=true              # true in prod, false in dev
COOKIE_SAME_SITE=lax

# Rate limiting (opzionale — Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_USE_MOCK=false      # disabilita mock frontend una volta agganciate le API
```

Genera `JWT_SECRET` con `openssl rand -hex 64` e istruisci l'utente a inserirlo in Vercel Environment Variables (mai committato).

---

## 3. Dipendenze da installare

```bash
npm install drizzle-orm @neondatabase/serverless
npm install bcryptjs jose zod
npm install -D drizzle-kit @types/bcryptjs tsx

# Opzionale per rate limiting
npm install @upstash/ratelimit @upstash/redis
```

- **`jose`** per firmare/verificare JWT (preferito a `jsonwebtoken` perché edge-compatible — il middleware Next.js gira su Edge Runtime).
- **`bcryptjs`** (non `bcrypt`) per essere compatibile con Vercel serverless.
- **`drizzle-kit`** per generare migrations.

---

## 4. Schema database (Drizzle)

File: `db/schema.ts`

### Tabelle

```ts
import { pgTable, uuid, text, timestamp, integer, boolean, pgEnum, date, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", ["owner", "staff"]);
export const unitEnum = pgEnum("unit", ["pieces", "kg"]);
export const customerTypeEnum = pgEnum("customer_type", ["fixed", "single"]);

// Bakeries (multi-tenant root)
export const bakeries = pgTable("bakeries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  bakeryId: uuid("bakery_id").notNull().references(() => bakeries.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
}, (t) => ({
  emailIdx: uniqueIndex("users_email_idx").on(t.email),  // email globalmente unica
  bakeryIdx: index("users_bakery_idx").on(t.bakeryId),
}));

// Products
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  bakeryId: uuid("bakery_id").notNull().references(() => bakeries.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  section: text("section").notNull(),
  unit: unitEnum("unit").notNull(),
  piecesPerKg: integer("pieces_per_kg"),  // nullable; richiesto se unit='kg'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),  // soft delete
}, (t) => ({
  bakeryNameIdx: index("products_bakery_name_idx").on(t.bakeryId, t.name),
}));

// Customers
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  bakeryId: uuid("bakery_id").notNull().references(() => bakeries.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: customerTypeEnum("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (t) => ({
  bakeryNameIdx: uniqueIndex("customers_bakery_name_idx").on(t.bakeryId, t.name),
}));

// Recurring orders (template per clienti fissi)
export const recurringOrders = pgTable("recurring_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  bakeryId: uuid("bakery_id").notNull().references(() => bakeries.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  weekdays: integer("weekdays").array().notNull(),  // array di 1..7
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  customerIdx: uniqueIndex("recurring_customer_idx").on(t.customerId),  // un solo ricorrente per cliente
}));

// Righe dell'ordine ricorrente
export const recurringOrderItems = pgTable("recurring_order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  recurringOrderId: uuid("recurring_order_id").notNull().references(() => recurringOrders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  unit: unitEnum("unit").notNull(),
});

// Daily overrides: ordini effettivi per una data specifica
// Se un cliente fisso ha un override in una data, l'override SOSTITUISCE il ricorrente per quel giorno
// Se non c'è override, l'API genera "virtualmente" l'ordine dal ricorrente nella risposta GET
export const dailyOrders = pgTable("daily_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  bakeryId: uuid("bakery_id").notNull().references(() => bakeries.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  customerDateIdx: uniqueIndex("daily_customer_date_idx").on(t.customerId, t.date),
  bakeryDateIdx: index("daily_bakery_date_idx").on(t.bakeryId, t.date),
}));

export const dailyOrderItems = pgTable("daily_order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  dailyOrderId: uuid("daily_order_id").notNull().references(() => dailyOrders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  unit: unitEnum("unit").notNull(),
  done: boolean("done").notNull().default(false),
  position: integer("position").notNull().default(0),  // per ordinamento stabile
});

// Divisori (per pagina Totali)
export const divisors = pgTable("divisors", {
  id: uuid("id").primaryKey().defaultRandom(),
  bakeryId: uuid("bakery_id").notNull().references(() => bakeries.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  value: integer("value").notNull(),
}, (t) => ({
  productIdx: uniqueIndex("divisors_product_idx").on(t.productId),
}));

// Audit log (opzionale, utile per tracciare chi fa cosa)
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  bakeryId: uuid("bakery_id").notNull().references(() => bakeries.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),  // "create_order", "delete_product", ecc.
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

### Note sul modello dati

- **Override vs ricorrente:** l'API `GET /api/orders?date=...` deve comporre la risposta così: parte dai `dailyOrders` esistenti per quella data; per ogni cliente fisso che **non** ha un `dailyOrder` quel giorno e il cui `recurringOrder.weekdays` contiene il giorno della settimana, genera un ordine "virtuale" dalla template. Al primo toggle `done` o alla prima modifica quantità da parte di qualcuno, l'ordine virtuale viene **materializzato** come riga vera in `dailyOrders` + `dailyOrderItems`. Questo corrisponde esattamente al comportamento della demo.
- **Soft delete** per `products` e `customers`: non eliminare righe, ma settare `deletedAt`. Le FK su `dailyOrderItems.productId` sono `onDelete: restrict` per evitare di perdere storico. Quando un prodotto è soft-deleted, non compare più nelle liste UI ma gli ordini passati lo mostrano ancora.
- **Multi-tenant:** ogni tabella di dominio ha `bakeryId`. Tutte le query passano da un helper `scopedDb(bakeryId)` che filtra automaticamente.

---

## 5. Migrations e seed

### Configurazione Drizzle

File `drizzle.config.ts`:
```ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config;
```

Scripts in `package.json`:
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx db/migrate.ts",
    "db:seed": "tsx db/seed.ts",
    "db:studio": "drizzle-kit studio"
  }
}
```

### File `db/migrate.ts`
Applica le migration con `drizzle-orm/neon-http/migrator`.

### File `db/seed.ts`
Popola il DB con dati realistici:
- 1 bakery ("Panificio Demo")
- 2 utenti: un owner (`owner@demo.it` / password fornita via env `SEED_OWNER_PASSWORD`) e uno staff (`staff@demo.it` / env `SEED_STAFF_PASSWORD`). Non usare mai password hardcoded nel sorgente.
- ~15 prodotti tra dolci, salati e specialità (replicando la sezione §13 del prompt v0)
- ~7 clienti misti
- 4 ordini ricorrenti attivi su giorni diversi
- Qualche `dailyOrder` per la data di oggi

Il seed deve essere **idempotente**: se la bakery demo esiste già, non duplicare.

---

## 6. Database client (`db/index.ts`)

```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

### Helper `scopedDb`

File `db/scoped.ts`: una funzione che restituisce un oggetto con metodi che **forzano** il filtro `bakeryId` in ogni query. Usalo in **tutti** gli handler API per eliminare il rischio di leakage cross-tenant.

```ts
export function scoped(bakeryId: string) {
  return {
    async listProducts() {
      return db.select().from(products)
        .where(and(eq(products.bakeryId, bakeryId), isNull(products.deletedAt)));
    },
    // ...analoghi per customers, orders, ecc.
  };
}
```

---

## 7. Autenticazione

### 7.1 Password hashing

File `lib/auth/password.ts`:
```ts
import bcrypt from "bcryptjs";
export const hashPassword = (pwd: string) => bcrypt.hash(pwd, Number(process.env.BCRYPT_ROUNDS) || 12);
export const verifyPassword = (pwd: string, hash: string) => bcrypt.compare(pwd, hash);
```

### 7.2 JWT

File `lib/auth/jwt.ts` usando `jose` (edge-compatible):
```ts
import { SignJWT, jwtVerify } from "jose";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET!);

export interface SessionPayload {
  userId: string;
  bakeryId: string;
  role: "owner" | "staff";
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || "7d")
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
```

### 7.3 Cookie

File `lib/auth/cookie.ts`:
```ts
import { cookies } from "next/headers";

const NAME = process.env.COOKIE_NAME || "panificio_session";

export async function setSessionCookie(token: string) {
  const c = await cookies();
  c.set(NAME, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: (process.env.COOKIE_SAME_SITE as "lax" | "strict") || "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const c = await cookies();
  c.delete(NAME);
}

export async function readSessionCookie() {
  const c = await cookies();
  return c.get(NAME)?.value ?? null;
}
```

### 7.4 Helper "require auth" per le API routes

File `lib/auth/require.ts`:
```ts
import { NextResponse } from "next/server";
import { readSessionCookie } from "./cookie";
import { verifySession, type SessionPayload } from "./jwt";

export async function requireAuth(): Promise<SessionPayload | NextResponse> {
  const token = await readSessionCookie();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return session;
}

export async function requireOwner(): Promise<SessionPayload | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;
  if (result.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return result;
}
```

Pattern d'uso in ogni route:
```ts
export async function POST(req: Request) {
  const auth = await requireOwner();
  if (auth instanceof NextResponse) return auth;
  // ... usa auth.bakeryId, auth.userId, auth.role
}
```

### 7.5 Middleware (edge)

File `middleware.ts` in root:
```ts
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/jwt";

const PUBLIC = ["/login", "/api/auth/login", "/manifest.json", "/icons"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get(process.env.COOKIE_NAME || "panificio_session")?.value;
  if (!token) return redirect(req, "/login");

  const session = await verifySession(token);
  if (!session) return redirect(req, "/login");

  // Protezione route owner-only
  if (pathname.startsWith("/manage") && session.role !== "owner") {
    return NextResponse.redirect(new URL("/orders", req.url));
  }

  return NextResponse.next();
}

function redirect(req: NextRequest, to: string) {
  const url = new URL(to, req.url);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|sw.js).*)"],
};
```

---

## 8. API Routes da implementare

Tutte sotto `app/api/*/route.ts`. Ogni handler:
1. Chiama `requireAuth()` o `requireOwner()`
2. Valida input con **Zod**
3. Usa `scoped(auth.bakeryId)` per le query
4. Restituisce JSON tipizzato

### 8.1 Auth

- **`POST /api/auth/login`** — body `{ email, password }` → verifica credenziali, aggiorna `lastLoginAt`, firma JWT, setta cookie, risponde `{ user: { id, email, role, bakeryId } }`. Rate limit: 5 tentativi/min per IP.
- **`POST /api/auth/logout`** — clear cookie, 204.
- **`GET /api/auth/me`** — restituisce l'utente dalla sessione, 401 se non valida.

### 8.2 Customers (owner per write, entrambi per read)

- `GET /api/customers` — lista clienti attivi della bakery
- `POST /api/customers` — owner — `{ name, type }`
- `PATCH /api/customers/:id` — owner — `{ name?, type? }` + gestione `recurringOrder` annidato opzionale
- `DELETE /api/customers/:id` — owner — soft delete

### 8.3 Products (owner per write)

- `GET /api/products` — lista prodotti attivi
- `POST /api/products` — owner — `{ name, section, unit, piecesPerKg? }`
- `PATCH /api/products/:id` — owner
- `DELETE /api/products/:id` — owner — soft delete

### 8.4 Recurring orders (owner)

- `GET /api/recurring` — lista ricorrenti
- `POST /api/recurring` — owner — `{ customerId, weekdays, items }`
- `PATCH /api/recurring/:id` — owner — aggiornamento weekdays e/o items
- `DELETE /api/recurring/:id` — owner

### 8.5 Daily orders (il cuore dell'app)

- **`GET /api/orders?date=YYYY-MM-DD`** — entrambi i ruoli.
  - Restituisce una mappa `{ [customerName]: { orderId?, items: Array<OrderItem & { materialized: boolean }> } }`.
  - Logica di composizione: merge tra `dailyOrders` reali (per quella data) e ordini ricorrenti virtuali (per i clienti fissi il cui giorno della settimana matcha e che non hanno ancora override).
  - `orderId` è presente solo per gli ordini materializzati.

- **`POST /api/orders`** — owner — crea un ordine/override. Se esiste già per (customerId, date), errore 409.

- **`PATCH /api/orders/:id/items/:itemId`** — entrambi (ma con restrizioni):
  - Staff: può solo modificare `done`
  - Owner: può modificare `quantity`, `unit`, `done`

- **`PATCH /api/orders/materialize`** — helper chiamato automaticamente dal primo toggle su un ordine virtuale. Body: `{ customerId, date }`. Copia l'ordine ricorrente in `dailyOrders` + `dailyOrderItems` e restituisce l'ID materializzato.

- **`DELETE /api/orders/:id/items/:itemId`** — owner

### 8.6 Divisors

- `GET /api/divisors` — entrambi — `{ [productId]: number }`
- `PATCH /api/divisors/:productId` — owner — `{ value }` (upsert)

### 8.7 Totals

- **`GET /api/totals?date=YYYY-MM-DD`** — entrambi. Calcola lato server:
  - Carica tutti i `dailyOrderItems` della data + materializza virtualmente i ricorrenti non ancora override
  - Per ogni prodotto: somma `piecesOf(product, quantity, unit)` (conversione kg→pezzi usa `piecesPerKg`)
  - Raggruppa per `section`
  - Unisce con divisori
  - Risposta:
    ```ts
    {
      sections: Array<{
        section: string;
        products: Array<{
          productId: string;
          name: string;
          totalPieces: number;
          divisor: number | null;
          result: number | null;  // totalPieces / divisor arrotondato, se divisor presente
        }>
      }>
    }
    ```

### 8.8 Production view

- **`GET /api/production?date=YYYY-MM-DD`** — entrambi. Restituisce due strutture `ProductionTable` (Dolci e Salati) normalizzate come richiesto dal frontend (vedi §10 del prompt v0). Il backend fa il raggruppamento intelligente: per salati aggrega pizze (semplici + farcite) nella colonna PIZZE, focacce nella colonna FOCACCE, pale in PALE. Per i prodotti farciti imposta `showName: true`.

### 8.9 Product lists

- **`GET /api/product-lists?date=YYYY-MM-DD`** — entrambi. Per ogni prodotto ordinato nel giorno, restituisce la lista clienti con quantità.

---

## 9. Validazione input (Zod)

File `lib/validation/schemas.ts`. Esempi:

```ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export const productCreateSchema = z.object({
  name: z.string().min(1).max(100),
  section: z.string().min(1).max(50),
  unit: z.enum(["pieces", "kg"]),
  piecesPerKg: z.number().int().positive().nullable(),
}).refine((d) => d.unit !== "kg" || d.piecesPerKg !== null, {
  message: "piecesPerKg obbligatorio se unit=kg",
  path: ["piecesPerKg"],
});

export const customerCreateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["fixed", "single"]),
});

export const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unit: z.enum(["pieces", "kg"]),
});

export const recurringUpsertSchema = z.object({
  customerId: z.string().uuid(),
  weekdays: z.array(z.number().int().min(1).max(7)).min(1),
  items: z.array(orderItemSchema).min(1),
});
```

Ogni route valida `await req.json()` con lo schema appropriato e risponde 400 con dettaglio errori Zod in caso di fallimento.

---

## 10. Sicurezza (checklist da rispettare)

- ✅ **JWT in cookie httpOnly + Secure + SameSite=Lax** (mai in localStorage)
- ✅ **Password bcrypt** con ≥ 12 rounds
- ✅ **Nessuna password o segreto nel sorgente** — solo env vars
- ✅ **`JWT_SECRET` ≥ 64 caratteri random** — istruzioni chiare in README
- ✅ **Validazione Zod** su tutti i body delle mutazioni
- ✅ **Filtro `bakeryId`** su ogni query — mai leakage cross-tenant
- ✅ **Authorization granulare**: `requireOwner()` per tutte le write amministrative
- ✅ **Rate limiting** su `/api/auth/login` (5/min/IP) — usa Upstash se disponibile, altrimenti in-memory fallback con avviso in log che è adatto solo a dev
- ✅ **CORS**: il progetto è monorepo, le API sono same-origin del frontend → nessuna config CORS speciale, ma **rifiuta richieste cross-origin** controllando header `Origin` sulle route di mutazione sensibili
- ✅ **CSRF**: con `SameSite=Lax` e API same-origin siamo già protetti per i flussi principali. Per hardening extra, aggiungi un header `X-Requested-With: fetch` obbligatorio sulle mutazioni e verificalo nei handler (double-submit pattern leggero)
- ✅ **Security headers** via `next.config.js`:
  ```js
  headers: async () => [{
    source: "/(.*)",
    headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    ],
  }]
  ```
- ✅ **Sanitizzazione errori**: mai rispondere al client con stack trace o dettagli DB — solo messaggi generici; logga il dettaglio server-side
- ✅ **Audit log**: registra login, logout, create/update/delete di customers, products, recurring, orders
- ✅ **Timing-safe password compare**: `bcrypt.compare` è già timing-safe, ma in `/api/auth/login` rispondi **sempre** con lo stesso messaggio generico "Credenziali non valide" indipendentemente dal fatto che l'email esista o la password sia sbagliata, per evitare user enumeration

---

## 11. PWA — lato server

Il frontend ha già manifest e service worker. Il backend deve:
- Servire `manifest.json` e icone da `public/` (nessun codice necessario)
- **Escludere le rotte API dalla cache del service worker** (network-first o network-only per `/api/*`) — questo è già in carico al sw del frontend, ma verifica
- Impostare headers corretti per le icone (`Cache-Control: public, max-age=31536000, immutable`)

---

## 12. Deploy su Vercel

### Checklist deploy

1. Creare progetto Neon ([neon.tech](https://neon.tech)) e copiare la connection string con `?sslmode=require`
2. Creare progetto Vercel collegato al repo
3. In Vercel → Settings → Environment Variables, aggiungere **tutte** le env del §2 per "Production", "Preview", "Development"
4. `JWT_SECRET` deve essere **diverso** tra Preview e Production
5. Dopo il primo deploy: aprire un terminal locale con `.env.local` che punta al DB di produzione, lanciare `npm run db:migrate` e `npm run db:seed` (quest'ultimo solo la prima volta)
6. Configurare un dominio custom se necessario, verificare HTTPS
7. (Opzionale) Abilitare Vercel Analytics e Speed Insights

### Configurazione regione
Impostare la regione Vercel vicino a Neon (es. Francoforte `fra1`) per minimizzare latenza. File `vercel.json`:
```json
{ "regions": ["fra1"] }
```

---

## 13. Testing minimo richiesto

Aggiungi almeno questi test (Vitest):

- `db/seed.test.ts` — seed è idempotente
- `lib/auth/jwt.test.ts` — sign + verify round-trip, token scaduto rifiutato, firma invalida rifiutata
- `lib/auth/password.test.ts` — hash e verify funzionano
- `app/api/auth/login/route.test.ts` — login con credenziali valide/invalide/email inesistente restituisce sempre stesso messaggio d'errore generico per credenziali sbagliate
- `app/api/orders/route.test.ts` — GET compone correttamente override + ricorrenti virtuali per una data specifica
- `lib/auth/require.test.ts` — `requireOwner` respinge staff con 403

Usa un DB di test separato (Neon branch) o `pg-mem` per velocità.

---

## 14. Documentazione da produrre

Alla fine del lavoro, aggiorna o crea:

- **`README.md`** completo: setup locale, env vars, comandi `npm`, deploy su Vercel
- **`docs/API.md`**: elenco endpoint con request/response per ognuno
- **`docs/SECURITY.md`**: modello di sicurezza, threat model leggero, come ruotare il `JWT_SECRET`
- **`docs/MULTI_TENANCY.md`**: come aggiungere un nuovo panificio (inserire riga in `bakeries`, creare owner iniziale), e lista delle query che dipendono da `bakeryId`

---

## 15. Ordine di implementazione consigliato

1. Setup dipendenze + Drizzle config + schema completo
2. `db/migrate.ts` + prima migration generata + seed idempotente
3. Helper auth (password, jwt, cookie, require)
4. Middleware edge
5. Route `/api/auth/*`
6. Route CRUD su customers e products (con owner guard)
7. Route recurring orders
8. Route daily orders (inclusa materializzazione)
9. Route divisors
10. Route totals, production, product-lists (aggregazioni server-side)
11. Rimpiazzare `NEXT_PUBLIC_USE_MOCK=true` nel frontend → `false`, verificare che tutte le pagine funzionino con API vere
12. Security headers + rate limit + audit log
13. Test
14. Documentazione + deploy

Tra ogni step, avvia `npm run dev` e verifica che il frontend esistente continui a funzionare (il contratto API del prompt v0 è lo stesso che implementerai qui).

---

## 16. Cose da NON fare

- ❌ Non modificare la UI del frontend (cartelle `components/`, `app/(app)/*`, `app/(public)/*`). Collega solo le API reali.
- ❌ Non usare `localStorage` o `sessionStorage` per dati sensibili lato client — tutto via cookie httpOnly.
- ❌ Non esporre mai `DATABASE_URL` o `JWT_SECRET` come `NEXT_PUBLIC_*`.
- ❌ Non saltare il filtro `bakeryId` "tanto c'è un solo panificio" — è il fondamento del modello multi-tenant futuro.
- ❌ Non usare `jsonwebtoken` (non gira su Edge Runtime) — usa `jose`.
- ❌ Non usare `bcrypt` nativo — usa `bcryptjs` per compatibilità serverless.
- ❌ Non committare `.env.local` o il DB seed con password reali.

---

## 17. Deliverable atteso

Al termine, il progetto deve:

1. Avviarsi in locale con `npm run dev` + DB Neon configurato
2. Avere login funzionante con gli utenti creati dal seed
3. Esporre tutti gli endpoint del §8 con validazione, auth, scope multi-tenant
4. Passare i test del §13
5. Deployarsi su Vercel senza errori con le env vars del §2
6. Avere documentazione completa in `docs/`
7. Avere audit log che registra le azioni amministrative
8. Essere pronto a ricevere un secondo panificio semplicemente inserendo una riga in `bakeries` + un owner in `users`
