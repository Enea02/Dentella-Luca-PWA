'use client'

import { useOrders } from '@/hooks/useData'
import { useAppStore } from '@/lib/store'
import { CustomerList } from '@/components/orders/CustomerList'
import { DayOrder } from '@/components/orders/DayOrder'

export default function OrdersPage() {
  const { selectedDate, selectedCustomerId } = useAppStore()
  const { orders, isLoading, toggleItem, addItem, updateItem } = useOrders(selectedDate)

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

  return (
    <div className="grid gap-4 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr]">
      {/* Customer list (left column) */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900 mb-3">Clienti</h1>
        <CustomerList orders={orders} isLoading={isLoading} />
      </div>

      {/* Order details (right column) */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Ordine</h2>
        <DayOrder
          order={selectedOrder}
          onToggleItem={handleToggleItem}
          onAddItem={handleAddItem}
          onUpdateItemVariant={handleUpdateItemVariant}
        />
      </div>
    </div>
  )
}
