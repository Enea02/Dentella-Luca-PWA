'use client'

import { useOrders } from '@/hooks/useData'
import { useAppStore } from '@/lib/store'
import { CustomerList } from '@/components/orders/CustomerList'
import { DayOrder } from '@/components/orders/DayOrder'

export default function OrdersPage() {
  const { selectedDate, selectedCustomerId, setSelectedCustomerId } = useAppStore()
  const { orders, isLoading, toggleItem, addItem, updateItem, removeItem, clearOrder } = useOrders(selectedDate)

  const selectedOrder = orders.find(o => o.customerId === selectedCustomerId) || null

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
        <CustomerList orders={orders} isLoading={isLoading} />
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
        />
      </div>
    </div>
  )
}
