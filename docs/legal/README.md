# Documentazione legale

Documenti predisposti per l'applicazione (gestionale panificio), modello **single-tenant**:
il panificio è **Titolare del trattamento** dei dati.

| Documento | Scopo |
|---|---|
| [privacy-policy.md](privacy-policy.md) | Informativa GDPR (artt. 13–14) |
| [cookie-policy.md](cookie-policy.md) | Informativa cookie/storage (Linee guida Garante 2021) |
| [termini-e-condizioni.md](termini-e-condizioni.md) | Regole d'uso, licenza, limitazioni |
| [disclaimer.md](disclaimer.md) | Esclusione garanzie e limitazione responsabilità |

---

## ⚠️ Avvertenza

Questi testi sono **bozze tecniche, non consulenza legale**. Prima della pubblicazione
vanno **validati da un avvocato / consulente privacy / DPO**. Il loro contenuto riflette
l'architettura dell'app alla data di redazione; **ogni nuovo servizio/tracker richiede un aggiornamento.**

## Segnaposto da compilare

Cerca e sostituisci i campi tra virgolette caporali `«...»` in tutti i file:

- `«Nome dell'applicazione»`
- `«Ragione sociale del panificio»` / titolare / fornitore / titolare dei diritti
- `«Via, numero civico, CAP, Città (Prov.)»` — sede legale
- `«P.IVA / C.F.»`
- `«email@panificio.it»` — e-mail di contatto / per richieste privacy
- `«pec@panificio.it»` — PEC (se disponibile)
- `«numero di telefono»`
- `«Città del Titolare»` — foro competente
- `«GG/MM/AAAA»` — data ultimo aggiornamento
- Periodi di conservazione (log, ordini storici) — punto 7 della Privacy Policy
- DPO — solo se nominato (di norma non obbligatorio per un piccolo panificio)

## Da verificare a livello di fornitori (Privacy Policy §5–6)

L'elenco dei responsabili esterni riflette lo stack attuale: **Neon** (database),
**Vercel** (hosting + analytics), **Cloudflare** (eventuale tunnel). Aggiornarlo se cambia:
in caso di **self-hosting** del DB (server locale del panificio) rimuovere Neon e indicare
l'infrastruttura effettiva.

## Pubblicazione nell'app

Per renderli accessibili dall'app (richiesto dalla normativa: l'informativa dev'essere
facilmente reperibile), valuta di esporli come pagine pubbliche, es. `/privacy`, `/cookie`,
`/termini`, con link nel footer del login e nel menu. Vedi anche
[`docs/cookie-banner-plan.md`](../cookie-banner-plan.md) per il banner informativo leggero
coerente con lo stato attuale (solo cookie tecnici → basta informativa + avviso una tantum).
