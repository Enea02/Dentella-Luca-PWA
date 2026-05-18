'use client'

import { useMemo, useState } from 'react'
import { useOrders, useProducts, useProductionGroups, useSections } from '@/hooks/useData'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/auth/permissions'
import { ProductionTable } from '@/components/production/ProductionTable'
import type { ProductionSection } from '@/components/production/ProductionTable'
import { ProductionGroupsManager } from '@/components/production/ProductionGroupsManager'
import { Button } from '@/components/ui/button'
import { Loader2, Settings2 } from 'lucide-react'

export default function ProductionPage() {
  const { selectedDate } = useAppStore()
  const { user } = useAuth()
  const canEditGroups = can(user, 'production-groups:write')
  const { orders, isLoading: ordersLoading, toggleItem } = useOrders(selectedDate)
  const { products, isLoading: productsLoading } = useProducts()
  const { groups, isLoading: groupsLoading } = useProductionGroups()
  const { sections, isLoading: sectionsLoading } = useSections()

  const [showManager, setShowManager] = useState(false)

  const isLoading = ordersLoading || productsLoading || groupsLoading || sectionsLoading

  const sectionsById = useMemo(
    () => new Map(sections.map(s => [s.id, s])),
    [sections]
  )

  const builtGroups = useMemo(() => {
    return [...groups]
      .sort((a, b) => a.order - b.order)
      .map(group => {
        const groupSections: ProductionSection[] = group.sectionIds
          .map(sid => sectionsById.get(sid))
          .filter((s): s is NonNullable<typeof s> => !!s)
          .map(section => {
            const prods = products.filter(p => p.section === section.name)
            return {
              id: section.id,
              label: section.name,
              products: prods.map(p => ({ id: p.id, name: p.name, unit: p.unit })),
            }
          })
          .filter(s => s.products.length > 0)
        return { id: group.id, name: group.name, sections: groupSections, displayMode: group.displayMode ?? 'by-article' as const }
      })
  }, [groups, products, sectionsById])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Produzione</h1>
        {canEditGroups && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManager(v => !v)}
            className="rounded-xl"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            {showManager ? 'Chiudi' : 'Modifica gruppi'}
          </Button>
        )}
      </div>

      {showManager && canEditGroups && (
        <ProductionGroupsManager onClose={() => setShowManager(false)} />
      )}

      {orders.length === 0 ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 text-center">
          <p className="text-slate-500">Nessun ordine per questa data</p>
        </div>
      ) : builtGroups.length === 0 ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 text-center">
          <p className="text-slate-500">
            Nessun gruppo configurato.{' '}
            {canEditGroups && 'Usa "Modifica gruppi" per crearne uno.'}
          </p>
        </div>
      ) : (
        builtGroups.map(group => (
          <ProductionTable
            key={group.id}
            title={group.name}
            sections={group.sections}
            displayMode={group.displayMode}
            orders={orders}
            onToggleCell={(customerId, productId, done) => toggleItem(customerId, productId, done)}
          />
        ))
      )}
    </div>
  )
}
