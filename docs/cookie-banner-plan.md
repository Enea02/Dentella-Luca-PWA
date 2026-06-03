# Piano — Banner cookie / consenso

> Stack di riferimento: Next.js 16 (App Router), NextAuth v5 (Credentials, sessione JWT),
> SWR con cache localStorage, Service Worker Serwist, `@vercel/analytics`, hosting Vercel
> (o self-host `next start`). App **B2B multi-tenant dietro login** (gestionale panificio),
> usata da titolare + staff.
>
> Vincolo: **costo zero** (no SaaS a pagamento tipo iubenda/Cookiebot), coerenza con
> l'architettura e la UI esistenti (Tailwind v4 + Radix/shadcn).
>
> ⚠️ Questo documento è un'analisi tecnica, **non consulenza legale**. Per la pubblicazione
> definitiva far validare l'informativa a chi di dovere.

---

## 1. Stato attuale — cosa usa *davvero* l'app

Inventario reale di cookie e storage (verificato sul codice):

| Cosa | Tipo | Finalità | Consenso richiesto? |
|---|---|---|---|
| `authjs.session-token` (`__Secure-…` in prod) | Cookie tecnico | Tiene la sessione di login (JWT) | ❌ No (strettamente necessario) |
| `authjs.csrf-token` (`__Host-…`) | Cookie tecnico | Protezione CSRF di Auth.js | ❌ No |
| `authjs.callback-url` | Cookie tecnico | Redirect post-login | ❌ No |
| `localStorage['swr-cache']` | Storage funzionale | Cache dati di riferimento (prodotti/clienti) per velocità/offline | ❌ No (funzionale) |
| Cache Storage SW (`api-reference-data`, `api-orders`, `static-assets`, precache…) | Storage funzionale | PWA offline / performance (Serwist) | ❌ No (funzionale) |
| **Vercel Web Analytics** (`/_vercel/insights`) | Analitico **cookieless** | Conteggio visite aggregato, anonimo, no cross-site | ❌ Generalmente no (vedi §2) |
| Font Geist (`next/font/google`) | — | **Self-hostati a build time** → nessuna richiesta a Google a runtime, nessun cookie terze parti | ❌ Nessuno |

**Conclusione:** ad oggi l'app **non usa cookie di profilazione né tracker di terze parti**.
Solo cookie tecnici + storage funzionale + analytics cookieless. Questo è il fatto che
dimensiona tutto il resto.

---

## 2. Cosa richiede la normativa (IT/EU), in breve

Riferimenti: ePrivacy (Dir. 2002/58/CE), GDPR, **Linee guida cookie del Garante (10/06/2021,
in vigore da gennaio 2022)**.

- **Cookie tecnici e funzionali** → **nessun consenso**, basta l'**informativa** (cookie policy).
- **Cookie analitici** → niente consenso **solo se** anonimizzati, first-party, senza
  incrocio con altri dati e con IP mascherato. **Vercel Analytics è cookieless e anonimo**,
  e Vercel lo dichiara utilizzabile senza consenso; va comunque **menzionato nell'informativa**.
- **Cookie di profilazione / marketing / terze parti** (Google Analytics 4, Meta Pixel,
  ad-tech…) → **consenso preventivo** con banner: pari dignità tra *Accetta* e *Rifiuta*,
  possibilità di scelta granulare, scriptr bloccati finché non si acconsente.

**Implicazione per questa app:** per com'è **oggi**, l'obbligo è solo l'**informativa** +
(buona prassi) un **banner informativo leggero**. Un banner di **consenso pieno** diventa
necessario **se/quando** aggiungi un tracker reale (GA4, Pixel, ecc.).

---

## 3. Opzioni

### A. Banner informativo minimale (allineato allo stato attuale)

Avviso una tantum in fondo alla pagina: "Usiamo solo cookie tecnici e statistiche anonime"
+ link alla **Cookie Policy** + bottone *Ho capito*. La chiusura è salvata localmente.

| Pro | Contro |
|---|---|
| Proporzionato ai cookie reali (tutti tecnici/funzionali) | Non gestisce un eventuale futuro tracker |
| Zero dipendenze, zero costo, UX non invasiva | Percepito da alcuni come "meno completo" |
| Coerente con un tool interno dietro login | — |

**Verdetto.** Giusto **adesso**. Copre l'obbligo informativo senza attrito.

### B. Banner di consenso con categorie (opt-in granulare)

Categorie: **Necessari** (sempre attivi) · **Analitici** (opt-in) · *(Marketing, se servirà)*.
*Accetta tutti* / *Rifiuta* / *Preferenze*. I non-essenziali (es. `<Analytics/>`) vengono
caricati **solo dopo** consenso. Scelta versionata e ri-richiesta se cambiano i cookie.

| Pro | Contro |
|---|---|
| A prova di futuro: pronto per GA4/Pixel | Più codice e più UI per qualcosa che oggi non serve |
| Conforme anche nel caso peggiore | Attrito utente su un gestionale interno |
| Gate pulito su `@vercel/analytics` | Vercel Analytics di per sé non lo richiederebbe |

**Verdetto.** Da adottare **quando** introdurrai tracker non tecnici. Si può predisporre la
struttura ora e attivarla dopo.

### C. Libreria / servizio

- **Self-hosted gratis**: `vanilla-cookieconsent`, `react-cookie-consent` — leggere, ok ma
  aggiungono una dipendenza per qualcosa di banale in questo contesto.
- **SaaS gestiti**: iubenda, Cookiebot, Usercentrics — generazione automatica
  informativa/scan, ma **a pagamento** → fuori dal vincolo "costo zero".

**Verdetto.** Per questa app, **hand-rolled** (componente nostro) batte sia libreria sia SaaS:
i cookie sono pochissimi e li conosciamo tutti.

