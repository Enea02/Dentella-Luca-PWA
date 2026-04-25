'use client'

import { useState } from 'react'
import { useCustomers, useProducts } from '@/hooks/useData'
import type { ComputedDayOrder, OrderItem } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DraftItem {
  localId: string
  productId: string
  productName: string
  quantity: number
  unit: 'pieces' | 'kg'
}

interface NewDailyOrderDialogProps {
  open: boolean
  onClose: () => void
  onSave: (customerId: string, items: OrderItem[]) => Promise<void>
  existingOrders: ComputedDayOrder[]
}

export function NewDailyOrderDialog({ open, onClose, onSave, existingOrders }: NewDailyOrderDialogProps) {
  const { customers } = useCustomers()
  const { products } = useProducts()

  const [customerId, setCustomerId] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [unit, setUnit] = useState<'pieces' | 'kg'>('pieces')
  const [qty, setQty] = useState(1)
  const [items, setItems] = useState<DraftItem[]>([])
  const [saving, setSaving] = useState(false)

  const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name))
  const sortedCustomers = [...customers].sort((a, b) => a.name.localeCompare(b.name))

  const alreadyHasOrder = customerId
    ? existingOrders.some((o) => o.customerId === customerId)
    : false

  function addItem() {
    const product = products.find((p) => p.id === selectedProductId)
    if (!product || qty <= 0) return
    setItems((prev) => [
      ...prev,
      {
        localId: `${Date.now()}-${Math.random()}`,
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unit,
      },
    ])
    setQty(1)
  }

  function removeItem(localId: string) {
    setItems((prev) => prev.filter((i) => i.localId !== localId))
  }

  async function handleSave() {
    if (!customerId || items.length === 0) return
    setSaving(true)
    try {
      await onSave(
        customerId,
        items.map(({ productId, quantity, unit }) => ({
          productId,
          quantity,
          unit,
          done: false,
        }))
      )
      setCustomerId('')
      setItems([])
      setQty(1)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent aria-describedby={undefined} className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>Nuovo ordine giornaliero</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          {/* Customer selector */}
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger className="w-full rounded-2xl">
              <SelectValue placeholder="Seleziona cliente..." />
            </SelectTrigger>
            <SelectContent>
              {sortedCustomers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {alreadyHasOrder && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 leading-relaxed">
              <span className="font-semibold">Questo cliente ha già un ordine per oggi.</span>
              {' '}Modificalo direttamente dalla scheda dettagli ordine — le modifiche effettuate da lì valgono solo per il giorno selezionato.
            </div>
          )}

          {/* Product selector */}
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger className="w-full rounded-2xl">
              <SelectValue placeholder="Seleziona prodotto..." />
            </SelectTrigger>
            <SelectContent>
              {sortedProducts.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.section})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-3">
            {/* Unit selector */}
            <Select value={unit} onValueChange={(v) => setUnit(v as 'pieces' | 'kg')}>
              <SelectTrigger className="w-full rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pieces">Pezzi</SelectItem>
                <SelectItem value="kg">Kg</SelectItem>
              </SelectContent>
            </Select>

            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value) || 1)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            />
          </div>

          <button
            type="button"
            onClick={addItem}
            disabled={!selectedProductId}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 disabled:opacity-40"
          >
            + Aggiungi prodotto
          </button>

          {/* Draft items */}
          <div className="space-y-2 rounded-2xl border border-dashed border-slate-300 p-3 text-sm text-slate-600 min-h-[60px]">
            {items.length === 0 ? (
              <span className="text-slate-400">Nessun prodotto aggiunto.</span>
            ) : (
              items.map((item) => (
                <div key={item.localId} className="flex items-center justify-between">
                  <span>
                    {item.productName} · {item.quantity} {item.unit === 'kg' ? 'kg' : 'pezzi'}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.localId)}
                    className="ml-3 text-xs text-red-600 hover:underline"
                  >
                    Rimuovi
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!customerId || items.length === 0 || saving || alreadyHasOrder}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {saving ? 'Salvataggio...' : 'Salva ordine'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
