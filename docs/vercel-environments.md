# Gestione ambienti Test e Main su Vercel

Guida pratica per il progetto **Dentella-Luca PWA** (Next.js 16 + Drizzle + Postgres Neon + Auth.js v5).

> Stato attuale: progetto Vercel `dentella-luca` (`prj_GGpu5V22Avu6tq4JDOPMuHS0CZ9o`) collegato al repo, branch `main` e `test`, **un solo database Neon**.

---

## 1. Come Vercel separa gli ambienti

Vercel ha **tre ambienti** nativi, non legati ai branch git ma alle variabili e ai deploy:

| Ambiente       | Quando viene usato                                                                        | Dominio tipico                                  |
|----------------|-------------------------------------------------------------------------------------------|-------------------------------------------------|
| **Production** | Push su "Production Branch" (di default `main`) o `vercel deploy --prod`                  | Dominio personalizzato + `dentella-luca.vercel.app` |
| **Preview**    | Push su qualsiasi altro branch (incluso `test`) o PR                                      | `dentella-luca-git-<branch>-<team>.vercel.app`  |
| **Development**| `vercel dev` o `next dev` in locale                                                       | `localhost:3000`                                |

Le **Environment Variables** in Vercel sono valorizzate **per ambiente**: la stessa chiave (es. `DATABASE_URL`) può avere tre valori diversi.

---

## 2. Strategia consigliata: 1 progetto, 2 branch

Per questo progetto la strategia più semplice e mantenibile è:

- **1 solo progetto Vercel** (`dentella-luca`)
- **Production Branch = `main`** → deploy automatico su dominio principale
- **Preview Branch = `test`** → deploy automatico su URL preview stabile
- (Opzionale) Custom domain alias per Preview, es. `test.tuo-dominio.it`

### Vantaggi
- Niente duplicazione di env vars critiche
- Un solo place per analytics, log, domini
- Promotion `test` → `main` = semplice merge git

### Quando passare a 2 progetti
- Hai bisogno di team/permessi separati
- Vuoi un dominio Production indipendente per il "test live" (cliente che testa con dati reali)
- Quotidiano di feature flag/A-B test molto diverso

---

## 3. Configurare il Production Branch

Da dashboard Vercel:

1. **Project Settings → Git → Production Branch** → imposta `main`
2. **Settings → Git → Ignored Build Step** (opzionale) → lascia vuoto per buildare ogni push
3. Verifica che `test` **non** sia marcato come Production Branch

Da CLI (alternativa):
```bash
vercel git connect          # se non già collegato
vercel project ls
```

Risultato:
- Push su `main` → deploy in **Production**
- Push su `test` → deploy in **Preview** (URL stabile: `dentella-luca-git-test-<team>.vercel.app`)

---

## 4. Variabili d'ambiente: cosa configurare

Il codice usa queste variabili (riferimento: [auth.config.ts](../auth.config.ts), [lib/db/client.ts](../lib/db/client.ts), [.env.example](../.env.example)):

| Variabile          | Required | Per Production    | Per Preview       | Per Development   |
|--------------------|:--------:|-------------------|-------------------|-------------------|
| `DATABASE_URL`     | ✅       | DB prod           | DB test (vedi §5) | DB locale/dev     |
| `AUTH_SECRET`      | ✅       | random 32 byte    | random 32 byte    | random 32 byte    |
| `AUTH_TRUST_HOST`  | ✅       | `true`            | `true`            | `true`            |
| `AUTH_URL`         | 🟡       | `https://dominio` | URL preview alias | `http://localhost:3000` |
| `NODE_ENV`         | auto     | (gestito Vercel)  | (gestito Vercel)  | —                 |

> ⚠️ **`AUTH_SECRET` deve essere diverso fra Production e Preview**, altrimenti i token JWT emessi su test sarebbero validi anche in produzione (e viceversa).

Genera un secret nuovo:
```bash
openssl rand -base64 32
```

### Configurazione da CLI