---

## 4. Raccomandazione

Dato che l'app è **dietro login** e usa **solo cookie tecnici + analytics cookieless**:

1. **Adesso:** **Opzione A** — banner informativo leggero, self-hosted, montato globalmente
   (compare anche su `/login`) + **pagina Cookie Policy**. Tieni `<Analytics/>` (cookieless,
   consent-free) ma **menzionalo** nell'informativa.
2. **Predisponi** la scelta come oggetto versionato (`{ version, choice, ts }`) così passare
   alla **Opzione B** (categorie + gate) sarà incrementale, non una riscrittura.
3. **Attiva la Opzione B** solo nel momento in cui aggiungi un tracker di profilazione.

Right-sized: conforme oggi, pronto per domani, zero costi e zero dipendenze.

---

## 5. Design e implementazione (specifico per questo progetto)

- **Componente**: `components/cookie/CookieBanner.tsx` (`'use client'`). Card fissa in basso,
  palette `slate`, angoli arrotondati e bottoni shadcn/Radix già presenti — stile coerente con
  login e UI. Non bloccante (è un tool interno), `z-index` sopra il contenuto ma sotto i dialog.
- **Montaggio**: in `app/layout.tsx` (root), accanto a `<Toaster/>`, così appare sia su
  `/login` sia nell'app. È un client component dentro un layout server: ok.
- **Stato/persistenza**: chiave `localStorage['cookie-consent']` = `{ version, choice: 'accepted'|'rejected'|'info-ack', ts }`.
  Niente Zustand: `useState` + `useEffect` SSR-safe (guardia `typeof window`). Il banner è
  nascosto se esiste un consenso con `version` corrente.
- **Versionamento**: costante `CONSENT_VERSION` (es. `1`). Se cambi i cookie, incrementi →
  il banner ricompare.
- **Gate analytics (per Opzione B)**: estrarre `<Analytics/>` in un wrapper client
  `components/cookie/AnalyticsGate.tsx` che monta `@vercel/analytics` solo se
  `choice === 'accepted'`. (Per la Opzione A si lascia com'è e si dichiara nell'informativa.)
- **Cookie Policy**: `app/(public)/cookie-policy/page.tsx` (pubblica, raggiungibile pre-login)
  con la tabella del §1. Link dal banner e dal footer/login.
- **i18n**: testi in italiano.
- **Accessibilità**: `role="dialog"`/`aria-live`, focus gestito, bottoni con label chiare.

---

## 6. File riassunto

### Da creare
| File | Scopo |
|---|---|
| `components/cookie/CookieBanner.tsx` | Banner + logica consenso (localStorage, versionato) |
| `app/(public)/cookie-policy/page.tsx` | Informativa cookie (tabella §1) |
| `components/cookie/AnalyticsGate.tsx` | *(solo Opzione B)* monta `<Analytics/>` dietro consenso |
| `lib/cookie-consent.ts` | *(opz.)* helper tipi/lettura/scrittura consenso |

### Da modificare
| File | Cosa cambia |
|---|---|
| `app/layout.tsx` | Montare `<CookieBanner/>`; *(Opzione B)* sostituire `<Analytics/>` con `<AnalyticsGate/>` |
| `app/(public)/login/page.tsx` | *(opz.)* link "Cookie Policy" in fondo alla card |

---

## 7. Checklist implementativa

### Opzione A (consigliata ora)
- [ ] `CookieBanner.tsx` con persistenza `localStorage['cookie-consent']` versionata
- [ ] Montaggio in `app/layout.tsx`
- [ ] Pagina `/cookie-policy` con tabella cookie del §1
- [ ] Link alla policy nel banner e nel login
- [ ] Verifica: il banner compare 1 volta, sparisce dopo *Ho capito*, riappare se cambi `CONSENT_VERSION`
- [ ] Verifica: non rompe la PWA/installazione né i dialog Radix (z-index)

### Opzione B (quando aggiungi tracker non tecnici)
- [ ] Categorie Necessari/Analitici (+Marketing) con *Accetta/Rifiuta/Preferenze*
- [ ] `AnalyticsGate` monta `<Analytics/>` solo su consenso analitico
- [ ] Nessuno script non-essenziale prima del consenso
- [ ] Re-prompt al cambio di `CONSENT_VERSION`

---

## 8. Anti-pattern da evitare

- **"Continuando a navigare accetti"** / consenso implicito → non valido (Garante 2021).
- **Cookie wall** che blocca l'uso finché non accetti (salvo alternativa equivalente).
- **Pre-spunte** sulle categorie non necessarie.
- **"Rifiuta" nascosto** o meno accessibile di "Accetta" → serve **pari dignità**.
- **Mettere i cookie tecnici dietro consenso** (sono esenti: bloccarli rompe e basta).
- **Caricare `<Analytics/>`/tracker prima** del consenso (solo in Opzione B; in A è ammesso perché cookieless).

---

## 9. Contenuto minimo dell'informativa (Cookie Policy)

Per ogni voce: **nome/categoria · finalità · tipo (tecnico/funzionale/analitico) · durata · titolare/terza parte**. Vedi tabella §1. Aggiungere: titolare del trattamento, base giuridica, come revocare/cancellare (svuotare storage dal browser), link alla privacy policy.

---

## Riferimenti

- Garante Privacy — [Linee guida cookie e altri strumenti di tracciamento (2021)](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876)
- EDPB — [Guidelines on consent](https://edpb.europa.eu/)
- Vercel — [Web Analytics & privacy (cookieless)](https://vercel.com/docs/analytics/privacy-policy)
- Next.js — [`next/font` (self-hosting automatico dei font)](https://nextjs.org/docs/app/api-reference/components/font)
- Auth.js v5 — [Cookies](https://authjs.dev/)
