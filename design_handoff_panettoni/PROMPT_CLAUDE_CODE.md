Leggi design_handoff_panettoni/README.md e apri design_handoff_panettoni/Panettoni.dc.html come riferimento.

Implementa la sezione Panettoni in questo repo seguendo il README:
- usa i pattern esistenti (App Router, shadcn/ui, Tailwind, store/persistenza degli ordini, lib/auth/permissions.ts)
- non modificare il comportamento delle pagine esistenti; aggiungi solo la voce "Panettoni" nella TopNav
- metti l'algoritmo buildPlan in lib/panettoni/plan.ts con test unitari
- lavora a fasi e fermati dopo ognuna per farmi verificare:
  1) modello dati + persistenza + permessi
  2) layout sezione + Tabella ordini (stati, tocco/doppio tocco/pressione lunga, archivio + toast)
  3) dialog Nuovo ordine
  4) Totali + Archivio
  5) Pianificazione (algoritmo + UI)
  6) Produzione collegata al piano confermato
Prima di scrivere codice, proponimi il piano dei file che toccherai.
