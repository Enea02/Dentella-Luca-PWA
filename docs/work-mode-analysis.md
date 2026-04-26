# Analisi: Modalità Lavoro

## Obiettivo

Aggiungere nella navbar un toggle "Modalità Lavoro" che ingrandisce tutti i touch target usati dall'addetto durante il turno: celle di produzione, righe degli ordini, lista clienti. Pensato per essere usato su tablet o touch screen con le mani impegnate o bagnate.

---

## Componenti interessati

| Componente | Cosa cambia in work mode |
|---|---|
| `TopNav` | Aggiunge il pulsante toggle |
| `ProductionTable` | Celle più alte e testo più grande |
| `DayOrder` > `ProductLineStaff` | Righe più alte, checkbox più grande |
| `CustomerList` | Card cliente più alta, testo più grande |

La pagina **Totali** è di sola lettura per lo staff → nessuna modifica necessaria.

---

## Stato

Nuovo campo `workMode: boolean` nel Zustand store, **persistito** in localStorage così rimane attivo anche dopo un refresh.

---

## Navbar

Nuovo pulsante accanto al badge ruolo, visibile solo a ruolo `staff` (o sempre, per comodità del titolare che aiuta). Usa icona `Maximize2` / `Minimize2` di lucide-react. Sfondo ambra quando attivo.

---

## Variazioni dimensionali

### ProductionTable — celle

| Stato | Classi |
|---|---|
| Normale | `min-h-[44px] text-xs px-2 py-1.5` |
| Work mode | `min-h-[72px] text-sm px-3 py-3 font-medium` |

### DayOrder — ProductLineStaff

| Stato | Classi |
|---|---|
| Normale | `px-4 py-3 text-sm` |
| Work mode | `px-4 py-5 text-base`, checkbox `h-7 w-7` |

### CustomerList — item

| Stato | Classi |
|---|---|
| Normale | `p-3 text-sm` |
| Work mode | `p-4 text-base`, badge contatore più grande |

---

## Schema implementazione

1. `lib/store.ts` — aggiungi `workMode` + `setWorkMode`, persisti
2. `components/layout/TopNav.tsx` — aggiungi pulsante toggle
3. `components/production/ProductionTable.tsx` — leggi `workMode` dallo store, applica classi condizionali
4. `components/orders/DayOrder.tsx` — stesso pattern
5. `components/orders/CustomerList.tsx` — stesso pattern
