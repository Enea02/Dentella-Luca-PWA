'use client'

import { useOrders, useProducts, useDivisors, useSections } from '@/hooks/useData'
import { useAppStore } from '@/lib/store'
import { TotalsSection } from '@/components/totals/TotalsSection'
import { Loader2 } from 'lucide-react'

export default function TotalsPage() {
  const { selectedDate } = useAppStore()
  const { orders, isLoading: ordersLoading } = useOrders(selectedDate)
  const { products, isLoading: productsLoading } = useProducts()
  const { divisors, update: updateDivisor } = useDivisors()
  const { sections } = useSections()

  const isLoading = ordersLoading || productsLoading

  // Flatten all order items
  const allItems = orders.flatMap(order => order.items)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold text-slate-900 mb-4">Totali del giorno</h1>
      
      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 space-y-4">
        {[...sections].sort((a, b) => a.order - b.order).map(s => (
          <TotalsSection
            key={s.id}
            section={s.name}
            color={s.color}
            products={products}
            orderItems={allItems}
            divisors={divisors}
            onUpdateDivisor={updateDivisor}
          />
        ))}

        {allItems.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500">Nessun ordine per questa data</p>
          </div>
        )}
      </div>
    </div>
  )
}
