'use client'

import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { usePanettoneFlavors, usePanettoneOrders } from '@/hooks/usePanettoni'
import { can } from '@/lib/auth/permissions'
import { NEXT_STATUS, orderTotal, pendingQty, shortDate, withDelivery } from '@/lib/panettoni/helpers'
import { currentSeason } from '@/lib/panettoni/types'
import { cn } from '@/lib/utils'
import { STATUS_STYLE, alpha } from './status'

const TAP_DELAY = 300 // ms: a single tap on a number waits this long to rule out a double tap
const LONG_PRESS = 420 // ms
const UNDO_TIMEOUT = 4500 // ms

type CellKey = `${string}:${string}` // orderId:flavorId

export function OrdersTable() {
  const season = currentSeason()
  const { user } = useAuth()
  const canEdit = can(user, 'orders:edit')
  const canToggle = can(user, 'orders:toggle')
  const { flavors, isLoading: flavorsLoading, error: flavorsError } = usePanettoneFlavors()
  const {
    orders,
    isLoading: ordersLoading,
    error: ordersError,
    setStatus,
    setDelivered,
    setItemQty,
  } = usePanettoneOrders(season)
  const isLoading = flavorsLoading || ordersLoading
  const loadError = flavorsError || ordersError

  const [editing, setEditing] = useState<CellKey | null>(null)
  const [editValue, setEditValue] = useState('')
  const [undo, setUndo] = useState<{ name: string; run: () => void } | null>(null)

  // Gesture bookkeeping (refs: must not re-render, and timers read the latest values).
  const ordersRef = useRef(orders)
  ordersRef.current = orders
  const editingRef = useRef(editing)
  editingRef.current = editing
  const tapTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const pressTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const undoTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const lastCell = useRef<{ key: CellKey; at: number } | null>(null)
  const swallowCellClick = useRef(false) // set by a long press: its click must not toggle
  const editorClosedAt = useRef(0)

  useEffect(
    () => () => {
      clearTimeout(tapTimer.current)
      clearTimeout(pressTimer.current)
      clearTimeout(undoTimer.current)
    },
    [],
  )

  const visibleFlavors = flavors.filter((f) => f.active)
  const active = orders.filter((o) => o.status !== 'done')
  const failed = () => toast.error('Errore durante il salvataggio')

  // "<name> consegnato, spostato in archivio · Annulla"
  const showArchived = (name: string, run: () => void) => {
    clearTimeout(undoTimer.current)
    setUndo({ name, run })
    undoTimer.current = setTimeout(() => setUndo(null), UNDO_TIMEOUT)
  }
  const undoArchive = () => {
    undo?.run()
    clearTimeout(undoTimer.current)
    setUndo(null)
  }

  // A closing tap on the editor's surroundings must not trigger anything else.
  const justClosedEditor = () => !!editingRef.current || Date.now() - editorClosedAt.current < TAP_DELAY

  // ---- Row (tap on the customer / delivery / total): todo → stock → done ----
  const onRowClick = (id: string) => {
    if (!canToggle || justClosedEditor()) return
    const order = ordersRef.current.find((o) => o.id === id)
    if (!order) return
    const next = NEXT_STATUS[order.status]
    setStatus(id, next).catch(failed)
    if (next === 'done') {
      showArchived(order.customerName, () => setStatus(id, 'stock').catch(failed))
    }
  }

  // ---- Cell (tap on a number): that flavor delivered / not delivered ----
  const toggleDelivered = (orderId: string, flavorId: string) => {
    const order = ordersRef.current.find((o) => o.id === orderId)
    const item = order?.items.find((i) => i.flavorId === flavorId)
    if (!order || !item) return
    const delivered = !item.delivered
    setDelivered(orderId, flavorId, delivered).catch(failed)
    if (withDelivery(order, flavorId, delivered).status === 'done') {
      showArchived(order.customerName, () => setDelivered(orderId, flavorId, false).catch(failed))
    }
  }

  const openEditor = (key: CellKey, current: number | undefined) => {
    clearTimeout(tapTimer.current) // a pending single tap must not toggle
    lastCell.current = null
    setEditing(key)
    setEditValue(current ? String(current) : '')
  }

  const onCellClick = (e: React.MouseEvent, key: CellKey, qty: number | undefined) => {
    e.stopPropagation() // numbers never change the whole row
    if (swallowCellClick.current) {
      swallowCellClick.current = false
      return
    }
    if (justClosedEditor()) return
    const now = Date.now()
    if (canEdit && lastCell.current?.key === key && now - lastCell.current.at < TAP_DELAY) {
      openEditor(key, qty) // double tap
      return
    }
    lastCell.current = { key, at: now }
    if (!qty || !canToggle) return // empty cell: only the edit gestures apply
    const [orderId, flavorId] = key.split(':')
    clearTimeout(tapTimer.current)
    // Without edit rights there is no double tap to wait for.
    if (canEdit) tapTimer.current = setTimeout(() => toggleDelivered(orderId, flavorId), TAP_DELAY)
    else toggleDelivered(orderId, flavorId)
  }

  const onCellPointerDown = (key: CellKey, qty: number | undefined) => {
    swallowCellClick.current = false // new gesture
    clearTimeout(pressTimer.current)
    if (!canEdit) return
    pressTimer.current = setTimeout(() => {
      swallowCellClick.current = true
      openEditor(key, qty)
    }, LONG_PRESS)
  }
  const cancelPress = () => clearTimeout(pressTimer.current)

  const commitEdit = () => {
    const key = editingRef.current
    if (!key) return
    editingRef.current = null // Enter + the following blur must commit once
    editorClosedAt.current = Date.now()
    swallowCellClick.current = false // the opening gesture's click (if any) is long gone
    setEditing(null)
    const [orderId, flavorId] = key.split(':')
    const n = parseInt(editValue, 10)
    const qty = Number.isFinite(n) && n > 0 ? n : 0
    const order = ordersRef.current.find((o) => o.id === orderId)
    const current = order?.items.find((i) => i.flavorId === flavorId)?.qty ?? 0
    if (!order || qty === current) return
    setItemQty(orderId, flavorId, qty).catch(failed)
    // Removing the only flavor still to deliver completes the order.
    const rest = order.items.filter((i) => i.flavorId !== flavorId)
    if (qty === 0 && rest.length > 0 && rest.every((i) => i.delivered)) {
      showArchived(order.customerName, () => setItemQty(orderId, flavorId, current).catch(failed))
    }
  }

  // Footer: pieces still to hand over (delivered cells excluded).
  const totals = new Map<string, number>()
  for (const o of active)
    for (const i of o.items) if (!i.delivered) totals.set(i.flavorId, (totals.get(i.flavorId) ?? 0) + i.qty)
  const grandTotal = [...totals.values()].reduce((a, b) => a + b, 0)

  const colCount = 3 + visibleFlavors.length // for the full-width empty row

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-x-4 gap-y-1.5 flex-wrap">
        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-slate-600">
          <Legend swatch="bg-white border-slate-300">Da fare</Legend>
          <Legend swatch="bg-yellow-200 border-yellow-500">In magazzino</Legend>
          <Legend swatch="bg-emerald-100 border-emerald-500">Gusto consegnato</Legend>
          <span className="text-slate-400">· tutto consegnato → archivio</span>
        </div>
        <span className="text-xs text-slate-400">
          {canEdit
            ? 'Tocca un numero quando lo consegni · doppio tocco (o tieni premuto) per modificarlo · tocca il nome per “in magazzino”'
            : 'Tocca un numero quando lo consegni · tocca il nome per “in magazzino” · le quantità le modifica solo il titolare'}
        </span>
      </div>

      {loadError && (
        <div className="rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-[13px] text-red-800">
          <strong>Impossibile caricare gli ordini dei panettoni.</strong> Controlla la connessione e ricarica la pagina; se il
          problema resta, il database potrebbe non essere aggiornato per la sezione Panettoni.
        </div>
      )}

      {visibleFlavors.length === 0 ? (
        // No flavor columns yet (loading or failed): a table without them would collapse.
        <div className="flex h-40 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 text-[13px] text-slate-400">
          {isLoading ? 'Caricamento…' : 'Dati non disponibili.'}
        </div>
      ) : (
        <div className="overflow-auto max-h-[calc(100dvh-260px)] rounded-xl bg-white ring-1 ring-slate-300 shadow-sm">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <colgroup>
              <col className="w-[150px] sm:w-[220px]" />
              <col className="w-[118px]" />
              {visibleFlavors.map((f) => (
                <col key={f.id} />
              ))}
              <col className="w-16" />
            </colgroup>

            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className="sticky left-0 top-0 z-40 bg-slate-100 px-3 align-bottom pb-2.5 text-left text-xs font-semibold text-slate-600 border-b border-r border-slate-300"
                >
                  Cliente
                </th>
                <th
                  rowSpan={2}
                  className="sticky top-0 z-30 bg-slate-100 px-3 align-bottom pb-2.5 text-left text-xs font-semibold text-slate-600 border-b border-slate-300 border-r-2 border-r-slate-400"
                >
                  Consegna
                </th>
                <th
                  colSpan={visibleFlavors.length}
                  className="sticky top-0 z-30 h-[34px] bg-amber-100 text-amber-800 px-2 text-center text-[11px] font-semibold uppercase tracking-[.06em] border-b border-slate-300 border-r-2 border-r-slate-400"
                >
                  Gusti
                </th>
                <th
                  rowSpan={2}
                  className="sticky top-0 z-30 bg-slate-100 px-2 align-bottom pb-2.5 text-center text-xs font-semibold text-slate-600 border-b border-slate-300"
                >
                  Tot
                </th>
              </tr>
              <tr>
                {visibleFlavors.map((f, i) => (
                    <th
                      key={f.id}
                      title={f.name}
                      className={cn(
                        'sticky top-[34px] z-30 h-28 min-w-11 p-0 align-bottom border-b border-slate-300',
                        i === visibleFlavors.length - 1 ? 'border-r-2 border-r-slate-400' : 'border-r border-r-slate-200',
                      )}
                      style={{ backgroundColor: alpha(f.color, 0.08), color: f.color }}
                    >
                      <div className="flex h-28 items-end justify-center pb-2.5">
                        <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-semibold leading-none whitespace-nowrap">
                          {f.name}
                        </span>
                      </div>
                    </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {active.length === 0 && (
                <tr>
                  <td colSpan={colCount} className="p-0 border-b border-slate-200">
                    {/* Sticky so the message stays in view when the table is wider than the screen. */}
                    <div className="sticky left-0 flex h-32 w-[calc(100vw-2rem)] max-w-full items-center justify-center px-4 text-center text-[13px] text-slate-400">
                      {ordersLoading
                        ? 'Caricamento…'
                        : canEdit
                          ? 'Nessun ordine da consegnare. Usa “Aggiungi cliente” per inserirne uno.'
                          : 'Nessun ordine da consegnare.'}
                    </div>
                  </td>
                </tr>
              )}
              {active.map((o) => {
                const st = STATUS_STYLE[o.status]
                const cell = cn(st.row, 'h-12 border-b', st.line)
                const itemOf = new Map(o.items.map((i) => [i.flavorId, i]))
                const deliveredQty = orderTotal(o) - pendingQty(o)
                return (
                  <tr
                    key={o.id}
                    // Reached only from customer / delivery / total cells: numbers stop propagation.
                    onClick={() => onRowClick(o.id)}
                    title={canToggle ? 'Tocca il nome per cambiare stato' : undefined}
                    className={cn('select-none [-webkit-touch-callout:none]', canToggle && 'cursor-pointer')}
                  >
                    <td className={cn(cell, 'sticky left-0 z-20 px-3 border-r border-r-slate-300')}>
                      <div className="flex items-center gap-2.5 max-w-[124px] sm:max-w-[196px]">
                        <span className={cn('shrink-0 h-2.5 w-2.5 rounded-full ring-2 ring-white', st.dot)} />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 leading-tight truncate">{o.customerName}</div>
                          <div className="text-[11px] leading-tight text-slate-500 truncate">{o.phone ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className={cn(cell, 'px-3 whitespace-nowrap border-r-2 border-r-slate-400')}>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'inline-flex h-[18px] w-12 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase leading-none tracking-[.03em]',
                            o.deliveryKind === 'preciso' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          {o.deliveryKind === 'preciso' ? 'il' : 'entro'}
                        </span>
                        <span className="text-[13px] font-semibold leading-[18px] text-slate-900 tabular-nums">
                          {shortDate(o.deliveryDate)}
                        </span>
                      </div>
                      <div className="mt-0.5 pl-[54px] text-[11px] leading-tight text-slate-500 truncate">{o.pickupTime ?? '—'}</div>
                    </td>
                    {visibleFlavors.map((f, i) => {
                      const key: CellKey = `${o.id}:${f.id}`
                      const item = itemOf.get(f.id)
                      const v = item?.qty
                      const delivered = !!item?.delivered
                      return (
                        <td
                          key={f.id}
                          className={cn(
                            cell,
                            'p-0 text-center',
                            delivered && 'bg-emerald-100',
                            i === visibleFlavors.length - 1 ? 'border-r-2 border-r-slate-400' : cn('border-r', st.line),
                          )}
                        >
                          {editing === key ? (
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') commitEdit()
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.target.select()}
                              className="w-11 h-8 text-center text-sm font-semibold border-2 border-blue-600 rounded-md bg-blue-50 text-slate-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          ) : (
                            <div
                              onClick={(e) => onCellClick(e, key, v)}
                              onPointerDown={() => onCellPointerDown(key, v)}
                              onPointerUp={cancelPress}
                              onPointerLeave={cancelPress}
                              onPointerCancel={cancelPress}
                              onContextMenu={(e) => canEdit && e.preventDefault()}
                              title={v ? (delivered ? 'Consegnato · tocca per annullare' : 'Tocca quando lo consegni') : undefined}
                              className={cn(
                                'relative flex items-center justify-center h-12 text-sm font-semibold tabular-nums',
                                (v && canToggle) || canEdit ? 'cursor-pointer' : 'cursor-default',
                                delivered && 'text-emerald-700',
                              )}
                              style={v && !delivered ? { color: f.color } : undefined}
                            >
                              {v || ''}
                              {delivered && (
                                <Check className="absolute top-1 right-1 h-3 w-3 text-emerald-600" strokeWidth={3} />
                              )}
                            </div>
                          )}
                        </td>
                      )
                    })}
                    <td className={cn(cell, 'px-2 text-center tabular-nums')}>
                      <div className="text-sm font-bold leading-tight text-slate-900">{orderTotal(o)}</div>
                      {deliveredQty > 0 && (
                        <div className="text-[10px] font-semibold leading-tight text-emerald-700">{deliveredQty} cons.</div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>

            <tfoot>
              <tr>
                <td
                  colSpan={2}
                  className="sticky left-0 bottom-0 z-30 h-11 bg-slate-100 px-3 text-xs font-semibold text-slate-600 border-t border-slate-300 border-r-2 border-r-slate-400"
                >
                  Da consegnare (pz)
                </td>
                {visibleFlavors.map((f, i) => {
                  const t = totals.get(f.id) ?? 0
                  return (
                    <td
                      key={f.id}
                      className={cn(
                        'sticky bottom-0 z-20 h-11 bg-slate-100 px-1 text-center text-xs font-bold tabular-nums border-t border-slate-300',
                        i === visibleFlavors.length - 1 ? 'border-r-2 border-r-slate-400' : 'border-r border-r-slate-200',
                        !t && 'text-slate-300',
                      )}
                      style={t ? { color: f.color } : undefined}
                    >
                      {t}
                    </td>
                  )
                })}
                <td className="sticky bottom-0 z-20 h-11 bg-slate-900 text-white px-2 text-center text-[13px] font-bold tabular-nums border-t border-slate-900">
                  {grandTotal}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {undo && (
        <div
          role="status"
          className="fixed left-1/2 bottom-6 -translate-x-1/2 z-[90] flex items-center gap-4 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-[0_10px_30px_rgba(0,0,0,0.25)] max-w-[calc(100vw-32px)]"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-green-500 shrink-0" />
          <span>
            <strong>{undo.name}</strong> consegnato, spostato in archivio
          </span>
          <button type="button" onClick={undoArchive} className="text-amber-400 text-sm font-bold p-1">
            Annulla
          </button>
        </div>
      )}
    </div>
  )
}

function Legend({ swatch, children }: { swatch: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-3.5 w-3.5 rounded border', swatch)} />
      {children}
    </span>
  )
}
