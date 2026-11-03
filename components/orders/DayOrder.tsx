'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/auth/permissions'
import { useProducts, useSections } from '@/hooks/useData'
import type { ComputedDayOrder, OrderItem } from '@/lib/types'
import { PIZZA_VARIANT_SECTION } from '@/lib/types'
import { ProductLineStaff } from './ProductLineStaff'
import { ProductLineOwner } from './ProductLineOwner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductPicker } from './ProductPicker'
import { PanettoniBlock } from './PanettoniBlock'
import { AddPanettone } from './AddPanettone'
import type { PanettoneItemState, PanettoniForCustomer } from '@/lib/panettoni/types'
import { getOrderStatus } from '@/lib/utils'
import { STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { PostponeDialog } from './PostponeDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DayOrderProps {
  order: ComputedDayOrder | null
  onToggleItem: (productId: string, done: boolean) => void
  onAddItem?: (item: OrderItem) => Promise<void>
  onUpdateItemVariant?: (productId: string, variant: string) => Promise<void>
  onUpdateItem?: (productId: string, quantity: number, unit: 'pieces' | 'kg') => void
  onRemoveItem?: (productId: string) => void
  onClearOrder?: () => Promise<void>
  // This customer's panettoni for the day (Panettoni section, linked customers only).
  panettoni?: PanettoniForCustomer[]
  onAddPanettone?: (flavorId: string, qty: number) => Promise<void>
  onSetPanettoneQty?: (orderId: string, flavorId: string, qty: number) => void
  onSetPanettoneState?: (orderId: string, flavorId: string, state: PanettoneItemState) => void
  // Long press → "Posticipa" (moves the product / that panettone flavor to a later day).
  onPostponeItem?: (productId: string, toDate: string) => Promise<void>
  onPostponePanettone?: (orderId: string, flavorId: string, toDate: string) => Promise<void>
}

