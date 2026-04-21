'use client'

import { useMemo, useState } from 'react'
import { useOrders, useProducts } from '@/hooks/useData'
import { useAppStore } from '@/lib/store'
import { ProductListCard } from '@/components/product-lists/ProductListCard'
import { Input } from '@/components/ui/input'
import { Search, Loader2 } from 'lucide-react'

export default function ProductListsPage() {
  const { selectedDate } = useAppStore()
  const { orders, isLoading: ordersLoading } = useOrders(selectedDate)
  const { products, isLoading: productsLoading } = useProducts()
  const [search, setSearch] = useState('')

  const isLoading = ordersLoading || productsLoading

  // Build product lists with customer orders
  const productLists = useMemo(() => {
    const map = new Map<string, { product: typeof products[0], customerOrders: { customerName: string, quantity: number, unit: string }[] }>()

    for (const order of orders) {
      for (const item of order.items) {
        const product = products.find(p => p.id === item.productId)
        if (!product) continue

        if (!map.has(product.id)) {
          map.set(product.id, { product, customerOrders: [] })
        }

        map.get(product.id)!.customerOrders.push({
          customerName: order.customerName,
          quantity: item.quantity,
          unit: item.unit,
        })
      }
    }

    return Array.from(map.values())
      .filter(pl => pl.customerOrders.length > 0)
      .sort((a, b) => a.product.name.localeCompare(b.product.name))
  }, [orders, products])

  // Filter by search
  const filteredLists = useMemo(() => {
    if (!search.trim()) return productLists
    const q = search.toLowerCase()
    return productLists.filter(pl => 
      pl.product.name.toLowerCase().includes(q) ||
      pl.product.section.toLowerCase().includes(q)
    )
  }, [productLists, search])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
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

      {filteredLists.length === 0 ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 text-center">
          <p className="text-slate-500">
            {search ? 'Nessun prodotto trovato' : 'Nessun ordine per questa data'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredLists.map(pl => (
            <ProductListCard
              key={pl.product.id}
              product={pl.product}
              customerOrders={pl.customerOrders}
            />
          ))}
        </div>
      )}
    </div>
  )
}
