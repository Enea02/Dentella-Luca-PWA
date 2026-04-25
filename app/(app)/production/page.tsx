'use client'

import { useMemo } from 'react'
import { useOrders, useProducts } from '@/hooks/useData'
import { useAppStore } from '@/lib/store'
import { ProductionTable } from '@/components/production/ProductionTable'
import type { ProductionSection } from '@/components/production/ProductionTable'
import type { ProductSection } from '@/lib/types'
import { Loader2 } from 'lucide-react'

const DOLCI_SECTIONS: ProductSection[] = ['Dolci', 'Specialità']
const PANE_SECTIONS: ProductSection[] = ['Pane comune']
const SALATI_SECTIONS: ProductSection[] = ['Salati', 'Pizze farcite', 'Focacce farcite']

function buildSections(products: ReturnType<typeof useProducts>['products'], sectionNames: ProductSection[]): ProductionSection[] {
  return sectionNames
    .map(name => {
      const prods = products.filter(p => p.section === name)
      if (prods.length === 0) return null
      return {
        id: name,
        label: name,
        products: prods.map(p => ({ id: p.id, name: p.name, unit: p.unit })),
      }
    })
    .filter((s): s is ProductionSection => s !== null)
}

export default function ProductionPage() {
  const { selectedDate } = useAppStore()
  const { orders, isLoading: ordersLoading, toggleItem } = useOrders(selectedDate)
  const { products, isLoading: productsLoading } = useProducts()

  const isLoading = ordersLoading || productsLoading

  const dolciSections = useMemo(() => buildSections(products, DOLCI_SECTIONS), [products])
  const paneSections = useMemo(() => buildSections(products, PANE_SECTIONS), [products])
  const salatiSections = useMemo(() => buildSections(products, SALATI_SECTIONS), [products])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 text-center">
        <p className="text-slate-500">Nessun ordine per questa data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Produzione</h1>

      <ProductionTable
        title="Dolci"
        sections={dolciSections}
        orders={orders}
        onToggleCell={(customerId, productId, done) => toggleItem(customerId, productId, done)}
      />

      <ProductionTable
        title="Pane"
        sections={paneSections}
        orders={orders}
        onToggleCell={(customerId, productId, done) => toggleItem(customerId, productId, done)}
      />

      <ProductionTable
        title="Salati"
        sections={salatiSections}
        orders={orders}
        onToggleCell={(customerId, productId, done) => toggleItem(customerId, productId, done)}
      />
    </div>
  )
}