export function DayOrder({
  order,
  onToggleItem,
  onAddItem,
  onUpdateItemVariant,
  onUpdateItem,
  onRemoveItem,
  onClearOrder,
  panettoni = [],
  onAddPanettone,
  onSetPanettoneQty,
  onSetPanettoneState,
  onPostponeItem,
  onPostponePanettone,
}: DayOrderProps) {
  const { user } = useAuth()
  const canEdit = can(user, 'orders:edit')
  const canPostpone = can(user, 'orders:postpone')
  const selectedDate = useAppStore((s) => s.selectedDate)
  const [postponing, setPostponing] = useState<
    | { kind: 'product'; productId: string; title: string; subtitle: string }
    | { kind: 'panettone'; orderId: string; flavorId: string; title: string; subtitle: string }
    | null
  >(null)
  const { products } = useProducts()
  const { sections } = useSections()
  const [addingItem, setAddingItem] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [unit, setUnit] = useState<'pieces' | 'kg'>('pieces')
  const [qty, setQty] = useState('')
  const [variant, setVariant] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)

  async function handleClearOrder() {
    if (!onClearOrder) return
    setClearing(true)
    try {
      await onClearOrder()
      setConfirmClear(false)
    } finally {
      setClearing(false)
    }
  }

  async function handlePostpone(toDate: string) {
    const target = postponing
    setPostponing(null)
    if (!target) return
    const day = format(new Date(toDate + 'T00:00:00'), 'EEEE d MMMM', { locale: it })
    try {
      if (target.kind === 'product') await onPostponeItem?.(target.productId, toDate)
      else await onPostponePanettone?.(target.orderId, target.flavorId, toDate)
      toast.success(`${target.title} rimandato a ${day}`)
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Errore: prodotto non rimandato')
    }
  }

  const selectedProduct = products.find(p => p.id === selectedProductId)
  const showVariantInput = selectedProduct?.section === PIZZA_VARIANT_SECTION

  const parsedQty = parseFloat(qty)
  const qtyValid = !isNaN(parsedQty) && parsedQty > 0

  async function handleAddItem() {
    if (!selectedProductId || !qtyValid || !onAddItem) return
    setSaving(true)
    try {
      const item: OrderItem = { productId: selectedProductId, quantity: parsedQty, unit, done: false }
      const trimmedVariant = variant.trim()
      if (showVariantInput && trimmedVariant) item.variant = trimmedVariant
      await onAddItem(item)
      setSelectedProductId('')
      setQty('')
      setVariant('')
      setAddingItem(false)
    } finally {
      setSaving(false)
    }
  }

  if (!order) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 text-center h-full flex items-center justify-center">
        <p className="text-slate-500">Seleziona un cliente per vedere l&apos;ordine</p>
      </div>
    )
  }

  const status = getOrderStatus(order.items)
  const doneCount = order.items.filter(i => i.done).length
  // Display order (stable sort keeps the saved arrangement within each group):
  //   1. not-done items of normal sections
  //   2. not-done items of "pinned to bottom" sections
  //   3. done (green) items
  const pinnedSections = new Set(sections.filter(s => s.pinBottom).map(s => s.name))
  const sectionOf = new Map(products.map(p => [p.id, p.section]))
  const rank = (item: OrderItem) =>
    item.done ? 2 : pinnedSections.has(sectionOf.get(item.productId) ?? '') ? 1 : 0
  const displayItems = [...order.items].sort((a, b) => rank(a) - rank(b))

  return (
    <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">{order.customerName}</h2>
            <p className="text-xs text-slate-500">
              {order.customerType === 'fixed' ? 'Cliente fisso' : 'Cliente giornaliero'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {order.items.length > 0 && (
              <div className={cn(
                'px-3 py-1 rounded-full text-xs font-medium',
                STATUS_COLORS[status]
              )}>
                {doneCount}/{order.items.length} completati
              </div>
            )}
            {canEdit && onClearOrder && order.items.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                title="Svuota l'ordine di questo cliente per il giorno"
                aria-label="Svuota ordine del giorno"
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Items list */}
        <ScrollArea className="flex-1 h-[calc(100vh-350px)] md:h-[50vh] lg:h-[60vh]">
          <div className="p-3 space-y-2">
            {displayItems.map((item) => {
              const product = products.find(p => p.id === item.productId)
              const unit = item.unit === 'kg' ? 'kg' : 'pz'
              const onLongPress = canPostpone && onPostponeItem
                ? () => setPostponing({
                    kind: 'product',
                    productId: item.productId,
                    title: product?.name ?? 'prodotto',
                    subtitle: `${order.customerName} · ${item.quantity} ${unit}`,
                  })
                : undefined

              if (canEdit) {
                return (
                  <ProductLineOwner
                    key={`${order.customerId}-${item.productId}`}
                    item={item}
                    product={product}
                    onToggle={(done) => onToggleItem(item.productId, done)}
                    onUpdate={
                      onUpdateItem
                        ? (q, u) => onUpdateItem(item.productId, q, u)
                        : undefined
                    }
                    onUpdateVariant={
                      onUpdateItemVariant
                        ? (v) => onUpdateItemVariant(item.productId, v)
                        : undefined
                    }
                    onRemove={
                      onRemoveItem ? () => onRemoveItem(item.productId) : undefined
                    }
                    onLongPress={onLongPress}
                  />
                )
              }

              return (
                <ProductLineStaff
                  key={`${order.customerId}-${item.productId}`}
                  item={item}
                  product={product}
                  onToggle={(done) => onToggleItem(item.productId, done)}
                  onLongPress={onLongPress}
                />
              )
            })}
            {onSetPanettoneQty && onSetPanettoneState && (
              <PanettoniBlock
                orders={panettoni}
                onSetQty={onSetPanettoneQty}
                onSetState={onSetPanettoneState}
                onPostpone={
                  canPostpone && onPostponePanettone
                    ? (o, item) => setPostponing({
                        kind: 'panettone',
                        orderId: o.orderId,
                        flavorId: item.flavorId,
                        title: `Panettone ${item.name}`,
                        subtitle: `${order.customerName} · ${item.qty} pz`,
                      })
                    : undefined
                }
              />
            )}
          </div>
        </ScrollArea>
        {/* Add item – owner only. Below the list on mobile, left column on desktop. */}
        {canEdit && onAddItem && (
          <div className="order-last grid content-start gap-2 border-t border-slate-100 p-3 lg:order-first lg:w-72 lg:shrink-0 lg:overflow-y-auto lg:border-t-0 lg:border-r">
            {!addingItem ? (
              <button
                type="button"
                onClick={() => setAddingItem(true)}
                className="w-full rounded-xl border border-dashed border-slate-300 py-2 text-xs text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors"
              >
                + Aggiungi articolo
              </button>
            ) : (
              <div className="grid gap-2">
                <ProductPicker
                  value={selectedProductId}
                  onChange={setSelectedProductId}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={unit} onValueChange={(v) => setUnit(v as 'pieces' | 'kg')}>
                    <SelectTrigger className="w-full rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pieces">Pezzi</SelectItem>
                      <SelectItem value="kg">Kg</SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="Qtà"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  />
                </div>
                {showVariantInput && (
                  <input
                    type="text"
                    value={variant}
                    onChange={(e) => setVariant(e.target.value)}
                    placeholder="Variante (es. extra prosciutto)"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingItem(false)
                      setVariant('')
                      setQty('')
                    }}
                    className="flex-1 rounded-xl border border-slate-200 py-2 text-xs text-slate-600"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!selectedProductId || !qtyValid || saving}
                    className="flex-1 rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    {saving ? '...' : 'Aggiungi'}
                  </button>
                </div>
              </div>
            )}
            {onAddPanettone && <AddPanettone onAdd={onAddPanettone} />}
          </div>
        )}
      </div>

      <PostponeDialog
        open={!!postponing}
        title={postponing?.title ?? ''}
        subtitle={postponing?.subtitle}
        fromDate={selectedDate}
        onPostpone={handlePostpone}
        onClose={() => setPostponing(null)}
      />

      <AlertDialog open={confirmClear} onOpenChange={(o) => !clearing && setConfirmClear(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Svuotare l&apos;ordine del giorno?</AlertDialogTitle>
            <AlertDialogDescription>
              Rimuovi tutti gli articoli di &quot;{order.customerName}&quot; solo per questa data. Se è un
              cliente fisso, l&apos;ordine fisso non viene toccato: sparisce solo per oggi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={clearing}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleClearOrder() }}
              disabled={clearing}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              {clearing ? 'Svuotamento...' : 'Svuota'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
