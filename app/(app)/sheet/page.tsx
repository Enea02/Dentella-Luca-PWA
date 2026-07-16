'use client'

import { useMemo, useState } from 'react'
import { useOrders, useProducts, useSections, useCustomers } from '@/hooks/useData'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/auth/permissions'
import { SheetCell } from '@/components/sheet/SheetCell'
import { cn, toPieces } from '@/lib/utils'
import { Loader2, Plus, ShieldAlert, X } from 'lucide-react'
import { toast } from 'sonner'
import type { OrderItem } from '@/lib/types'

export default function SheetPage() {
  const { selectedDate } = useAppStore()
  const { user } = useAuth()
  const { orders, isLoading: ordersLoading, addItem, updateItem, removeItem } = useOrders(selectedDate)
  const { products, isLoading: productsLoading } = useProducts()
  const { sections } = useSections()
  const { customers, create: createCustomer } = useCustomers()

  const [extraIds, setExtraIds] = useState<string[]>([])
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const canEdit = can(user, 'orders:edit')

  // Columns: products grouped by section (section order), sorted by name within group.
  const columns = useMemo(
    () =>
      [...sections]
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
          section: s,
          products: products
            .filter((p) => p.section === s.name)
            .sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .filter((g) => g.products.length > 0),
    [sections, products],
  )
  // Flat list + column index lookup for keyboard navigation.
  const flatProducts = columns.flatMap((c) => c.products)
  const colIndexByProduct = new Map(flatProducts.map((p, i) => [p.id, i]))

  const orderByCustomer = new Map(orders.map((o) => [o.customerId, o]))

  // Rows: customers with an order today + customers just added from this page.
  const rows = useMemo(() => {
    const present = new Set(orders.map((o) => o.customerId))
    const list = orders.map((o) => ({ customerId: o.customerId, name: o.customerName }))
    for (const id of extraIds) {
      if (present.has(id)) continue
      const c = customers.find((cc) => cc.id === id)
      list.push({ customerId: id, name: c?.name ?? '—' })
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [orders, extraIds, customers])

  // Column totals in pieces (consistent with the Totali page).
  const totals = new Map<string, number>()
  for (const o of orders) {
    for (const it of o.items) {
      const p = products.find((pp) => pp.id === it.productId)
      totals.set(it.productId, (totals.get(it.productId) ?? 0) + toPieces(it.quantity, it.unit, p?.piecesPerKg))
    }
  }

  const itemFor = (customerId: string, productId: string): OrderItem | undefined =>
    orderByCustomer.get(customerId)?.items.find((i) => i.productId === productId)

  const handleCommit = (
    customerId: string,
    productId: string,
    quantity: number,
    unit: 'pieces' | 'kg',
  ) => {
    if (itemFor(customerId, productId)) updateItem(customerId, productId, { quantity, unit })
    else addItem(customerId, { productId, quantity, unit, done: false })
  }

  const handleAddCustomer = async () => {
    const n = newName.trim()
    if (!n) return
    setAdding(true)
    try {
      const c = await createCustomer({ name: n, type: 'single' })
      setExtraIds((prev) => [...prev, c.id])
      setNewName('')
      setAddOpen(false)
    } catch {
      toast.error('Errore durante la creazione del cliente')
    } finally {
      setAdding(false)
    }
  }

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <ShieldAlert className="h-12 w-12 text-slate-400" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">Accesso negato</h2>
          <p className="text-slate-500">Non hai i permessi per modificare gli ordini</p>
        </div>
      </div>
    )
  }

  if (ordersLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  const thick = 'border-l-2 border-l-slate-400'
  const colCount = 1 + flatProducts.length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-slate-900">Foglio del giorno</h1>
        <span className="text-xs text-slate-400">
          {rows.length} {rows.length === 1 ? 'cliente' : 'clienti'} · Invio/frecce per spostarti
        </span>
      </div>

      {columns.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-200">
          Nessun prodotto configurato.
        </div>
      ) : (
        <div className="overflow-auto max-h-[calc(100dvh-140px)] rounded-xl bg-white ring-1 ring-slate-300 shadow-sm">
          <table className="border-collapse text-sm">
            <thead>
              {/* Section labels */}
              <tr className="sticky top-0 z-30">
                <th
                  rowSpan={2}
                  className="sticky left-0 z-40 bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-slate-600 border border-slate-300 min-w-[8rem]"
                >
                  Cliente
                </th>
                {columns.map((c) => (
                  <th
                    key={c.section.id}
                    colSpan={c.products.length}
                    className={cn(
                      'bg-slate-100 px-2 py-1 text-center text-[11px] font-semibold border border-slate-300',
                      thick,
                    )}
                  >
                    <span className={cn('px-2 py-0.5 rounded-full', c.section.color)}>{c.section.name}</span>
                  </th>
                ))}
              </tr>
              {/* Product names + default unit */}
              <tr className="sticky top-[35px] z-30">
                {columns.map((c, ci) =>
                  c.products.map((p, pi) => (
                    <th
                      key={p.id}
                      className={cn(
                        'bg-slate-50 px-1 py-2 align-bottom border border-slate-200',
                        pi === 0 && ci > 0 && thick,
                      )}
                    >
                      <div className="mx-auto w-14 truncate text-[11px] font-medium text-slate-700" title={p.name}>
                        {p.name}
                      </div>
                      <div className="text-[9px] uppercase tracking-wide text-slate-400">
                        {p.unit === 'kg' ? 'kg' : 'pz'}
                      </div>
                    </th>
                  )),
                )}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, ri) => (
                <tr key={row.customerId} className="group">
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-3 py-1 font-medium text-slate-800 border border-slate-300 max-w-[10rem] truncate">
                    {row.name}
                  </td>
                  {columns.map((c, ci) =>
                    c.products.map((p, pi) => {
                      const colIndex = colIndexByProduct.get(p.id) ?? 0
                      return (
                        <td
                          key={p.id}
                          className={cn(
                            'border border-slate-200 p-0 h-11',
                            'focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 focus-within:bg-blue-50',
                            pi === 0 && ci > 0 && thick,
                          )}
                        >
                          <SheetCell
                            product={p}
                            item={itemFor(row.customerId, p.id)}
                            r={ri}
                            c={colIndex}
                            onCommit={(pid, q, u) => handleCommit(row.customerId, pid, q, u)}
                            onRemove={(pid) => removeItem(row.customerId, pid)}
                          />
                        </td>
                      )
                    }),
                  )}
                </tr>
              ))}

              {/* Empty-state hint when there are no rows yet */}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={colCount}
                    className="border border-slate-200 px-4 py-6 text-center text-sm text-slate-400"
                  >
                    Nessun ordine per questa data. Aggiungi un cliente qui sotto.
                  </td>
                </tr>
              )}

              {/* Add-customer row (bottom of the sheet, like a spreadsheet) */}
              <tr>
                <td className="sticky left-0 z-10 bg-slate-50 border border-slate-300 p-0">
                  {addOpen ? (
                    <div className="flex items-center gap-1 px-2 py-1.5">
                      <input
                        autoFocus
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddCustomer()
                          if (e.key === 'Escape') { setAddOpen(false); setNewName('') }
                        }}
                        placeholder="Nome cliente..."
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomer}
                        disabled={adding || !newName.trim()}
                        className="shrink-0 rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        {adding ? '…' : 'OK'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAddOpen(false); setNewName('') }}
                        className="shrink-0 text-slate-400 hover:text-slate-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddOpen(true)}
                      className="flex w-full items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Aggiungi cliente
                    </button>
                  )}
                </td>
                <td colSpan={flatProducts.length} className="bg-slate-50/40 border border-slate-200" />
              </tr>
            </tbody>

            <tfoot>
              <tr className="sticky bottom-0 z-20">
                <td className="sticky left-0 z-30 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-300">
                  Totale (pz)
                </td>
                {columns.map((c, ci) =>
                  c.products.map((p, pi) => (
                    <td
                      key={p.id}
                      className={cn(
                        'bg-slate-100 px-1 py-2 text-center text-xs font-semibold text-slate-800 border border-slate-300 tabular-nums',
                        pi === 0 && ci > 0 && thick,
                      )}
                    >
                      {totals.get(p.id) ?? 0}
                    </td>
                  )),
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
