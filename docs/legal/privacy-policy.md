# Informativa sul trattamento dei dati personali (Privacy Policy)

_ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (“GDPR”) e del D.lgs. 196/2003 come modificato dal D.lgs. 101/2018 (“Codice Privacy”)_

**Ultimo aggiornamento:** «GG/MM/AAAA»
**Applicazione:** «Nome dell'applicazione» — gestionale per panificio (ordini, produzione, clienti, statistiche)

> ⚠️ **Nota.** Il presente testo è una bozza predisposta sulla base dell'architettura tecnica dell'applicazione. Non costituisce consulenza legale. Prima della pubblicazione va validato da un professionista (avvocato / consulente privacy / DPO).

---

## 1. Titolare del trattamento

Il Titolare del trattamento è:

- **Denominazione / Ditta:** «Ragione sociale del panificio»
- **Sede legale:** «Via, numero civico, CAP, Città (Prov.)»
- **P. IVA / Codice Fiscale:** «P.IVA / C.F.»
- **E-mail:** «email@panificio.it»
- **PEC:** «pec@panificio.it» _(se disponibile)_
- **Telefono:** «numero di telefono»

Per ogni richiesta relativa al trattamento dei dati personali è possibile scrivere all'indirizzo e-mail sopra indicato.

### Responsabile della protezione dei dati (DPO)

«Il Titolare non ha nominato un DPO, non sussistendone l'obbligo ai sensi dell'art. 37 GDPR.»
_oppure, se nominato:_ «DPO: nome e contatto».

---

## 2. Tipologie di dati trattati e categorie di interessati

L'applicazione è un gestionale ad uso interno del panificio, accessibile esclusivamente previa autenticazione. Tratta le seguenti categorie di dati:

### a) Utenti/operatori dell'applicazione (amministratore, titolare, personale)
- Indirizzo e-mail (usato come credenziale di accesso)
- Nome (facoltativo)
- Password in forma di **hash cifrato** (la password in chiaro non viene mai memorizzata)
- Ruolo e permessi all'interno dell'applicazione
- Dati tecnici di sessione e log di accesso

### b) Clienti del panificio
- Nome / denominazione del cliente
- Tipologia (cliente fisso / occasionale) e stato (attivo/non attivo)
- Dati relativi agli ordini ad essi associati (prodotti, quantità, date, ricorrenze)

L'applicazione **non è progettata per trattare categorie particolari di dati** (art. 9 GDPR — dati sulla salute, convinzioni, ecc.) né dati di pagamento. Si invita a **non inserire** nei campi liberi (es. nome cliente, varianti prodotto) dati eccedenti o categorie particolari di dati personali.

---

## 3. Finalità e base giuridica del trattamento

| Finalità | Base giuridica (art. 6 GDPR) |
|---|---|
| Gestione degli accessi e autenticazione degli operatori | Esecuzione di obblighi contrattuali/di lavoro e legittimo interesse del Titolare alla sicurezza del sistema (art. 6.1 lett. b/f) |
| Gestione di ordini, produzione, anagrafica clienti e statistiche interne | Legittimo interesse del Titolare alla gestione della propria attività d'impresa e/o esecuzione del rapporto con il cliente (art. 6.1 lett. f/b) |
| Garanzia di sicurezza, integrità e corretto funzionamento del sistema (log) | Legittimo interesse del Titolare (art. 6.1 lett. f) |
| Adempimento di obblighi di legge (es. fiscali, contabili, ove applicabili) | Obbligo legale (art. 6.1 lett. c) |
| Statistiche di utilizzo aggregate e anonime del sito (Vercel Web Analytics, cookieless) | Legittimo interesse del Titolare a misurare l'utilizzo in forma anonima (art. 6.1 lett. f) |

---

## 4. Modalità del trattamento

I dati sono trattati con strumenti elettronici e informatici, con misure tecniche e organizzative adeguate a garantirne sicurezza e riservatezza, tra cui:
- accesso all'applicazione protetto da autenticazione con credenziali individuali;
- memorizzazione delle password tramite funzioni di hashing;
- connessioni cifrate (HTTPS/TLS);
- profilazione dei permessi per ruolo (principio del privilegio minimo);
- isolamento dei dati per singolo panificio (multi-tenancy).

