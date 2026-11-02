'use client'

import { useMemo } from 'react'
import { toast } from 'sonner'
import { useCustomers, useOrders } from '@/hooks/useData'
import { usePanettoniForDate } from '@/hooks/usePanettoni'
import type { ComputedDayOrder } from '@/lib/types'
import type { PanettoneItemState } from '@/lib/panettoni/types'
import { useAppStore } from '@/lib/store'
import { CustomerList } from '@/components/orders/CustomerList'
import { DayOrder } from '@/components/orders/DayOrder'

export default function OrdersPage() {
  const { selectedDate, selectedCustomerId, setSelectedCustomerId } = useAppStore()
  const { orders, isLoading, toggleItem, addItem, updateItem, removeItem, clearOrder } = useOrders(selectedDate)
  const { customers } = useCustomers()
  const panettoni = usePanettoniForDate(selectedDate)

  // Customers linked to the Panettoni section can have only panettoni on this day:
  // list them too (with no gestionale items). Done here, not in GET /api/orders,
  // so Totali / Produzione / Foglio never see them.
  const ordersWithPanettoni = useMemo(() => {
    const merged: ComputedDayOrder[] = [...orders]
    for (const [customerId, list] of panettoni.byCustomer) {
      if (merged.some(o => o.customerId === customerId)) continue
      const customer = customers.find(c => c.id === customerId)
      merged.push({
        customerId,
        customerName: customer?.name ?? list[0].customerName,
        customerType: customer?.type ?? 'single',
        items: [],
        status: 'pending',
      })
    }
    return merged
  }, [orders, panettoni.byCustomer, customers])

  // Panettoni pieces per customer, for the badge in the list.
  const panettoniPieces = useMemo(() => {
    const map = new Map<string, number>()
    for (const [customerId, list] of panettoni.byCustomer) {
      map.set(customerId, list.reduce((a, o) => a + o.items.reduce((b, i) => b + i.qty, 0), 0))
    }
    return map
  }, [panettoni.byCustomer])

  const selectedOrder = ordersWithPanettoni.find(o => o.customerId === selectedCustomerId) || null
  const selectedPanettoni = (selectedCustomerId && panettoni.byCustomer.get(selectedCustomerId)) || []

  const handleAddPanettone = async (flavorId: string, qty: number) => {
    if (selectedCustomerId) {
      await panettoni.addPanettone(selectedCustomerId, flavorId, qty)
    }
  }

  const handleSetPanettoneQty = (orderId: string, flavorId: string, qty: number) => {
    panettoni.setQty(orderId, flavorId, qty).catch(() => toast.error('Errore durante il salvataggio del panettone'))
  }

  const handleSetPanettoneState = (orderId: string, flavorId: string, state: PanettoneItemState) => {
    panettoni.setItemState(orderId, flavorId, state).catch(() => toast.error('Errore durante il salvataggio del panettone'))
  }

  const handleToggleItem = async (productId: string, done: boolean) => {
    if (selectedCustomerId) {
      await toggleItem(selectedCustomerId, productId, done)
    }
  }

  const handleAddItem = async (item: import('@/lib/types').OrderItem) => {
    if (selectedCustomerId) {
      await addItem(selectedCustomerId, item)
    }
  }

  const handleUpdateItemVariant = async (productId: string, variant: string) => {
    if (selectedCustomerId) {
      await updateItem(selectedCustomerId, productId, { variant })
    }
  }

  const handleUpdateItem = async (productId: string, quantity: number, unit: 'pieces' | 'kg') => {
    if (selectedCustomerId) {
      await updateItem(selectedCustomerId, productId, { quantity, unit })
    }
  }

  const handleRemoveItem = async (productId: string) => {
    if (selectedCustomerId) {
      await removeItem(selectedCustomerId, productId)
    }
  }

  const handleClearOrder = async () => {
    if (selectedCustomerId) {
      await clearOrder(selectedCustomerId)
      // The customer is now hidden from the list (0 items); reset the detail pane.
      setSelectedCustomerId(null)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr]">
      {/* Customer list (left column) */}
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-slate-900 mb-3">Clienti</h1>
        <CustomerList orders={ordersWithPanettoni} panettoniPieces={panettoniPieces} isLoading={isLoading} />
      </div>

      {/* Order details (right column) */}
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Ordine</h2>
        <DayOrder
          order={selectedOrder}
          onToggleItem={handleToggleItem}
          onAddItem={handleAddItem}
          onUpdateItemVariant={handleUpdateItemVariant}
          onUpdateItem={handleUpdateItem}
          onRemoveItem={handleRemoveItem}
          onClearOrder={handleClearOrder}
          panettoni={selectedPanettoni}
          onAddPanettone={handleAddPanettone}
          onSetPanettoneQty={handleSetPanettoneQty}
          onSetPanettoneState={handleSetPanettoneState}
        />
      </div>
    </div>
  )
}
