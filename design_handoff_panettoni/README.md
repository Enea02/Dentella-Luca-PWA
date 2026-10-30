# Handoff: Sezione Panettoni — Gestionale Panificio

Repo di destinazione: **Enea02/Dentella-Luca-PWA** (branch `main`)

## Overview
Nuova sezione stagionale "Panettoni" per gestire gli ordini di Natale: tabella stile Excel clienti × gusti con stati a colori, inserimento rapido ordini, totali, produzione, pianificazione automatica della produzione e archivio dei consegnati. È una sezione separata dal resto del gestionale: ci si entra dalla voce **Panettoni** nella TopNav e si torna indietro con una freccia.

## About the Design Files
`Panettoni.dc.html` è un **prototipo di design in HTML**: mostra aspetto e comportamento, **non è codice da copiare**. Il compito è **ricrearlo dentro il codebase esistente** (Next.js App Router + shadcn/ui + Tailwind, come il resto del repo), riusando componenti, pattern, store e permessi già presenti. Il prototipo contiene anche una ricreazione della pagina "Foglio" come riferimento visivo: quella **non va toccata**.

## Fidelity
**High-fidelity**: colori, tipografia, spaziature e interazioni sono definitivi. Lo stile è quello già in uso nel repo (palette slate di Tailwind, Geist, radius 12px, shadow-ring). Usa le classi Tailwind equivalenti, non gli stili inline del prototipo.

## Struttura routing consigliata
- `app/(app)/panettoni/layout.tsx`: header scuro dedicato (sostituisce la TopNav) + tab
- `app/(app)/panettoni/page.tsx`: redirect a `/panettoni/tabella`
- `app/(app)/panettoni/{tabella,totali,produzione,pianificazione,archivio}/page.tsx`
- TopNav: aggiungi la voce "Panettoni" (stile evidenziato ambra: `bg-amber-100 text-amber-700 border-amber-200`)

## Screens / Views

### Header sezione (tutte le tab)
- Sticky, `bg-slate-900`, testo bianco, max-w 1280px, padding 10px 16px
- A sinistra: bottone freccia indietro 40×40, radius 12, `bg-white/8` (hover `/18`) → torna alla pagina precedente del gestionale. Titolo "Panettoni" 18px/700, sotto "Campagna Natale 2026" 11px slate-400
- A destra: pill con la data, badge ruolo, bottone **Aggiungi cliente** (h40, `bg-amber-500` hover `amber-400`, testo slate-900 14px/700, icona +). Visibile solo con `orders:edit`
- Sotto: riga di tab scrollabile orizzontalmente. Tab attiva `bg-white text-slate-900`, inattive `bg-white/8 text-slate-300`; 13px/600, padding 8px 14px, radius 10. La tab Archivio mostra il conteggio: "Archivio (n)"

### 1. Tabella ordini
- Legenda: Da fare (bianco), In magazzino (giallo), Consegnato → va in archivio (verde)
- Hint: "Un tocco sulla riga cambia stato · doppio tocco (o tieni premuto) su un numero per modificarlo" (per staff: "...le quantità le modifica solo il titolare")
- Tabella in un contenitore scrollabile su entrambi gli assi, `max-height: calc(100dvh - 260px)`, radius 12, ring slate-300
- Colonne: **Cliente** (sticky a sinistra, min 190px: nome 600 + telefono 11px slate-500, pallino di stato) · **Consegna** (badge "IL" indigo-100/indigo-800 per data precisa, "ENTRO" slate-100/slate-600 per entro il; data 13px/600 + ora 11px) · **12 colonne gusto** (header sticky con testo verticale, sfondo = colore gusto al 8% di alpha, testo nel colore del gusto, h112, min-w 44) · **Tot**
- Le celle mostrano la quantità nel colore del gusto, vuote se 0
- Footer sticky "Totale (pz)" con totali per colonna + totale generale (`bg-slate-900` bianco)
- Altezza riga 48px (38px in modalità compatta)
- Colori riga per stato:
  - todo: bg #ffffff, pallino #cbd5e1, bordo #e2e8f0
  - stock: bg #fef9c3, pallino #eab308, bordo #fde68a
  - done: bg #dcfce7, pallino #22c55e, bordo #bbf7d0
- La tabella mostra solo gli ordini **non consegnati**

