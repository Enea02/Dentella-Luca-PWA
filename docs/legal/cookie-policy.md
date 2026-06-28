# Cookie Policy

_Informativa sull'uso di cookie e tecnologie di memorizzazione, ai sensi dell'art. 122 del D.lgs. 196/2003, della Direttiva ePrivacy 2002/58/CE e delle Linee guida del Garante sui cookie del 10 giugno 2021._

**Ultimo aggiornamento:** «GG/MM/AAAA»
**Titolare:** «Ragione sociale del panificio» — «email@panificio.it»

> ⚠️ **Nota.** Bozza basata sull'inventario tecnico reale dell'applicazione. Non costituisce consulenza legale; far validare prima della pubblicazione.

---

## 1. Cosa sono i cookie e le tecnologie simili

I **cookie** sono piccoli file di testo che i siti visitati inviano al dispositivo dell'utente, dove vengono memorizzati per essere ritrasmessi agli stessi siti alla visita successiva. Tecnologie analoghe (es. `localStorage`, `Cache Storage` dei Service Worker) consentono di memorizzare informazioni sul dispositivo per finalità tecniche o funzionali.

Si distinguono in:
- **cookie tecnici / di sessione** — necessari al funzionamento del servizio; **non richiedono consenso**, solo informativa;
- **cookie funzionali** — migliorano l'esperienza d'uso (es. cache, modalità offline); non richiedono consenso se strettamente legati a un servizio richiesto dall'utente;
- **cookie analitici** — misurano l'utilizzo del sito; non richiedono consenso solo se anonimizzati, di prima parte e senza incrocio con altri dati;
- **cookie di profilazione / marketing / terze parti** — richiedono **consenso preventivo** tramite banner.

---

## 2. Cookie e tecnologie utilizzati da questa applicazione

L'applicazione è un gestionale **accessibile solo previo login** e **non utilizza cookie di profilazione né tracker pubblicitari di terze parti**. Di seguito l'inventario completo:

### Cookie tecnici (necessari) — nessun consenso richiesto

| Nome | Titolare | Finalità | Durata |
|---|---|---|---|
| `authjs.session-token` (`__Secure-…` in produzione) | Prima parte | Mantiene la sessione di login (token JWT) | Sessione / durata del login |
| `authjs.csrf-token` (`__Host-…`) | Prima parte | Protezione contro attacchi CSRF | Sessione |
| `authjs.callback-url` | Prima parte | Reindirizzamento corretto dopo il login | Sessione |

### Storage funzionale (tecnologie simili ai cookie) — nessun consenso richiesto

| Tecnologia | Finalità | Durata |
|---|---|---|
| `localStorage['swr-cache']` | Cache locale dei dati di riferimento (prodotti, clienti) per velocità e uso offline | Fino a cancellazione manuale / svuotamento browser |
| `Cache Storage` del Service Worker (`api-reference-data`, `api-orders`, `static-assets`, precache) | Funzionalità PWA offline e prestazioni | Gestita dal Service Worker |

### Statistiche anonime — Vercel Web Analytics (cookieless)

L'applicazione utilizza **Vercel Web Analytics**, uno strumento di statistica **senza cookie** (cookieless), che raccoglie dati **aggregati e anonimi** sul numero di visite, senza tracciamento cross-site e senza identificare i singoli utenti. Per sua natura non installa cookie sul dispositivo. Trattandosi di uno strumento anonimo, di prima parte e privo di profilazione, è utilizzato sulla base del **legittimo interesse** del Titolare.
Maggiori informazioni: https://vercel.com/docs/analytics/privacy-policy

### Font

I caratteri tipografici (Geist) sono **ospitati localmente** all'interno dell'applicazione (self-hosting a tempo di build): non vengono effettuate richieste a server di terze parti né installati cookie di terzi a runtime.

---

## 3. Cookie di profilazione e di terze parti

L'applicazione **non utilizza** cookie di profilazione, di marketing o di social network, né strumenti di analisi che incrociano i dati con altre fonti (es. Google Analytics, Meta Pixel). Per questo motivo **non è richiesto un banner di consenso**: è sufficiente la presente informativa.

> ℹ️ Qualora in futuro venissero introdotti strumenti di profilazione o tracker di terze parti, la presente policy sarà aggiornata e verrà implementato un banner di consenso conforme alle Linee guida del Garante.

---

## 4. Gestione delle preferenze e disattivazione

Poiché i cookie utilizzati sono esclusivamente **tecnici e funzionali**, la loro disattivazione può compromettere il funzionamento dell'applicazione (in particolare il login e la modalità offline).

L'utente può comunque gestire o eliminare i cookie e lo storage locale tramite le impostazioni del proprio browser:
- **Chrome:** Impostazioni → Privacy e sicurezza → Cookie e altri dati dei siti
- **Firefox:** Impostazioni → Privacy e sicurezza → Cookie e dati dei siti web
- **Safari:** Preferenze → Privacy
- **Edge:** Impostazioni → Cookie e autorizzazioni sito

---

## 5. Riferimenti e ulteriori informazioni

Per tutto quanto non espressamente indicato si rinvia alla [Informativa sul trattamento dei dati personali (Privacy Policy)](privacy-policy.md).

Per qualsiasi richiesta è possibile contattare il Titolare all'indirizzo «email@panificio.it».
