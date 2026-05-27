# Analisi — Recupero password gratuito

> Stack di riferimento: Next.js 16 + NextAuth v5 (Credentials), Drizzle + Postgres,
> hash bcrypt (`users.password_hash`), tenancy per `bakeryId`, ruoli `admin / owner / staff`,
> hosting Vercel (piano Hobby).
>
> Vincolo: **costo zero** in fase iniziale, mantenendo un livello di sicurezza accettabile
> per un'app gestionale multi-tenant.

---

## 1. Stato attuale

- Login solo con `email + password` ([auth.ts:14-79](../auth.ts#L14-L79))
- Nessun flusso di reset: se l'utente perde la password **non può rientrare** se non con
  intervento manuale sul DB.
- Schema `users` non ha colonne per token di reset né per email verificata
  ([lib/db/schema.ts:32-47](../lib/db/schema.ts#L32-L47)).
- Esistono già i ruoli `admin / owner` che possono fare azioni privilegiate sui membri
  della propria `bakeryId` → leva utile per un reset gestito dall'organizzazione.

---

## 2. Opzioni gratuite

### A. Reset gestito da admin/owner (zero infra)

**Come funziona.** L'utente contatta il proprio `owner` (o un `admin` globale). Da una
pagina nella sezione *Manage* l'owner clicca *"Reimposta password"* → il sistema genera
una password temporanea (es. 12 caratteri), la mostra **una sola volta** all'owner, e
forza l'utente a cambiarla al primo login (`mustChangePassword = true`).

| Pro | Contro |
|---|---|
| Costo zero, zero dipendenze esterne | Richiede contatto fuori-banda (telefono, di persona) |
| Sfrutta i ruoli esistenti | Non scala se l'owner stesso perde la password |
| Audit naturale (chi ha resettato chi) | UX meno moderna |
| Adatto al contesto multi-tenant *piccolo* | Serve un meccanismo separato per gli `admin` globali |

**Schema delta:** aggiungere `mustChangePassword: boolean` su `users`.

**Verdetto.** Eccellente come **primo livello**. Copre l'80% dei casi reali in un'app B2B
con poche decine di utenti per tenant.

---

### B. Magic link / token di reset via email — provider gratuiti

**Come funziona.** L'utente inserisce l'email → il sistema genera un token random,
ne salva **l'hash** in DB con scadenza (15-30 min), invia un link
`https://app/.../reset?token=...`. Cliccando, l'utente imposta una nuova password.

#### Provider email con tier gratuito (aggiornato 2025/2026)

| Provider | Free tier | Limite chiave | Note |
|---|---|---|---|
| **Resend** | 3.000 email/mese, 100/giorno | Dominio custom serve verifica DNS | API pulita, SDK first-class Next.js. **Scelta consigliata.** |
| **Brevo (ex Sendinblue)** | 300 email/giorno (~9.000/mese) | Branding "powered by Brevo" nel footer free | Limite giornaliero più alto di Resend |
| **MailerSend** | 3.000 email/mese | Dominio condiviso solo per trial | Pulito, buona deliverability |
| **Plunk** | 3.000 email/mese | Open source, self-hostable | Alternativa OSS se vuoi controllo |
| **Amazon SES** | 3.000 email/mese (solo se invii da EC2) | Da fuori EC2 non è free | Sconsigliato per questo stack |
| **Gmail SMTP** | ~500 al giorno | TOS Google vieta uso transazionale "di massa" | **Evitare** in produzione |

**Costo reale per questa app.** Con 50 utenti per tenant, anche 10 tenant, un reset
medio per utente all'anno = ~500 email/anno. Qualsiasi tier gratuito è abbondante.

**Schema delta:**
```ts
export const passwordResets = pgTable('password_resets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),           // SHA-256 del token raw
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  requestedIp: text('requested_ip'),
}, (t) => [index('pwreset_user_idx').on(t.userId)])
```

**Token raw:** `crypto.randomBytes(32).toString('base64url')` → mai salvato in DB,
solo l'hash. Il link contiene il token raw.

| Pro | Contro |
|---|---|
| UX standard, gli utenti lo conoscono | Dipende dal provider (deliverability, dominio verificato) |
| Self-service, niente intervento operativo | Email non è strong-auth (chiunque acceda alla casella entra) |
| Compatibile con piano Hobby Vercel | Serve gestire bene rate-limiting e enumeration |

**Verdetto.** Standard de-facto. Si combina bene con **A** come secondo livello.

---

### C. OAuth come fallback (Google / GitHub / Microsoft)

**Come funziona.** Aggiungere `Google` come secondo provider in NextAuth. Se l'utente
esiste con la stessa email (verificata da Google), può entrare senza password e poi
impostarne una nuova.

| Pro | Contro |
|---|---|
| Completamente gratuito, no email infra | Tutti gli utenti devono avere Gmail/account corrispondente |
| Sicurezza alta (MFA a carico di Google) | Mappatura account: rischio account-takeover se l'email non è davvero "loro" |
| Riduce drasticamente i reset richiesti | Complica il modello multi-tenant (a quale `bakeryId` lo associo al primo login?) |

**Verdetto.** Buona **opzione aggiuntiva**, non sostituiva. Da considerare se gli
utenti dello studio hanno già Google Workspace.

---

### D. Recovery codes generati al primo login

**Come funziona.** Alla creazione dell'utente (o al primo login) il sistema genera 8-10
codici monouso (`XXXX-XXXX-XXXX`), l'utente li scarica/stampa. In caso di password
dimenticata, ne inserisce uno per accedere e reimpostare la password.

| Pro | Contro |
|---|---|
| Zero dipendenze, funziona offline | Gli utenti li perdono — esperienza vista molte volte |
| Sicuro se gestiti correttamente | Educational overhead ("cosa sono questi codici?") |
| Buon fallback per gli `admin` globali | Richiede un workflow di rigenerazione |

**Verdetto.** Da introdurre **solo per ruoli `admin / owner`**, come ultima ancora di
salvezza. Sproporzionato per uno `staff`.

---

### E. Passkeys / WebAuthn

**Come funziona.** Login passwordless legato al dispositivo (Touch ID, Windows Hello,
chiave hardware). NextAuth v5 ha provider sperimentale.

| Pro | Contro |
|---|---|
| Niente password = niente reset | Maturità: provider WebAuthn di NextAuth ancora beta |
| Resistente al phishing | Lock-in al device, serve fallback di recupero comunque |
| Gratuito | Curva di adozione, utenti non tecnici si confondono |

**Verdetto.** Da tenere in roadmap, non come MVP del recovery.

---

### F. SMS / WhatsApp OTP

Tutti i provider SMS commerciali (Twilio, Vonage, MessageBird) hanno **costo per
messaggio** anche nel free trial. Whatsapp Business API idem dopo il free tier. Fuori
scope per "costo zero".

---

## 3. Anti-patterns da evitare

- **Domande di sicurezza** ("nome del primo animale") — bassa entropia, leakate ovunque,
  OWASP le sconsiglia esplicitamente.
- **Reset che invia la password in chiaro per email** — implica che la password sia in
  chiaro o reversibile lato server. La nostra è bcrypt-hashed, ottimo: mai tornare indietro.
- **Token di reset non hashati in DB** — un dump del DB diventerebbe immediatamente
  utilizzabile. Salvare sempre `sha256(token)`, mai il token raw.
- **Messaggi che rivelano se l'email esiste** ("email non trovata") — abilita user
  enumeration. Rispondere sempre con messaggio generico ("se l'email è registrata,
  riceverai un link").
- **Token riutilizzabili o senza scadenza** — sempre one-shot, TTL ≤ 30 min.
- **Reset che invalida la sessione corrente ma non le altre** — dopo un reset, ruotare
  tutte le sessioni dell'utente (NextAuth JWT: bumpare un `tokenVersion` su `users`).

---

## 4. Considerazioni di sicurezza trasversali

| Aspetto | Implementazione |
|---|---|
| **Rate limit richieste reset** | Max 3 richieste / ora / email + 10 / ora / IP. Vercel Edge KV (free 256MB) o Upstash Redis free tier. |
| **Enumeration** | Risposta sempre identica in 200ms anche se l'email non esiste. |
| **Token storage** | Solo l'hash SHA-256, mai il raw. |
| **TTL token** | 30 min default, 15 per ambienti sensibili. |
| **One-shot** | Marcare `usedAt` alla prima validazione, refiutare i successivi. |
| **Notifica all'utente** | Inviare email "la tua password è stata cambiata" all'avvenuto reset (anche se l'utente è onesto, è una traccia). |
| **Audit log** | Insert in tabella `audit_log` ad ogni reset (chi, quando, IP). |
| **Sessioni esistenti** | Dopo reset, invalidare tutti i JWT esistenti incrementando `tokenVersion`. |

---

## 5. Confronto rapido

| Opzione | Costo | Effort | UX | Sicurezza | Quando |
|---|---|---|---|---|---|
| **A.** Reset admin | €0 | S | bassa | media | Sempre, base layer |
| **B.** Email link (Resend) | €0 fino a 3k/mese | M | alta | media-alta | Default consigliato |
| **C.** OAuth Google | €0 | M | molto alta | alta | Se utenti hanno Google |
| **D.** Recovery codes | €0 | M | bassa | alta | Solo per admin/owner |
| **E.** Passkeys | €0 | L | media | molto alta | Roadmap futura |

---

## 6. Raccomandazione

**Combinazione A + B + recovery codes per gli admin** (Opzioni 1+2+4 con scope ridotto):

1. **Subito, oggi:** Opzione A. Aggiungere `mustChangePassword` allo schema, una UI in
   *Manage* per gli owner che genera password temporanee. Zero dipendenze esterne,
   risolve immediatamente il caso "utente bloccato fuori".

2. **A breve (1-2 giorni di lavoro):** Opzione B con **Resend**. Flusso completo
   `/forgot-password` → email → `/reset-password?token=...`. Free tier abbondante.
   Diventa il flusso self-service primario.

3. **In aggiunta:** generare al momento della creazione di ogni `admin / owner` un set
   di 5 recovery codes da conservare offline. Risolve il "chi resetta chi resetta gli
   admin?".

Questo stack copre il 100% degli scenari pratici per anni a venire senza spendere un
euro, ed è coerente con l'architettura multi-tenant esistente.

---

## 7. Checklist implementativa (per quando si decide di partire)

### Step 1 — Reset admin (Opzione A)
- [ ] Migration: aggiungere `must_change_password boolean default false` a `users`
- [ ] `POST /api/users/[id]/reset-password` (solo owner stessa bakery o admin globale)
- [ ] UI in *Manage* con conferma e display one-time della password generata
- [ ] Middleware: se `must_change_password = true` → redirect forzato a `/change-password`
- [ ] Audit log entry

### Step 2 — Email reset (Opzione B)
- [ ] Verificare dominio su Resend (`resend.com` → Domains → DNS records)
- [ ] `RESEND_API_KEY` come env var su Vercel (preview + production)
- [ ] Migration: tabella `password_resets`
- [ ] `POST /api/auth/forgot-password` (rate-limited, generic response)
- [ ] `POST /api/auth/reset-password` (valida token, hash nuova password, invalida sessioni)
- [ ] Email template (React Email o stringa HTML semplice)
- [ ] Email di conferma post-reset
- [ ] Test: token scaduto, già usato, formato malformato, account inesistente

### Step 3 — Recovery codes per admin/owner (opzionale)
- [ ] Migration: tabella `recovery_codes (user_id, code_hash, used_at)`
- [ ] Generazione al boot del seed e al promote di un utente a owner/admin
- [ ] UI "scarica codici" mostrata **una sola volta**
- [ ] Flusso login alternativo: `/login/recovery-code`

---

## Riferimenti

- OWASP — [Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- NextAuth v5 — [Credentials Provider](https://authjs.dev/getting-started/providers/credentials)
- Resend — [Pricing](https://resend.com/pricing) e [Next.js quickstart](https://resend.com/docs/send-with-nextjs)
- Drizzle — [Migrations](https://orm.drizzle.team/docs/migrations)
