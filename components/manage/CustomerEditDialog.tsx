'use client'

import { useEffect, useState } from 'react'
import { useCustomers, useProducts, useSections } from '@/hooks/useData'
import { getCustomerRecurringOrder, upsertRecurringOrder } from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { Customer, Weekday } from '@/lib/types'
import { Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const WEEKDAYS: { value: Weekday; label: string }[] = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Gio' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sab' },
  { value: 7, label: 'Dom' },
]

interface DraftItem {
  localId: string
  productId: string
  quantity: number
  unit: 'pieces' | 'kg'
}

interface CustomerEditDialogProps {
  customer: Customer | null
  open: boolean
  onClose: () => void
  copyFromCustomerId?: string | null
}

export function CustomerEditDialog({ customer, open, onClose, copyFromCustomerId }: CustomerEditDialogProps) {
  const { create, update } = useCustomers()
  const { products } = useProducts()
  const { sections } = useSections()

  const [name, setName] = useState('')
  const [isFixed, setIsFixed] = useState(false)
  const [weekdays, setWeekdays] = useState<Weekday[]>([])
  const [items, setItems] = useState<DraftItem[]>([])

  const [addProductId, setAddProductId] = useState('')
  const [addUnit, setAddUnit] = useState<'pieces' | 'kg'>('pieces')
  const [addQty, setAddQty] = useState(1)

  const [isLoading, setIsLoading] = useState(false)

  const isNew = !customer
  const groupedProducts = [...sections]
    .sort((a, b) => a.order - b.order)
    .map(s => ({
      section: s,
      products: products
        .filter(p => p.section === s.name)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter(g => g.products.length > 0)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    if (customer) {
      setName(customer.name)
      const fixed = customer.type === 'fixed'
      setIsFixed(fixed)
      if (fixed) {
        getCustomerRecurringOrder(customer.id).then((recurring) => {
          if (cancelled) return
          setWeekdays(recurring?.weekdays ?? [])
          setItems(
            (recurring?.items ?? []).map((item) => ({
              localId: `${item.productId}-${Math.random()}`,
              productId: item.productId,
              quantity: item.quantity,
              unit: item.unit,
            }))
          )
        })
      } else {
        setWeekdays([])
        setItems([])
      }
    } else {
      setName('')
      setIsFixed(copyFromCustomerId ? true : false)
      setWeekdays([])
      setItems([])
      if (copyFromCustomerId) {
        getCustomerRecurringOrder(copyFromCustomerId).then((recurring) => {
          if (cancelled) return
          setWeekdays(recurring?.weekdays ?? [])
          setItems(
            (recurring?.items ?? []).map((item) => ({
              localId: `${item.productId}-${Math.random()}`,
              productId: item.productId,
              quantity: item.quantity,
              unit: item.unit,
            }))
          )
        })
      }
    }
    setAddProductId('')
    setAddQty(1)
    return () => {
      cancelled = true
    }
  }, [customer, open, copyFromCustomerId])

  function toggleWeekday(day: Weekday) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  function addItem() {
    if (!addProductId || addQty <= 0) return
    setItems((prev) => [
      ...prev,
      {
        localId: `${Date.now()}-${Math.random()}`,
        productId: addProductId,
        quantity: addQty,
        unit: addUnit,
      },
    ])
    setAddProductId('')
    setAddQty(1)
  }

  function removeItem(localId: string) {
    setItems((prev) => prev.filter((i) => i.localId !== localId))
  }

  function updateQty(localId: string, qty: number) {
    setItems((prev) =>
      prev.map((i) => (i.localId === localId ? { ...i, quantity: qty } : i))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Inserisci un nome')
      return
    }

    setIsLoading(true)
    try {
      if (isNew) {
        const newCustomer = await create({ name: name.trim(), type: isFixed ? 'fixed' : 'single' })
        if (isFixed) {
          await upsertRecurringOrder(
            newCustomer.id,
            weekdays,
            items.map(({ productId, quantity, unit }) => ({ productId, quantity, unit, done: false }))
          )
        }
        toast.success('Cliente creato')
      } else {
        await update(customer.id, { name: name.trim(), type: isFixed ? 'fixed' : 'single' })
        if (isFixed) {
          await upsertRecurringOrder(
            customer.id,
            weekdays,
            items.map(({ productId, quantity, unit }) => ({ productId, quantity, unit, done: false }))
          )
        }
        toast.success('Cliente aggiornato')
      }
      onClose()
    } catch {
      toast.error('Errore durante il salvataggio')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="flex flex-col gap-0 p-0 rounded-3xl sm:max-w-md max-h-[85vh]"
      >
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>{isNew ? 'Nuovo Cliente' : 'Modifica Cliente'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome del cliente"
                className="rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="fixed">Cliente fisso</Label>
              <Switch
                id="fixed"
                checked={isFixed}
                onCheckedChange={(val) => {
                  setIsFixed(val)
                  if (!val) { setWeekdays([]); setItems([]) }
                }}
              />
            </div>

            {isFixed && (
              <div className="space-y-3 rounded-2xl border border-slate-200 p-3">
                {/* Weekday selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Giorni di presenza</Label>
                  <div className="flex gap-1">
                    {WEEKDAYS.map((d) => {
                      const active = weekdays.includes(d.value)
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleWeekday(d.value)}
                          className={cn(
                            'flex-1 rounded-lg py-1 text-xs font-semibold transition-colors',
                            active
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          )}
                        >
                          {d.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <Label className="text-xs">Articoli fissi</Label>

                  <div className="space-y-1.5">
                    {items.length === 0 && (
                      <p className="text-xs text-slate-400">Nessun articolo aggiunto.</p>
                    )}
                    {items.map((item) => {
                      const product = products.find((p) => p.id === item.productId)
                      return (
                        <div key={item.localId} className="flex items-center gap-2">
                          <span className="flex-1 truncate text-xs text-slate-700">
                            {product?.name ?? item.productId}
                          </span>
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={item.quantity}
                            onChange={(e) => updateQty(item.localId, Number(e.target.value) || 1)}
                            className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-center text-xs outline-none"
                          />
                          <span className="w-5 text-xs text-slate-400">
                            {item.unit === 'kg' ? 'kg' : 'pz'}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.localId)}
                            className="text-slate-300 transition-colors hover:text-red-500"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Add product row */}
                  <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2">
                    <Select value={addProductId} onValueChange={setAddProductId}>
                      <SelectTrigger className="flex-1 rounded-xl text-xs h-8">
                        <SelectValue placeholder="Aggiungi prodotto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {groupedProducts.map(({ section, products: sp }) => (
                          <SelectGroup key={section.id}>
                            <SelectLabel className={cn('text-xs', section.color)}>{section.name}</SelectLabel>
                            {sp.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={addUnit} onValueChange={(v) => setAddUnit(v as 'pieces' | 'kg')}>
                      <SelectTrigger className="w-[4.5rem] rounded-xl text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pieces">pz</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                      </SelectContent>
                    </Select>
                    <input
                      type="number"
                      min="1"
                      value={addQty}
                      onChange={(e) => setAddQty(Number(e.target.value) || 1)}
                      className="w-12 rounded-xl border border-slate-200 px-1 py-1.5 text-center text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={addItem}
                      disabled={!addProductId}
                      className="rounded-xl bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 shrink-0 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-slate-900 hover:bg-slate-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                'Salva'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
