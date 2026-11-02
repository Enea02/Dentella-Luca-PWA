'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check, Package, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLongPress } from '@/hooks/useLongPress'
import { can } from '@/lib/auth/permissions'
import type { PanettoneItemState, PanettoniForCustomer } from '@/lib/panettoni/types'
import { cn } from '@/lib/utils'
import { ITEM_STATE_LABEL, StateChooser, itemChoices } from '@/components/panettoni/StateChooser'

// Same colors as the Panettoni table (yellow = in magazzino, green = consegnato).
const STATE_STYLE: Record<PanettoneItemState, { row: string; badge: string; label: string }> = {
  todo: { row: 'bg-white ring-slate-200', badge: 'bg-slate-100 text-slate-600', label: 'Da fare' },
  stock: { row: 'bg-amber-50 ring-amber-200', badge: 'bg-amber-100 text-amber-800', label: 'In magazzino' },
  delivered: { row: 'bg-emerald-50 ring-emerald-200', badge: 'bg-emerald-100 text-emerald-800', label: 'Consegnato' },
}

/**
 * The customer's panettoni for this day, inside Ordini. They live in the
 * Panettoni section (one source of truth): editing here writes there.
 * Tap a line → In magazzino / Consegnato / Annulla (same chooser as the table).
 */
export function PanettoniBlock({
  orders,
  onSetQty,
  onSetState,
  onPostpone,
}: {
  orders: PanettoniForCustomer[]
  onSetQty: (orderId: string, flavorId: string, qty: number) => void
  onSetState: (orderId: string, flavorId: string, state: PanettoneItemState) => void
  onPostpone?: (order: PanettoniForCustomer, item: PanettoniForCustomer['items'][number]) => void
}) {
  const { user } = useAuth()
  const canEdit = can(user, 'orders:edit')
  const canToggle = can(user, 'orders:toggle')
  const [choosing, setChoosing] = useState<{ orderId: string; flavorId: string } | null>(null)
  const lines = orders.flatMap((o) => o.items.map((item) => ({ order: o, item })))
  if (lines.length === 0) return null
  const entro = orders.some((o) => o.deliveryKind === 'entro')

  const target = choosing && lines.find((l) => l.order.orderId === choosing.orderId && l.item.flavorId === choosing.flavorId)
  // "Consegnato" on the last flavor still to deliver completes the panettoni order.
  const completes = (o: PanettoniForCustomer, flavorId: string) =>
    o.items.every((i) => i.flavorId === flavorId || i.state === 'delivered')

  const choose = (state: PanettoneItemState) => {
    setChoosing(null)
    if (!target || target.item.state === state) return
    const { order, item } = target
    const prev = item.state
    onSetState(order.orderId, item.flavorId, state)
    if (state === 'delivered' && completes(order, item.flavorId)) {
      toast(`Panettoni di ${order.customerName}: tutto consegnato, spostato in archivio`, {
        action: { label: 'Annulla', onClick: () => onSetState(order.orderId, item.flavorId, prev) },
        duration: 4500,
      })
    }
  }

  return (
    <div className="mt-1 rounded-2xl bg-amber-50/60 p-2 ring-1 ring-amber-200">
      <div className="flex items-baseline justify-between gap-2 px-1.5 pb-1.5">
        <span className="text-xs font-bold uppercase tracking-[.05em] text-amber-800">Panettoni</span>
        <span className="text-[11px] text-amber-700/80">
          {entro ? 'da consegnare entro oggi · ' : ''}
          {canToggle ? 'tocca per magazzino / consegnato' : 'dal foglio Panettoni'}
        </span>
      </div>
      <div className="space-y-1.5">
        {lines.map(({ order, item }) => (
          <PanettoneLine
            key={`${order.orderId}:${item.flavorId}`}
            item={item}
            canEdit={canEdit}
            onTap={canToggle ? () => setChoosing({ orderId: order.orderId, flavorId: item.flavorId }) : undefined}
            onLongPress={onPostpone ? () => onPostpone(order, item) : undefined}
            onSetQty={(qty) => onSetQty(order.orderId, item.flavorId, qty)}
          />
        ))}
      </div>
      {target && (
        <StateChooser
          open
          title={`${target.order.customerName} · Panettone ${target.item.name}`}
          subtitle={`${target.item.qty} pz · ora: ${ITEM_STATE_LABEL[target.item.state]}`}
          choices={itemChoices(target.item.state, completes(target.order, target.item.flavorId))}
          onChoose={choose}
          onClose={() => setChoosing(null)}
        />
      )}
    </div>
  )
}

function PanettoneLine({
  item,
  canEdit,
  onTap,
  onLongPress,
  onSetQty,
}: {
  item: PanettoniForCustomer['items'][number]
  canEdit: boolean
  onTap?: () => void
  onLongPress?: () => void
  onSetQty: (qty: number) => void
}) {
  const longPress = useLongPress(onLongPress)
  const [qty, setQty] = useState(String(item.qty))
  useEffect(() => setQty(String(item.qty)), [item.qty])
  const st = STATE_STYLE[item.state]

  const commit = () => {
    const n = parseInt(qty, 10)
    if (Number.isFinite(n) && n > 0 && n !== item.qty) onSetQty(n)
    else if (Number.isFinite(n) && n <= 0) onSetQty(0)
    else setQty(String(item.qty))
  }

  return (
    <div
      {...longPress}
      role={onTap ? 'button' : undefined}
      tabIndex={onTap ? 0 : undefined}
      onClick={onTap}
      onKeyDown={(e) => {
        // Keyboard access to the chooser (not while typing in the pieces field).
        if (!onTap || e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return
        e.preventDefault()
        onTap()
      }}
      className={cn(
        'flex items-center gap-2 rounded-xl px-3 py-2.5 ring-1 md:gap-3 select-none [-webkit-touch-callout:none]',
        st.row,
        onTap && 'cursor-pointer transition-shadow hover:shadow-sm active:scale-[0.99]',
      )}
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">Panettone {item.name}</span>
      <span className={cn('hidden shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline-flex', st.badge)}>
        {item.state === 'stock' && <Package className="h-3 w-3" />}
        {item.state === 'delivered' && <Check className="h-3 w-3" strokeWidth={3} />}
        {st.label}
      </span>
      {canEdit ? (
        <>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            onClick={(e) => e.stopPropagation()}
            aria-label="Pezzi"
            className="h-8 w-14 shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-center text-sm outline-none"
          />
          <span className="shrink-0 text-xs text-slate-500">pz</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSetQty(0)
            }}
            aria-label="Togli panettone"
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      ) : (
        <span className="shrink-0 text-sm font-semibold text-slate-700">{item.qty} pz</span>
      )}
    </div>
  )
}
