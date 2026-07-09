# Nuove richieste (Luca)

Raccolta delle richieste ricevute via messaggi (6–8 luglio 2026), riorganizzate per argomento.
Ogni sezione riporta la descrizione consolidata e, dove utile, le citazioni originali.

**Priorità dichiarata da Luca:** le voci essenziali per poter usare davvero l'app e procedere
all'installazione sono la **bacheca "Aggiunte" nei totali**, la **cancellazione cliente del giorno**
e lo **spostamento dell'ordine degli insiemi di prodotti**.
> «Queste assieme il punto 2 e il 5 sono quelle essenziali... una volta completate penso che possiamo procedere all'installazione» (08/07, 19:24)

---

## 1. Bug — prodotto duplicato negli ordini

Cliccando su un prodotto capita che venga replicato: la selezione non funziona e se ne creano altri.
Aggiornando la pagina si sistema. (Foto in arrivo da Luca.)

> «Diverse volte ho riscontrato che mi replica un prodotto, e quando vado a cliccare non si seleziona e se ne creano altri, aggiorno la pagina e va a posto.» (06/07, 23:21)

**Nota interna:** probabilmente lo stesso problema già tracciato in `docs/order-item-duplication-bug.md`
(mancanza di unique constraint su `(dailyOrderId, productId)`). Da verificare se combacia.

---

## 2. Bacheca "Aggiunte" nei totali ⭐ (essenziale)

Nella pagina **Totali**, aggiungere una nuova bacheca / menù a tendina fisso in alto che mostri
**tutto il pane in più (o in meno) rispetto alla base fissa giornaliera**.

Idea di fondo: ogni giorno, dopo aver inserito i clienti fissi e senza modifiche, esiste una "base"
fissa per quel giorno della settimana (ogni lunedì uguale, ogni martedì uguale, ecc.). La bacheca deve
raccogliere ogni modifica/aggiunta fatta rispetto a quella base, con il totale risultante.

Formato desiderato:
```
Semolino  -->  + 50 pz = 350 pz
Semolino  -->  - 50 pz = 250 pz
```

**Filtro per prodotto (stellina):** non servono tutti i prodotti. Poter selezionare (es. con una
stellina) quali prodotti vedere nella bacheca; gli altri restano consultabili nelle tendine normali.
Interessa soprattutto il **pane**, non biscotti ecc.

Motivo: si stamperà una base fissa per ogni giorno; quando i ragazzi arrivano vedono subito le aggiunte
senza dover cercare ogni singolo prodotto (troppo tempo).

> «Una bacheca... in cui c'è scritto tutto il pane che c'è in più rispetto agli ordini fissi... poi andando a vedere il prodotto nel gruppo corrispondente vedo il totale» (06/07, 23:24)
> «Non mi serve di tutti i prodotti... se potessi selezionarli, magari con una stellina, quelli che voglio poter vedere» (08/07, 19:22)

---

## 3. Cancellare un cliente per il giorno ⭐ (essenziale — "punto 2")

Nella prima pagina (modifica prodotti), poter cancellare in un colpo solo l'intero ordine di un cliente
per quel giorno. Oggi si cancellano tutti i prodotti uno a uno, ma il nome del cliente resta.
Richiesto un pulsante "cancella tutto".

> «Un pulsantino che mi cancella tutto in un colpo solo sarebbe top» (06/07, 23:26)

---

## 4. Spostare l'ordine degli insiemi di prodotti ⭐ (essenziale — "punto 5")

Lo spostamento dell'ordine dei singoli prodotti funziona. In **Gestione prodotti** invece non si riesce
a spostare l'ordine degli **insiemi/gruppi** di prodotti. Testato per ora solo da computer — da provare
anche da tablet, il comportamento potrebbe differire.

> «Gli insiemi di prodotti non riesco a spostare l'ordine dell'insieme... provato solo con il computer» (07/07, 02:09)

---

## 5. Clienti fissi con sottoinsiemi per giorno (vista a tendina) — "punto 4"

Un cliente fisso deve avere una **base generale** e poi una variazione per ogni giorno della settimana,
invece di creare più clienti separati (es. "Luca L", "Luca M"...).

Struttura desiderata: aprendo il cliente si vede in alto l'ordine fisso generale e poi le tendine per
giorno:
```
Tot | Lun | Mar | Mer | Gio | Ven | Sab
Lunedì:
  Semolino (base) 300  +/- x = tot
```

- Modificando la **base**, la modifica si applica automaticamente a tutti i giorni
  (es. tolgo 1 kg di comune dalla base → si aggiorna in tutti i giorni).
- Per ogni giorno poter **aggiungere/togliere** prodotti diversi rispetto alla base
  (es. il lunedì niente torte o lievito madre).
- **Statistiche:** sotto un unico nome cliente si deve vedere la somma reale ed effettiva di ogni
  prodotto su tutta la settimana, senza dover sommare a mano i vari "Luca".

> «Vorrei avere i clienti fissi a tendina, che quando li apro mi escono in alto l'ordine fisso generale, poi ogni gg... così non ho 7 andrea diversi» (07/07, 02:08 e 20:31)

---

## 6. Nuova pagina stile Excel (per "il papà")

Pagina alternativa, in stile foglio Excel, per chi preferisce quel modo di lavorare rispetto all'attuale
sistema di inserimento. Tutto il resto resta com'è: questa è una pagina **in aggiunta**, con solo le
funzioni essenziali per non fare danni.

**Struttura:**
- Ogni colonna delimitata da una riga più spessa = un **gruppo di prodotti**; dentro, i singoli prodotti.
- Colonne prodotti e loro ordine fanno riferimento ai gruppi di **Gestione prodotti**: ogni modifica lì
  fatta si riflette nell'Excel.
- In fondo alla pagina, il **totale di ogni colonna** prodotto (es. colonna "Semolini" → totale semolini).

**Funzioni ammesse (solo queste):**
- Creare un nuovo ordine e modificare gli ordini giornalieri direttamente dal foglio.
- Modifica prodotto e modifica cliente **del giorno** (nient'altro).
- In fondo alla lista clienti, un tasto "+ / Aggiungi cliente" che crea una nuova riga con nome, da
  compilare poi manualmente nelle colonne prodotti (essenzialmente "crea riga con nome").

**Sincronizzazione:** ogni modifica fatta nell'Excel (prodotto o cliente) si riporta nella pagina
principale degli ordini clienti.

**Domande aperte da confermare a Luca:**
1. Si possono inserire sia **pezzi** che **kg** nelle celle?
2. Il tasto "aggiungi cliente" a fondo lista è realizzabile come descritto?

> «Mi puoi creare una nuova pagina come se fosse un Excel? ... solo modifica prodotto e modifica clienti del giorno» (07/07, 23:27 e 08/07, 19:08)

---

## 7. Panettoni e colombe (futuro)

Anticipata come richiesta futura, non urgente. Idealmente pronta per **ottobre**; in alternativa serve
entro **metà febbraio**.

> «Anticipo già per i panettoni e colombe, quello se riesci per ottobre top, se no per metà febbraio mi servirebbe» (08/07, 19:40)

---

## Nota organizzativa

Luca è disponibile a organizzare una **chiamata** per dettagli più specifici, se servono.