### 2. Dialog "Nuovo ordine panettoni"
Modale max-w 720, radius 16, overlay `slate-900/50`. In ordine:
1. Nome cliente, Telefono (griglia auto-fit 180px)
2. Box slate-50: segmented **Data precisa / Entro il** → campo data (label "Consegna il" / "Entro il"), Ora ritiro, Acconto €
3. **Quantità**: − / valore (box slate-900, 18px/700) / pz / +, minimo 1
4. **Gusti**: griglia auto-fill 140px di bottoni (min-h 44) con pallino colore, nome e badge del conteggio già in coda. Tap = aggiunge la quantità corrente di quel gusto alla coda (se il gusto c'è già, somma)
5. **Coda ordine**: lista gusto + pz + X per rimuovere; totale pz in alto a destra; "Nessun gusto aggiunto." se vuota
6. Note (textarea)
7. Footer: Annulla · **Salva ordine** (disabilitato se la coda è vuota) → crea una riga con stato `todo`

### 3. Totali per gusto
Griglia auto-fill 220px di card: pallino 14px radius 4, nome, "n clienti", totale 24px/700 tabular-nums. Conta solo gli ordini non consegnati.

### 4. Produzione
Oggi mostra i totali per gusto ordinati per quantità decrescente. **Da collegare alla pianificazione** (vedi "Lavoro aperto").

### 5. Pianificazione
Layout a due colonne con wrap: area principale (grafico + dettaglio) e aside (flex 1 1 260px, max 340px).
- **Grafico** a barre per giorno (14–23 dic), barre impilate per gusto, linea tratteggiata della capacità, legenda "capacità N pz · tocca un giorno". Domeniche chiuse mostrate come "chiuso". Tap su un giorno → dettaglio: gusti, pezzi e clienti destinatari, con evidenziati gli ordini anticipati rispetto alla data ideale
- Avviso per gli ordini non pianificabili (capacità insufficiente)
- **Aside — Vincoli**: stepper Capacità giornaliera (step 5, min 5), Anticipo minimo (0–5 giorni), Gusti diversi al giorno (1–12, visibile solo se "Raggruppa" è attivo), toggle Domenica chiuso
- **Aside — Come ragiona** (modificabile):
  - Strategia (radio card): *Il più tardi possibile* / *Carico uniforme* / *Il prima possibile*
  - "A parità di giorno, prima…": segmented *Data precisa / Entro il / Indifferente*
  - Toggle *Raggruppa i gusti*
  - "Riassunto regole attive": frasi generate dai parametri
- Bottone **Conferma piano** (solo `orders:edit`); qualsiasi modifica ai parametri annulla la conferma
- Con ruolo staff l'aside è disabilitato (opacity .55) con l'avviso "Solo lettura... serve il permesso `orders:edit`"

### 6. Archivio
Lista degli ordini consegnati (più recenti in alto): pallino verde, nome, telefono · consegna il/entro il data, pill gusti ("3 Uvetta e canditi" nel colore del gusto), totale pz, bottone **Ripristina** (lo riporta in tabella come `stock`). Riepilogo "n ordini · n pz consegnati". Stato vuoto: "Nessun ordine consegnato."

## Interactions & Behavior
- **Tap singolo in un punto qualsiasi della riga**: cicla lo stato todo → stock → done → todo. Il cambio è ritardato di **300ms** per distinguerlo dal doppio tocco
- **Doppio tocco su una cella** (entro 300ms, stessa cella) o **pressione lunga** (420ms): apre l'input numerico inline (bordo 2px blue-600, bg blue-50). Invio/Esc/blur = conferma; 0 o vuoto = rimuove il gusto. Doppio tocco e pressione lunga **non** devono cambiare lo stato della riga
- **Passaggio a done**: la riga esce dalla tabella, va in Archivio e compare un toast in basso "**Nome** consegnato, spostato in archivio" con **Annulla** (4,5 s); Annulla = ripristina a `stock`
- Totali, Produzione e Pianificazione considerano solo gli ordini non `done`
- Responsive: deve funzionare su telefono e tablet/desktop (target di tocco ≥ 44px)

## Algoritmo di pianificazione (`buildPlan`)
Mettilo in un modulo puro e testabile, es. `lib/panettoni/plan.ts`, con test unitari.

Input: ordini attivi + parametri `{ cap, lead, maxG, sunClosed, strategy: 'tardi'|'bilanciato'|'presto', prio: 'preciso'|'entro'|'nessuna', group }`. Default: `{ cap: 20, lead: 1, maxG: 4, sunClosed: true, strategy: 'tardi', prio: 'preciso', group: true }`.

1. Ogni ordine × gusto diventa una "linea" con `latest = dataConsegna − lead` (ultimo giorno utile di cottura). Per "entro il" la data usata è la data limite
2. Orizzonte: dal 14 al 23 dicembre, oggi fisso nel prototipo. **Da rendere configurabile** (inizio campagna → 23/12); le domeniche sono chiuse se `sunClosed`
3. `fill(giorno, limite)`: prende le linee con `qty > 0` e `latest ≥ giorno`, le ordina, poi fa due passate:
   - passata 1: aggiunge gusti nuovi finché il giorno ha meno di `maxG` gusti diversi (senza limite se `group = false`)
   - passata 2: completa solo i gusti già presenti nel giorno
   - una linea si può spezzare su più giorni
4. Ordinamento: *tardi* e *bilanciato* → `latest` decrescente; *presto* → `latest` crescente. A parità di `latest`, priorità secondo `prio`
5. Strategie:
   - *tardi*: `fill` dal giorno più vicino a Natale all'indietro, con limite = `cap`
   - *presto*: `fill` in avanti dal primo giorno, con limite = `cap`
   - *bilanciato*: `target = min(cap, ceil(totale / giorni aperti fino all'ultimo giorno necessario))`; prima passata all'indietro con `target`, seconda all'indietro con `cap`
6. Output: `{ days: { [d]: { closed, total, items: { [gusto]: { qty, orders: [{ name, qty, due, kind, moved }] } } } }, left }`. `left` = linee non pianificabili → avviso in UI. `moved` = anticipato rispetto a `latest`

Riferimento esatto: funzione `buildPlan` in `Panettoni.dc.html`.

## Ruoli e permessi
**Riusa `lib/auth/permissions.ts`** e il meccanismo degli override già esistente. Non creare un sistema nuovo.
- `orders:read` (admin, owner, staff): vede tutte le tab
- `orders:toggle` (admin, owner, staff): cambia lo stato delle righe, Ripristina dall'archivio
- `orders:edit` (admin, owner): Aggiungi cliente, modifica quantità, vincoli e regole della pianificazione, Conferma piano
- Lo switch del ruolo nel badge del prototipo è **solo per la demo**: in produzione il ruolo viene dalla sessione
- Applica i controlli anche lato server/API, non solo nascondendo i bottoni

## State / Data model (proposta)
```ts
type PanettoneStatus = 'todo' | 'stock' | 'done';
type DeliveryKind = 'preciso' | 'entro';
interface Gusto { id: string; name: string; color: string; sortOrder: number; active: boolean }
interface PanettoneOrder {
  id: string; customerName: string; phone?: string;
  deliveryKind: DeliveryKind; deliveryDate: string;   // ISO; per 'entro' = data limite
  pickupTime?: string; deposit?: number; notes?: string;
  status: PanettoneStatus; doneAt?: string; season: number; // es. 2026
  items: { gustoId: string; qty: number }[];
}
interface PlanSettings { cap; lead; maxG; sunClosed; strategy; prio; group; confirmedAt?: string }
```
- Segui lo stesso livello di persistenza e sync offline (PWA) usato dagli ordini normali
- Modifiche ottimistiche con rollback, come nel Foglio
- `PlanSettings` va salvato per stagione (oggi nel prototipo non viene salvato)

## Design Tokens
- Font: Geist (già nel progetto)
- Neutri: slate-900 #0f172a, 700 #334155, 600 #475569, 500 #64748b, 400 #94a3b8, 300 #cbd5e1, 200 #e2e8f0, 100 #f1f5f9, 50 #f8fafc
- Accento sezione: amber-500 #f59e0b / amber-400 #fbbf24 / amber-100 #fef3c7 / amber-800 #92400e
- Stati: vedi la tabella sopra; edit #2563eb / #eff6ff
- Gusti (ordine e colore, **da confermare con il cliente**):
  classico #b45309 · uvetta "Uvetta e canditi" #92400e · amarena #be123c · cioccolato #78350f · tre-cioc "Tre cioccolati" #6b21a8 · pistacchio #4d7c0f · albicocca #ea580c · limoncello #ca8a04 · mandorlato #a16207 · frutti "Frutti di bosco" #6d28d9 · caffe "Caffè" #57534e · marron "Marron glacé" #9a3412
- Radius: 8 (piccoli), 10 (input/bottoni), 12 (card/tabella), 16 (dialog), full (pill)
- Shadow: ring `0 0 0 1px #e2e8f0` (card), `0 0 0 1px #cbd5e1` (tabella); dialog `0 20px 50px rgba(0,0,0,.25)`

## Assets
Icone: lucide-react (già nel repo): ChevronLeft, Plus, Calendar, X, User, Lock. Nessuna immagine.

## Lavoro aperto (da fare / da decidere)
1. **Collegare Produzione alla Pianificazione**: con il piano confermato, Produzione mostra "cosa impastare oggi" secondo il piano (gusti, pezzi, clienti), con una spunta "fatto" per gusto che porta quei pezzi a `stock`, il selettore del giorno, un avviso se il piano non è confermato e un avviso "piano da ricalcolare" se arrivano ordini nuovi
2. Elenco e ordine dei gusti dal cliente; valutare una gestione gusti in Gestione
3. Orizzonte della campagna configurabile
4. Fine stagione: archiviazione per anno

## Files
- `Panettoni.dc.html`: prototipo completo (apri nel browser). Logica in fondo al file: `GUSTI`, `TABS`, `buildPlan`, `PERMISSIONS`, `STATUS`, `SEED` (dati demo) e la classe `Component`
- `support.js`: runtime necessario solo per aprire il prototipo
