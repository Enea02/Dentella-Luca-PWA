# Dentella-Luca PWA

PWA gestionale per panificio: ordini, produzione, totali, statistiche.

## Stack
- Next.js 16 (App Router) + React 19
- Drizzle ORM + Postgres
- Auth.js v5 (Credentials provider, JWT)
- Tailwind 4, shadcn/ui, SWR, Zustand

## Setup (sviluppo / test)

### 1. Variabili d'ambiente
Copia `.env.example` in `.env.local` e compila:

```bash
cp .env.example .env.local
```

- **`DATABASE_URL`** — connessione Postgres. Per test usa Neon:
  https://console.neon.tech → crea progetto → copia la connection string.
- **`AUTH_SECRET`** — generala con:
  ```bash
  openssl rand -base64 32
  ```

### 2. Installa dipendenze
```bash
npm install
```

### 3. Applica lo schema al database
```bash
npm run db:push
```

### 4. Crea il primo panificio + admin
Solo l'amministratore può creare nuovi panifici. Lancia:

```bash
npm run bakery:create
```

Lo script chiede: nome panificio, email, password, e il ruolo del primo utente (default `admin`). Crea anche le sezioni di default (Dolci, Pane comune, Salati, Pizze farcite, Focacce farcite, Specialità).

### 5. (Opzionale) Popola con dati di esempio
```bash
npm run db:seed
```
Inserisce 24 prodotti, 7 clienti, 5 ricorrenti, divisori, gruppi produzione e ~38 giorni di ordini storici + futuri.

### 6. Avvia
```bash
npm run dev
```

Vai su `http://localhost:3000`, login con le credenziali create al punto 4.

## Comandi utili

| Comando | Descrizione |
|---|---|
| `npm run dev` | Server di sviluppo |
| `npm run build` | Build di produzione |
| `npm run db:generate` | Genera nuova migration SQL dallo schema |
| `npm run db:push` | Applica schema direttamente (dev) |
| `npm run db:migrate` | Applica le migration generate (prod) |
| `npm run db:studio` | UI per ispezionare il DB |
| `npm run db:seed` | Popola un panificio con dati realistici |
| `npm run db:add-admin-role` | Estende l'enum `role` con `admin` + promuove un utente esistente |
| `npm run bakery:create` | Crea un nuovo panificio + primo utente |

## Architettura

### Multi-tenant
Tutte le entità sono scopate per `bakery_id`. Un utente appartiene a un solo panificio. La registrazione è chiusa: solo l'admin crea nuovi panifici da CLI.

### Ruoli e permessi

Tre ruoli predefiniti:

| Ruolo | Casi d'uso |
|---|---|
| **admin** | Sviluppatore / proprietario dell'app. Tocca infrastruttura: prodotti, sezioni, divisori, gruppi produzione, gestione utenti, statistiche, permessi. |
| **owner** (titolare) | Gestisce clienti, ordini ricorrenti, ordini giornalieri. |
| **staff** (addetto) | Toggle "fatto" sugli articoli, lettura ordini. |

**Matrice default** (modificabile a runtime dalla UI "Permessi"):

| Azione | admin | owner | staff |
|---|---|---|---|
| Toggle "fatto" | ✓ | ✓ | ✓ |
| Lettura ordini | ✓ | ✓ | ✓ |
| Crea/modifica ordini giornalieri | ✓ | ✓ | – |
| Gestione clienti + ricorrenti | ✓ | ✓ | – |
| Prodotti, sezioni, divisori, gruppi | ✓ | – | – |
| Gestione utenti | ✓ | – | – |
| Modifica nome panetteria | ✓ | – | – |
| Statistiche | ✓ | – | – |
| Gestione permessi | ✓ | – | – |

La matrice base vive in [`lib/auth/permissions.ts`](lib/auth/permissions.ts). Frontend (`can(user, key)`) e backend (`withAuth({ require })`) usano la stessa fonte.

### Override permessi a runtime
L'admin può modificare i permessi da UI senza toccare il codice:
- **Per ruolo**: tab "Permessi → Per ruolo" in `/manage`. Es. "voglio che tutti gli owner vedano le statistiche".
- **Per utente**: tab "Permessi → Per utente". Forza on/off un permesso per un singolo utente.

Persistenza:
- `role_permission_overrides` (bakery_id, role, permission, allowed)
- `user_permission_overrides` (user_id, permission, allowed)

I permessi effettivi sono calcolati al login e cristallizzati nel JWT → **dopo una modifica l'utente coinvolto deve fare logout/login**.

Lock-out protection: il backend rifiuta una modifica se rimarrebbe nessun utente con `permissions:manage` effettivo nel panificio.

### Promuovere un utente a admin (su DB esistente)
```bash
npm run db:add-admin-role
```
Estende l'enum `role` (idempotente) e propone di promuovere un utente esistente. Poi:
```bash
npm run db:push  # crea le tabelle override
```
Logout/login per ricevere il nuovo JWT.

### Schema DB
Schema in [`lib/db/schema.ts`](lib/db/schema.ts). Tabelle principali:
- `bakeries`, `users` — tenant + auth
- `sections`, `products`, `customers` — anagrafiche
- `recurring_orders` + `recurring_order_items` — template ricorrenti per clienti fissi
- `daily_orders` + `daily_order_items` — ordini per data
- `daily_item_status` — override per-data del `done` su item ricorrenti (evita di mutare il template)
- `divisors` — divisori per il calcolo dei totali
- `production_groups` + `production_group_sections` — gruppi configurabili per la vista produzione
- `role_permission_overrides`, `user_permission_overrides` — override permessi a runtime

### API
Route Handlers in [`app/api/`](app/api/). Pattern comune: ogni handler passa da `withAuth()` ([lib/api/handler.ts](lib/api/handler.ts)) che valida sessione + permesso + Zod input.