Il trattamento non comporta processi decisionali automatizzati o di profilazione che producano effetti giuridici sugli interessati (art. 22 GDPR).

---

## 5. Destinatari e responsabili esterni del trattamento

Per l'erogazione del servizio il Titolare si avvale di fornitori che agiscono quali **Responsabili del trattamento** (art. 28 GDPR), nominati con apposito accordo, ovvero:

| Fornitore | Servizio | Trattamento |
|---|---|---|
| **Neon, Inc.** | Hosting del database PostgreSQL | Memorizzazione dei dati dell'applicazione |
| **Vercel, Inc.** | Hosting dell'applicazione e statistiche anonime (Web Analytics cookieless) | Erogazione dell'applicazione e misurazione aggregata degli accessi |
| **Cloudflare, Inc.** _(eventuale)_ | Tunnel/infrastruttura di rete _(se attivato per il self-hosting)_ | Instradamento del traffico |

> ⚠️ Aggiornare l'elenco in base ai fornitori effettivamente in uso. In caso di **self-hosting** del database (es. server locale del panificio), Neon va rimosso e va indicata l'infrastruttura effettiva.

I dati possono inoltre essere comunicati a soggetti la cui facoltà di accesso è prevista da norme di legge (es. autorità giudiziaria, organi di controllo). I dati **non sono diffusi né ceduti a terzi** per finalità di marketing.

---

## 6. Trasferimento dei dati extra-UE

Alcuni fornitori (es. Neon, Vercel, Cloudflare) sono società con sede negli Stati Uniti. Eventuali trasferimenti di dati al di fuori dello Spazio Economico Europeo avvengono in presenza di garanzie adeguate ai sensi degli artt. 44 ss. GDPR, quali le **Clausole Contrattuali Tipo** (Standard Contractual Clauses) approvate dalla Commissione Europea e/o l'adesione al **Data Privacy Framework UE-USA**, ove applicabile. È possibile richiedere copia delle garanzie adottate scrivendo al Titolare.

---

## 7. Periodo di conservazione

| Dato | Conservazione |
|---|---|
| Account operatori | Per la durata del rapporto di lavoro/collaborazione; cancellati o anonimizzati alla cessazione, salvo obblighi di legge |
| Anagrafica clienti e ordini | Per il tempo necessario alla gestione dell'attività; gli ordini storici sono conservati per finalità gestionali/statistiche e per gli eventuali termini fiscali e civilistici applicabili («es. 10 anni» ove pertinente) |
| Log tecnici e di accesso | «Indicare periodo, es. 6–12 mesi» |
| Statistiche anonime di utilizzo | In forma aggregata e anonima, non riconducibile a singoli interessati |

Al termine dei periodi indicati i dati sono cancellati o resi anonimi in modo irreversibile.

---

## 8. Diritti degli interessati

Gli interessati possono esercitare, nei limiti di legge, i seguenti diritti (artt. 15–22 GDPR):
- **accesso** ai propri dati;
- **rettifica** dei dati inesatti;
- **cancellazione** (“diritto all'oblio”);
- **limitazione** del trattamento;
- **portabilità** dei dati;
- **opposizione** al trattamento fondato sul legittimo interesse;
- **revoca del consenso**, ove il trattamento si fondi sul consenso, senza pregiudizio per la liceità del trattamento effettuato prima della revoca.

Le richieste vanno indirizzate al Titolare ai recapiti indicati al punto 1. Il Titolare risponde entro **un mese** dalla ricezione, prorogabile di due mesi in caso di particolare complessità.

### Reclamo all'Autorità di controllo
L'interessato ha diritto di proporre reclamo al **Garante per la protezione dei dati personali** (www.garanteprivacy.it) qualora ritenga che il trattamento violi il GDPR.

---

## 9. Conferimento dei dati

Il conferimento dei dati di account è **necessario** per poter accedere e utilizzare l'applicazione: il mancato conferimento rende impossibile l'utilizzo del gestionale. Il conferimento dei dati dei clienti è necessario per la gestione degli ordini.

---

## 10. Modifiche all'informativa

Il Titolare si riserva di modificare o aggiornare la presente informativa, anche in conseguenza di variazioni normative o dei servizi utilizzati. La versione aggiornata è quella pubblicata all'interno dell'applicazione con la relativa data di “Ultimo aggiornamento”.
