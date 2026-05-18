'use client'

import { useState, useRef } from 'react'
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
import { ProductPicker } from './ProductPicker'
import { toast } from 'sonner'

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
  const { customers, create: createCustomer } = useCustomers()
  const { products } = useProducts()

  const [inputValue, setInputValue] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [unit, setUnit] = useState<'pieces' | 'kg'>('pieces')
  const [qty, setQty] = useState(1)
  const [items, setItems] = useState<DraftItem[]>([])
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const sortedCustomers = [...customers].sort((a, b) => a.name.localeCompare(b.name))

  const filteredCustomers = inputValue.trim()
    ? sortedCustomers.filter((c) =>
        c.name.toLowerCase().includes(inputValue.toLowerCase())
      )
    : sortedCustomers

  const isNew = inputValue.trim().length > 0 && selectedCustomerId === null
  const isExisting = selectedCustomerId !== null

  const alreadyHasOrder = isExisting
    ? existingOrders.some((o) => o.customerId === selectedCustomerId)
    : false

  function handleInputChange(value: string) {
    setInputValue(value)
    setSelectedCustomerId(null)
    setDropdownOpen(true)
  }

  function handleSelectCustomer(id: string, name: string) {
    setSelectedCustomerId(id)
    setInputValue(name)
    setDropdownOpen(false)
    inputRef.current?.blur()
  }

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

  function handleClose() {
    setInputValue('')
    setSelectedCustomerId(null)
    setDropdownOpen(false)
    setItems([])
    setQty(1)
    onClose()
  }

  async function handleSave() {
    if (!inputValue.trim() || items.length === 0) return
    setSaving(true)
    try {
      let targetCustomerId = selectedCustomerId
      if (!targetCustomerId) {
        const newCustomer = await createCustomer({ name: inputValue.trim(), type: 'single' })
        targetCustomerId = newCustomer.id
        toast.success(`Cliente "${inputValue.trim()}" creato come giornaliero`)
      }
      await onSave(
        targetCustomerId,
        items.map(({ productId, quantity, unit }) => ({ productId, quantity, unit, done: false }))
      )
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  const canSave = inputValue.trim().length > 0 && items.length > 0 && !alreadyHasOrder

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        aria-describedby={undefined}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="max-w-md rounded-3xl"
      >
        <DialogHeader>
          <DialogTitle>Nuovo ordine giornaliero</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          {/* Customer autocomplete */}
          <div className="relative">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                placeholder="Cerca o inserisci cliente..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-24 text-sm outline-none focus:border-slate-400"
              />
              {isExisting && (
                <span className="absolute right-3 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                  Esistente
                </span>
              )}
              {isNew && (
                <span className="absolute right-3 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                  Nuovo
                </span>
              )}
            </div>

            {dropdownOpen && filteredCustomers.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                <div className="max-h-48 overflow-y-auto py-1">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => handleSelectCustomer(c.id, c.name)}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>{c.name}</span>
                      <span className="text-xs text-slate-400">
                        {c.type === 'fixed' ? 'Fisso' : 'Giornaliero'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {alreadyHasOrder && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 leading-relaxed">
              <span className="font-semibold">Questo cliente ha già un ordine per oggi.</span>
              {' '}Modificalo direttamente dalla scheda dettagli ordine — le modifiche effettuate da lì valgono solo per il giorno selezionato.
            </div>
          )}

          {/* Product selector */}
          <ProductPicker
            value={selectedProductId}
            onChange={(id) => {
              setSelectedProductId(id)
              const product = products.find(p => p.id === id)
              if (product) setUnit(product.unit === 'kg' ? 'kg' : 'pieces')
            }}
          />

          <div className="grid grid-cols-2 gap-3">
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
            disabled={!canSave || saving}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {saving ? 'Salvataggio...' : 'Salva ordine'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
