'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSWRConfig } from 'swr'
import { useCustomers, useProducts, useSections } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { useDragReorder } from '@/hooks/useDragReorder'
import { getCustomerRecurringOrder, upsertRecurringOrder } from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { Customer, RecurringOverrideItem, Weekday } from '@/lib/types'
import { GripVertical, Loader2, RotateCcw, X } from 'lucide-react'
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
  // Held as a string while editing so the field can be cleared without snapping to 1.
  quantity: number | string
  unit: 'pieces' | 'kg'
}

// Per-weekday override draft: quantity/unit adjustment or a removal of a base product.
interface DraftOverride {
  productId: string
  quantity: number | string
  unit: 'pieces' | 'kg'
  removed: boolean
}

type Tab = 'base' | Weekday

interface CustomerEditDialogProps {
  customer: Customer | null
  open: boolean
  onClose: () => void
  copyFromCustomerId?: string | null
}

export function CustomerEditDialog({ customer, open, onClose, copyFromCustomerId }: CustomerEditDialogProps) {
  const { mutate: globalMutate } = useSWRConfig()
  const { create, update } = useCustomers()
  const { products } = useProducts()
  const { sections } = useSections()
  const { user } = useAuth()
  const canReorder = user?.role === 'admin'

  const [name, setName] = useState('')
  const [isFixed, setIsFixed] = useState(false)
  const [weekdays, setWeekdays] = useState<Weekday[]>([])
  const [baseItems, setBaseItems] = useState<DraftItem[]>([])
  const [overrides, setOverrides] = useState<Record<number, DraftOverride[]>>({})
  const [tab, setTab] = useState<Tab>('base')

  const [addProductId, setAddProductId] = useState('')
  const [addUnit, setAddUnit] = useState<'pieces' | 'kg'>('pieces')
  const [addQty, setAddQty] = useState('')

  const [isLoading, setIsLoading] = useState(false)

  const { displayItems, registerRow, dragHandleProps, draggingId } = useDragReorder(
    baseItems,
    (i) => i.localId,
    (ids) =>
      setBaseItems((prev) =>
        ids
          .map((id) => prev.find((i) => i.localId === id))
          .filter((i): i is DraftItem => i !== undefined),
      ),
  )

  const isNew = !customer

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? id
  const baseByProduct = useMemo(
    () => new Map(baseItems.map((b) => [b.productId, b])),
    [baseItems],
  )

  const groupedProducts = [...sections]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      section: s,
      products: products
        .filter((p) => p.section === s.name)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.products.length > 0)

  useEffect(() => {
    if (!open) return
    let cancelled = false

    const load = (id: string) =>
      getCustomerRecurringOrder(id).then((recurring) => {
        if (cancelled) return
        setWeekdays(recurring?.weekdays ?? [])
        setBaseItems(
          (recurring?.base ?? []).map((item) => ({
            localId: `${item.productId}-${Math.random()}`,
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
          })),
        )
        const ov: Record<number, DraftOverride[]> = {}
        for (const [wd, items] of Object.entries(recurring?.overrides ?? {})) {
          ov[Number(wd)] = items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unit: it.unit,
            removed: it.removed,
          }))
        }
        setOverrides(ov)
      })

    if (customer) {
      setName(customer.name)
      const fixed = customer.type === 'fixed'
      setIsFixed(fixed)
      if (fixed) {
        load(customer.id)
      } else {
        setWeekdays([]); setBaseItems([]); setOverrides({})
      }
    } else {
      setName('')
      setIsFixed(!!copyFromCustomerId)
      setWeekdays([]); setBaseItems([]); setOverrides({})
      if (copyFromCustomerId) load(copyFromCustomerId)
    }
    setTab('base')
    setAddProductId('')
    setAddQty('')
    return () => {
      cancelled = true
    }
  }, [customer, open, copyFromCustomerId])

  function toggleWeekday(day: Weekday) {
    setWeekdays((prev) => {
      const has = prev.includes(day)
      if (has) {
        // Deselecting a day drops its overrides and resets the active tab if needed.
        setOverrides((o) => {
          const { [day]: _drop, ...rest } = o
          return rest
        })
        if (tab === day) setTab('base')
        return prev.filter((d) => d !== day)
      }
      return [...prev, day]
    })
  }

  // --- Base tab editing ---
  function addBaseItem() {
    const qty = parseFloat(addQty)
    if (!addProductId || isNaN(qty) || qty <= 0) return
    setBaseItems((prev) => [
      ...prev,
      { localId: `${Date.now()}-${Math.random()}`, productId: addProductId, quantity: qty, unit: addUnit },
    ])
    setAddProductId(''); setAddQty('')
  }
  function removeBaseItem(localId: string) {
    setBaseItems((prev) => prev.filter((i) => i.localId !== localId))
  }
  function updateBaseQty(localId: string, qty: string) {
    setBaseItems((prev) => prev.map((i) => (i.localId === localId ? { ...i, quantity: qty } : i)))
  }
  function updateBaseUnit(localId: string, unit: 'pieces' | 'kg') {
    setBaseItems((prev) => prev.map((i) => (i.localId === localId ? { ...i, unit } : i)))
  }

  // --- Weekday override editing ---
  function setOverride(day: number, productId: string, patch: Partial<DraftOverride>) {
    setOverrides((prev) => {
      const arr = [...(prev[day] ?? [])]
      const idx = arr.findIndex((o) => o.productId === productId)
      const base = baseByProduct.get(productId)
      const current: DraftOverride =
        idx >= 0
          ? arr[idx]
          : { productId, quantity: base?.quantity ?? 1, unit: base?.unit ?? 'pieces', removed: false }
      const next = { ...current, ...patch }
      if (idx >= 0) arr[idx] = next
      else arr.push(next)
      return { ...prev, [day]: arr }
    })
  }
  function clearOverride(day: number, productId: string) {
    setOverrides((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).filter((o) => o.productId !== productId),
    }))
  }
  function addOverrideItem(day: number) {
    const qty = parseFloat(addQty)
    if (!addProductId || isNaN(qty) || qty <= 0) return
    setOverride(day, addProductId, { quantity: qty, unit: addUnit, removed: false })
    setAddProductId(''); setAddQty('')
  }

  function handleAddToActive() {
    if (tab === 'base') addBaseItem()
    else addOverrideItem(tab)
  }

  // Products still selectable to add in the current tab (exclude ones already present).
  const presentIds = useMemo(() => {
    if (tab === 'base') return new Set(baseItems.map((b) => b.productId))
    const ids = new Set(baseItems.map((b) => b.productId))
    for (const o of overrides[tab] ?? []) ids.add(o.productId)
    return ids
  }, [tab, baseItems, overrides])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Inserisci un nome')
      return
    }

    // Build the payload: base + pruned per-weekday overrides (only rows that actually
    // differ from base or remove/add a product, and only for selected weekdays).
    const base = baseItems.map(({ productId, quantity, unit }) => ({
      productId,
      quantity: Number(quantity) || 0,
      unit,
    }))
    const baseMap = new Map(base.map((b) => [b.productId, b]))
    const overridesPayload: Record<number, RecurringOverrideItem[]> = {}
    for (const day of weekdays) {
      const pruned = (overrides[day] ?? [])
        .map((o) => ({ productId: o.productId, quantity: Number(o.quantity) || 0, unit: o.unit, removed: o.removed }))
        .filter((o) => {
          const b = baseMap.get(o.productId)
          if (o.removed) return !!b // removing only matters for base products
          if (!b) return true // product added just for this day
          return b.quantity !== o.quantity || b.unit !== o.unit // changed vs base
        })
      if (pruned.length > 0) overridesPayload[day] = pruned
    }

    setIsLoading(true)
    try {
      if (isNew) {
        const newCustomer = await create({ name: name.trim(), type: isFixed ? 'fixed' : 'single' })
        if (isFixed) await upsertRecurringOrder(newCustomer.id, weekdays, base, overridesPayload)
        toast.success('Cliente creato')
      } else {
        await update(customer.id, { name: name.trim(), type: isFixed ? 'fixed' : 'single' })
        if (isFixed) await upsertRecurringOrder(customer.id, weekdays, base, overridesPayload)
        toast.success('Cliente aggiornato')
      }
      // The recurring template + customer name/type feed the COMPUTED orders view,
      // statistics, and the "Aggiunte" baseline. Invalidate all three after the commit.
      await globalMutate(
        (key) =>
          Array.isArray(key) &&
          (key[0] === 'orders' || key[0] === 'statistics' || key[0] === 'recurring-base'),
      )
      onClose()
    } catch {
      toast.error('Errore durante il salvataggio')
    } finally {
      setIsLoading(false)
    }
  }

  const sortedWeekdays = WEEKDAYS.filter((d) => weekdays.includes(d.value))

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
                  if (!val) { setWeekdays([]); setBaseItems([]); setOverrides({}); setTab('base') }
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
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                          )}
                        >
                          {d.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Tab bar: Base + one tab per selected weekday */}
                <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setTab('base')}
                    className={cn(
                      'rounded-lg px-3 py-1 text-xs font-semibold transition-colors shrink-0',
                      tab === 'base' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
                    )}
                  >
                    Base
                  </button>
                  {sortedWeekdays.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setTab(d.value)}
                      className={cn(
                        'rounded-lg px-3 py-1 text-xs font-semibold transition-colors shrink-0',
                        tab === d.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {/* Panel */}
                <div className="space-y-2">
                  {tab === 'base' ? (
                    <>
                      <Label className="text-xs">Articoli base (validi per tutti i giorni)</Label>
                      <div className="space-y-1.5">
                        {baseItems.length === 0 && (
                          <p className="text-xs text-slate-400">Nessun articolo aggiunto.</p>
                        )}
                        {displayItems.map((item) => (
                          <div
                            key={item.localId}
                            ref={registerRow(item.localId)}
                            className={cn(
                              'flex items-center gap-1.5 rounded-lg transition-colors',
                              draggingId === item.localId && 'bg-slate-100 ring-2 ring-slate-300',
                            )}
                          >
                            {canReorder && (
                              <div
                                {...dragHandleProps(item.localId)}
                                className="shrink-0 cursor-grab touch-none select-none text-slate-300 transition-colors hover:text-slate-500 active:cursor-grabbing"
                                aria-label="Trascina per riordinare"
                              >
                                <GripVertical className="h-3.5 w-3.5" />
                              </div>
                            )}
                            <span className="flex-1 truncate text-xs text-slate-700">
                              {productName(item.productId)}
                            </span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0.01"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => updateBaseQty(item.localId, e.target.value)}
                              className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-center text-xs outline-none"
                            />
                            <Select value={item.unit} onValueChange={(v) => updateBaseUnit(item.localId, v as 'pieces' | 'kg')}>
                              <SelectTrigger className="w-[3.5rem] rounded-lg text-xs h-7 px-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pieces">pz</SelectItem>
                                <SelectItem value="kg">kg</SelectItem>
                              </SelectContent>
                            </Select>
                            <button
                              type="button"
                              onClick={() => removeBaseItem(item.localId)}
                              className="text-slate-300 transition-colors hover:text-red-500"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <WeekdayPanel
                      day={tab}
                      baseItems={baseItems}
                      overrides={overrides[tab] ?? []}
                      productName={productName}
                      onSetOverride={(productId, patch) => setOverride(tab, productId, patch)}
                      onClearOverride={(productId) => clearOverride(tab, productId)}
                    />
                  )}

                  {/* Add product row (targets the active tab) */}
                  <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2">
                    <Select value={addProductId} onValueChange={setAddProductId}>
                      <SelectTrigger className="flex-1 rounded-xl text-xs h-8">
                        <SelectValue placeholder="Aggiungi prodotto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {groupedProducts.map(({ section, products: sp }) => {
                          const selectable = sp.filter((p) => !presentIds.has(p.id))
                          if (selectable.length === 0) return null
                          return (
                            <SelectGroup key={section.id}>
                              <SelectLabel className={cn('text-xs', section.color)}>{section.name}</SelectLabel>
                              {selectable.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectGroup>
                          )
                        })}
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
                      inputMode="decimal"
                      min="0.01"
                      step="any"
                      value={addQty}
                      placeholder="Qtà"
                      onChange={(e) => setAddQty(e.target.value)}
                      className="w-12 rounded-xl border border-slate-200 px-1 py-1.5 text-center text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddToActive}
                      disabled={!addProductId}
                      className="rounded-xl bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  {tab !== 'base' && (
                    <p className="text-[11px] leading-tight text-slate-400">
                      Le modifiche qui valgono solo per {WEEKDAYS.find((d) => d.value === tab)?.label}. Gli
                      articoli non modificati seguono la base.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 shrink-0 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl bg-slate-900 hover:bg-slate-800">
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

// --- Weekday override panel -------------------------------------------------

interface WeekdayPanelProps {
  day: Weekday
  baseItems: DraftItem[]
  overrides: DraftOverride[]
  productName: (id: string) => string
  onSetOverride: (productId: string, patch: Partial<DraftOverride>) => void
  onClearOverride: (productId: string) => void
}

function WeekdayPanel({ day, baseItems, overrides, productName, onSetOverride, onClearOverride }: WeekdayPanelProps) {
  const ovByProduct = new Map(overrides.map((o) => [o.productId, o]))
  const baseIds = new Set(baseItems.map((b) => b.productId))
  const label = WEEKDAYS.find((d) => d.value === day)?.label ?? ''
  const addedRows = overrides.filter((o) => !baseIds.has(o.productId))

  return (
    <>
      <Label className="text-xs">Articoli di {label}</Label>
      <div className="space-y-1.5">
        {baseItems.length === 0 && addedRows.length === 0 && (
          <p className="text-xs text-slate-400">Nessun articolo. La base è vuota.</p>
        )}

        {/* Base products, with per-day override / removal */}
        {baseItems.map((b) => {
          const o = ovByProduct.get(b.productId)
          const removed = o?.removed ?? false
          const qty = o && !o.removed ? o.quantity : b.quantity
          const unit = o && !o.removed ? o.unit : b.unit
          const changed = !!o && !o.removed && (Number(o.quantity) !== Number(b.quantity) || o.unit !== b.unit)

          if (removed) {
            return (
              <div key={b.productId} className="flex items-center gap-1.5 rounded-lg bg-red-50/60 px-1 py-1">
                <span className="flex-1 truncate text-xs text-slate-400 line-through">
                  {productName(b.productId)}
                </span>
                <span className="text-[10px] font-medium text-red-500">rimosso</span>
                <button
                  type="button"
                  title="Reintegra dalla base"
                  onClick={() => onClearOverride(b.productId)}
                  className="text-slate-400 transition-colors hover:text-slate-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          }

          return (
            <div key={b.productId} className="flex items-center gap-1.5">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs text-slate-700">{productName(b.productId)}</span>
                {changed && (
                  <span className="text-[10px] text-slate-400">base: {b.quantity} {b.unit === 'kg' ? 'kg' : 'pz'}</span>
                )}
              </div>
              <input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="any"
                value={qty}
                onChange={(e) => onSetOverride(b.productId, { quantity: e.target.value, removed: false })}
                className={cn(
                  'w-14 rounded-lg border px-2 py-1 text-center text-xs outline-none',
                  changed ? 'border-amber-300 bg-amber-50' : 'border-slate-200',
                )}
              />
              <Select value={unit} onValueChange={(v) => onSetOverride(b.productId, { unit: v as 'pieces' | 'kg', removed: false })}>
                <SelectTrigger className="w-[3.5rem] rounded-lg text-xs h-7 px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pieces">pz</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
              <button
                type="button"
                title="Togli per questo giorno"
                onClick={() => onSetOverride(b.productId, { removed: true })}
                className="text-slate-300 transition-colors hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}

        {/* Products added only for this weekday */}
        {addedRows.map((o) => (
          <div key={o.productId} className="flex items-center gap-1.5">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs text-slate-700">{productName(o.productId)}</span>
              <span className="text-[10px] font-medium text-emerald-600">solo {label}</span>
            </div>
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="any"
              value={o.quantity}
              onChange={(e) => onSetOverride(o.productId, { quantity: e.target.value })}
              className="w-14 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-center text-xs outline-none"
            />
            <Select value={o.unit} onValueChange={(v) => onSetOverride(o.productId, { unit: v as 'pieces' | 'kg' })}>
              <SelectTrigger className="w-[3.5rem] rounded-lg text-xs h-7 px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pieces">pz</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              title="Rimuovi"
              onClick={() => onClearOverride(o.productId)}
              className="text-slate-300 transition-colors hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
