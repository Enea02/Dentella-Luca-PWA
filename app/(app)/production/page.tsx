'use client'

import { useMemo } from 'react'
import { useOrders, useProducts } from '@/hooks/useData'
import { useAppStore } from '@/lib/store'
import { ProductionTable } from '@/components/production/ProductionTable'
import { Loader2 } from 'lucide-react'

export default function ProductionPage() {
  const { selectedDate } = useAppStore()
  const { orders, isLoading: ordersLoading, toggleItem } = useOrders(selectedDate)
  const { products, isLoading: productsLoading } = useProducts()

  const isLoading = ordersLoading || productsLoading

  // Build columns for Dolci production
  const dolciColumns = useMemo(() => {
    const dolciProducts = products.filter(p => p.section === 'Dolci')
    return dolciProducts.map(p => ({
      id: p.id,
      label: p.name.split(' ').slice(-1)[0].substring(0, 8).toUpperCase(),
      productIds: [p.id],
    }))
  }, [products])

  // Build columns for Salati production (grouped)
  const salatiColumns = useMemo(() => {
    const pizzeSemplici = products.filter(p => p.section === 'Salati' && p.name.toLowerCase().includes('pizza'))
    const pizzeFarcite = products.filter(p => p.section === 'Pizze farcite')
    const focacceSemplici = products.filter(p => p.section === 'Salati' && p.name.toLowerCase().includes('focaccia'))
    const focacceFarcite = products.filter(p => p.section === 'Focacce farcite')
    const pale = products.filter(p => p.section === 'Salati' && p.name.toLowerCase().includes('pala'))
    const others = products.filter(p => 
      p.section === 'Salati' && 
      !p.name.toLowerCase().includes('pizza') &&
      !p.name.toLowerCase().includes('focaccia') &&
      !p.name.toLowerCase().includes('pala')
    )

    const columns = []

    if (pizzeSemplici.length > 0 || pizzeFarcite.length > 0) {
      columns.push({
        id: 'pizze',
        label: 'PIZZE',
        productIds: [...pizzeSemplici.map(p => p.id), ...pizzeFarcite.map(p => p.id)],
      })
    }

    if (focacceSemplici.length > 0 || focacceFarcite.length > 0) {
      columns.push({
        id: 'focacce',
        label: 'FOCACCE',
        productIds: [...focacceSemplici.map(p => p.id), ...focacceFarcite.map(p => p.id)],
      })
    }

    if (pale.length > 0) {
      columns.push({
        id: 'pale',
        label: 'PALE',
        productIds: pale.map(p => p.id),
      })
    }

    // Add individual columns for other salati
    others.forEach(p => {
      columns.push({
        id: p.id,
        label: p.name.split(' ').slice(-1)[0].substring(0, 8).toUpperCase(),
        productIds: [p.id],
      })
    })

    return columns
  }, [products])

  const handleToggleCell = async (customerId: string, productId: string, done: boolean) => {
    await toggleItem(customerId, productId, done)
  }

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

      {dolciColumns.length > 0 && (
        <ProductionTable
          title="Produzione Dolci"
          columns={dolciColumns}
          orders={orders}
          products={products}
          onToggleCell={handleToggleCell}
        />
      )}

      {salatiColumns.length > 0 && (
        <ProductionTable
          title="Produzione Salati"
          columns={salatiColumns}
          orders={orders}
          products={products}
          onToggleCell={handleToggleCell}
        />
      )}
    </div>
  )
}
