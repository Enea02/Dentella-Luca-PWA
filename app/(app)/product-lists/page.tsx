'use client'

import { useMemo, useState } from 'react'
import { useOrders, useProducts, useSections } from '@/hooks/useData'
import { useAppStore } from '@/lib/store'
import { ProductListCard } from '@/components/product-lists/ProductListCard'
import { Input } from '@/components/ui/input'
import { Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProductListsPage() {
  const { selectedDate } = useAppStore()
  const { orders, isLoading: ordersLoading } = useOrders(selectedDate)
  const { products, isLoading: productsLoading } = useProducts()
  const [search, setSearch] = useState('')

  const isLoading = ordersLoading || productsLoading

  const productLists = useMemo(() => {
    const map = new Map<string, { product: typeof products[0]; customerOrders: { customerName: string; quantity: number; unit: string }[] }>()

    for (const order of orders) {
      for (const item of order.items) {
        const product = products.find(p => p.id === item.productId)
        if (!product) continue
        if (!map.has(product.id)) map.set(product.id, { product, customerOrders: [] })
        map.get(product.id)!.customerOrders.push({
          customerName: order.customerName,
          quantity: item.quantity,
          unit: item.unit,
        })
      }
    }

    return Array.from(map.values()).filter(pl => pl.customerOrders.length > 0)
  }, [orders, products])

  const { sections } = useSections()
  const q = search.toLowerCase()

  const grouped = [...sections].sort((a, b) => a.order - b.order).map(s => ({
    section: s,
    items: productLists
      .filter(pl => pl.product.section === s.name)
      .filter(pl => !q || pl.product.name.toLowerCase().includes(q) || pl.product.section.toLowerCase().includes(q))
      .sort((a, b) => a.product.name.localeCompare(b.product.name)),
  })).filter(g => g.items.length > 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg font-semibold text-slate-900">Liste Prodotti</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cerca prodotto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 text-center">
          <p className="text-slate-500">
            {search ? 'Nessun prodotto trovato' : 'Nessun ordine per questa data'}
          </p>
        </div>
      ) : (
        grouped.map(({ section, items }) => (
          <div key={section.id}>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', section.color)}>
                {section.name}
              </span>
              <span className="text-xs text-slate-400">
                {items.length} {items.length === 1 ? 'prodotto' : 'prodotti'}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(pl => (
                <ProductListCard
                  key={pl.product.id}
                  product={pl.product}
                  customerOrders={pl.customerOrders}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