```bash
# Production
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production
vercel env add AUTH_TRUST_HOST production   # valore: true
vercel env add AUTH_URL production          # https://dentella-luca.it

# Preview (branch test)
vercel env add DATABASE_URL preview
vercel env add AUTH_SECRET preview
vercel env add AUTH_TRUST_HOST preview      # valore: true
vercel env add AUTH_URL preview             # https://test.dentella-luca.it (se hai alias)

# Development (per chi usa `vercel dev`)
vercel env add DATABASE_URL development
vercel env add AUTH_SECRET development
vercel env add AUTH_TRUST_HOST development
```

### Sincronizzare in locale
```bash
pnpm run vercel:env:pull       # scarica il set "development" in .env.local
vercel env pull --environment=preview .env.preview.local    # opzionale
```

---

## 5. Database: come gestire un solo DB (e come evolvere)

Hai **un solo Neon DB**. Tre scenari, in ordine di rischio crescente.

### Scenario A — Stesso DB per Production e Preview (situazione attuale)

✅ Zero costo aggiuntivo, schema sempre allineato.
❌ Test e Prod **scrivono sugli stessi dati**: ogni esperimento su `test` impatta i clienti reali.
❌ Una `db:push` lanciata da macchina test può cambiare lo schema della prod.

**Regole di sopravvivenza se resti su un solo DB:**
1. **MAI** eseguire `pnpm db:push` dal branch `test` puntando al DB prod. Usa solo `db:generate` + `db:migrate` con migrations versionate.
2. Le modifiche allo schema partono **sempre da `main`** dopo merge.
3. Non lanciare `pnpm db:seed` su DB condiviso (cancella/sovrascrive dati).
4. Per i test distruttivi, crea un secondo panificio (`bakery_id` diverso) tramite `pnpm bakery:create` → tutti i dati sono già scopati per `bakeryId` (vedi [README.md](../README.md#multi-tenant)).
5. Considera l'opzione di leggere i preview con **un utente diverso** (panificio "test").

### Scenario B — Neon Branching (consigliato, gratis)

Neon supporta il **branching del database** in stile git: copia istantanea, copy-on-write, gratis nel piano free.

1. Console Neon → progetto → **Branches → Create branch** → nome `test` (da `main`)
2. Copia la connection string del branch `test`
3. In Vercel: aggiorna `DATABASE_URL` **solo nell'ambiente Preview** con la nuova stringa
4. Le migration vanno applicate **due volte**: una sul branch `main` (DB prod) e una sul branch `test`

**Workflow tipico:**
```bash
# dopo aver modificato lib/db/schema.ts
pnpm db:generate                                # crea SQL migration
git add lib/db/migrations && git commit -m "feat: schema X"
git push origin test                            # deploy preview

# applica su DB test
DATABASE_URL=$NEON_TEST_URL pnpm db:migrate

# QA su preview...

git checkout main && git merge test && git push
# applica su DB prod (post-deploy o via script)
DATABASE_URL=$NEON_PROD_URL pnpm db:migrate
```

Vantaggio extra: **reset rapido** del branch test (`neon branches reset test --parent`) → ritorni allo stato di prod in 1 comando.

### Scenario C — Due progetti Neon completamente separati

Se vuoi separazione totale (anche di credenziali, billing, region):
- Crea un secondo progetto Neon `dentella-luca-test`
- Imposta `DATABASE_URL` Preview su questo nuovo DB
- Gestisci i seed di test in autonomia

Costo: il piano free Neon copre più progetti, ma raddoppia il setup.

---

## 6. Workflow git ↔ deploy

```
                        ┌─────────────────────────┐
   feature branch ───►  │   Pull Request → test   │  Preview deploy automatico
                        └────────────┬────────────┘
                                     │  (QA su preview URL)
                                     ▼
                        ┌─────────────────────────┐
                        │  merge `test` → `main`  │  Production deploy automatico
                        └─────────────────────────┘
```

Operativamente:

```bash
# 1. lavoro nuovo
git checkout -b feat/qualcosa
# ... commit
git push origin feat/qualcosa
# → Vercel crea un deploy Preview dedicato per il branch

# 2. quando è pronto per QA
git checkout test
git merge feat/qualcosa
git push origin test
# → aggiorna l'URL Preview "stabile" del branch test

# 3. quando passa QA
git checkout main
git merge test
git push origin main
# → deploy in Production
```

> 💡 Se vuoi che **solo** i merge a `test` finiscano in Preview (e non tutti i feature branch), imposta su Vercel: **Settings → Git → Deploy Hooks/Ignored Build Step** con uno script che skippa i branch non in `[test, main]`.

---

## 7. Migration DB su Vercel

Vercel build è **stateless**: non eseguire migration nel `build`. Due strade:

### A. Migration manuali (consigliato per ora)
Lancia da locale prima del deploy prod:
```bash
DATABASE_URL=$PROD_URL pnpm db:migrate
git push origin main
```

### B. Migration in deploy hook
Aggiungi uno script post-deploy via GitHub Actions o un endpoint protetto `/api/admin/migrate`. Non lo metterei nel `build` di Vercel: i tempi di build aumentano e un fallimento blocca il deploy.

**Mai usare `db:push` in produzione**: confronta schema → DB e applica modifiche distruttive senza migration file. È un tool da dev.

---

## 8. Domini e Auth.js

Auth.js v5 valida i redirect rispetto all'host:

- `AUTH_TRUST_HOST=true` è già richiesto in tutti gli ambienti non-localhost
- Per i Preview con URL dinamici (`...git-test-team.vercel.app`), `AUTH_TRUST_HOST=true` basta
- Se assegni un **alias custom** al Preview (es. `test.dentella-luca.it`), imposta `AUTH_URL=https://test.dentella-luca.it` nell'env Preview per cookie/redirect stabili

Assegna un alias Preview:
```bash
# aggiungi il dominio al progetto, poi:
vercel alias set <deployment-url> test.dentella-luca.it
```
Oppure da dashboard: **Settings → Domains → Add → "Preview" environment, branch `test`**.

---

## 9. Checklist iniziale

- [ ] Production Branch su Vercel impostato a `main`
- [ ] `DATABASE_URL` configurato in Production (e Preview, se userai Scenario B/C)
- [ ] `AUTH_SECRET` **diverso** in Production vs Preview
- [ ] `AUTH_TRUST_HOST=true` su entrambi gli ambienti
- [ ] (Se userai dominio custom) `AUTH_URL` valorizzato per Production e Preview
- [ ] Branch `test` pushato → verifica che Vercel generi un Preview deploy
- [ ] Login funzionante sia su URL Production sia sul Preview di `test`
- [ ] Decidere quando passare a Neon branching (Scenario B) per evitare contaminazione dati

---

## 10. Comandi rapidi

```bash
# Deploy esplicito (di solito non serve: ci pensa Git)
pnpm deploy:preview            # vercel deploy
pnpm deploy:prod               # vercel deploy --prod

# Sincronizza env in locale
pnpm vercel:env:pull           # vercel env pull .env.local

# Log live
pnpm vercel:logs               # vercel logs

# Lista env per ambiente
vercel env ls production
vercel env ls preview
vercel env ls development

# Rimuovi una variabile
vercel env rm DATABASE_URL preview
```

---

## 11. Riepilogo decisioni da prendere

| Decisione                                  | Suggerimento                                       |
|--------------------------------------------|----------------------------------------------------|
| 1 progetto Vercel o 2?                     | **1 progetto**, branch `main` + `test`             |
| 1 DB o 2 DB?                               | Oggi 1, **muovi a Neon Branching appena possibile**|
| `AUTH_SECRET` condiviso?                   | **No**, uno per ambiente                           |
| Migration nel build?                       | **No**, eseguile manualmente (o via Actions)       |
| Seed su Preview?                           | Solo se DB separato (Scenario B/C)                 |
| Custom domain per Preview?                 | Comodo per QA cliente; non obbligatorio            |
