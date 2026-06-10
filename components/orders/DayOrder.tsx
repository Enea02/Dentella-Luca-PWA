'use client'

import { useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/auth/permissions'
import { useProducts } from '@/hooks/useData'
import type { ComputedDayOrder, OrderItem } from '@/lib/types'
import { PIZZA_VARIANT_SECTION } from '@/lib/types'
import { ProductLineStaff } from './ProductLineStaff'
import { ProductLineOwner } from './ProductLineOwner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductPicker } from './ProductPicker'
import { getOrderStatus } from '@/lib/utils'
import { STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

interface DayOrderProps {
  order: ComputedDayOrder | null
  onToggleItem: (productId: string, done: boolean) => void
  onAddItem?: (item: OrderItem) => Promise<void>
  onUpdateItemVariant?: (productId: string, variant: string) => Promise<void>
  onUpdateItem?: (productId: string, quantity: number, unit: 'pieces' | 'kg') => void
  onRemoveItem?: (productId: string) => void
  onReorder?: (orderedProductIds: string[]) => void
}

export function DayOrder({
  order,
  onToggleItem,
  onAddItem,
  onUpdateItemVariant,
  onUpdateItem,
  onRemoveItem,
  onReorder,
}: DayOrderProps) {
  const { user } = useAuth()
  const canEdit = can(user, 'orders:edit')
  const { products } = useProducts()
  const [addingItem, setAddingItem] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [unit, setUnit] = useState<'pieces' | 'kg'>('pieces')
  const [qty, setQty] = useState('')
  const [variant, setVariant] = useState('')
  const [saving, setSaving] = useState(false)

  const dragId = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

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

  const handleDragStart = (productId: string) => {
    dragId.current = productId
  }

  const handleDragOver = (e: React.DragEvent, productId: string) => {
    e.preventDefault()
    setDragOverId(productId)
  }

  const handleDrop = (targetId: string) => {
    const sourceId = dragId.current
    dragId.current = null
    setDragOverId(null)
    if (!order || !sourceId || sourceId === targetId || !onReorder) return
    const ids = order.items.map((i) => i.productId)
    const from = ids.indexOf(sourceId)
    const to = ids.indexOf(targetId)
    if (from === -1 || to === -1) return
    const reordered = [...ids]
    reordered.splice(from, 1)
    reordered.splice(to, 0, sourceId)
    onReorder(reordered)
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
  const canReorder = canEdit && !!onReorder && order.items.length > 1

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
          <div className={cn(
            'px-3 py-1 rounded-full text-xs font-medium',
            STATUS_COLORS[status]
          )}>
            {doneCount}/{order.items.length} completati
          </div>
        </div>
      </div>

      {/* Items list */}
      <ScrollArea className="flex-1 h-[calc(100vh-350px)] md:h-[50vh]">
        <div className="p-3 space-y-2">
          {order.items.map((item) => {
            const product = products.find(p => p.id === item.productId)

            if (canEdit) {
              const row = (
                <ProductLineOwner
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
                />
              )

              if (!canReorder) {
                return <div key={item.productId}>{row}</div>
              }

              return (
                <div
                  key={item.productId}
                  onDragOver={(e) => handleDragOver(e, item.productId)}
                  onDragEnd={() => { dragId.current = null; setDragOverId(null) }}
                  onDrop={() => handleDrop(item.productId)}
                  className={cn(
                    'flex items-stretch gap-1 rounded-xl transition-colors',
                    dragOverId === item.productId && dragId.current !== item.productId
                      ? 'ring-2 ring-slate-400'
                      : ''
                  )}
                >
                  <div
                    draggable
                    onDragStart={() => handleDragStart(item.productId)}
                    className="flex items-center px-0.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
                    aria-label="Trascina per riordinare"
                  >
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">{row}</div>
                </div>
              )
            }

            return (
              <ProductLineStaff
                key={item.productId}
                item={item}
                product={product}
                onToggle={(done) => onToggleItem(item.productId, done)}
              />
            )
          })}
        </div>
      </ScrollArea>

      {/* Add item – owner only */}
      {canEdit && onAddItem && (
        <div className="border-t border-slate-100 p-3">
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
        </div>
      )}
    </div>
  )
}
