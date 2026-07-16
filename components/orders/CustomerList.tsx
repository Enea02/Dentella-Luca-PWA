'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { cn, getOrderStatus, sortByStatus } from '@/lib/utils'
import type { ComputedDayOrder, OrderItem } from '@/lib/types'
import { STATUS_COLORS } from '@/lib/constants'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/auth/permissions'
import { useOrders } from '@/hooks/useData'
import { NewDailyOrderDialog } from './NewDailyOrderDialog'

interface CustomerListProps {
  orders: ComputedDayOrder[]
  isLoading: boolean
}

export function CustomerList({ orders, isLoading }: CustomerListProps) {
  const { selectedCustomerId, setSelectedCustomerId, selectedDate, workMode } = useAppStore()
  const { user } = useAuth()
  const { createOrder } = useOrders(selectedDate)
  const [search, setSearch] = useState('')
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)

  const sortedOrders = sortByStatus(
    orders.map(order => ({ ...order, status: getOrderStatus(order.items) }))
  )
    // Hide orders with no items: a fixed customer "emptied" for the day (B1) has an
    // empty daily-order override and must disappear from the list for that date.
    .filter(order => order.items.length > 0)
    .filter(order => order.customerName.toLowerCase().includes(search.toLowerCase()))

  const handleCreateOrder = async (customerId: string, items: OrderItem[]) => {
    await createOrder(customerId, items)
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        {/* Search bar + new order button */}
        <div className="flex items-center gap-2 p-3 border-b border-slate-100">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca cliente..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
          {can(user, 'orders:edit') && (
            <button
              type="button"
              onClick={() => setIsNewOrderOpen(true)}
              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shrink-0"
            >
              + Nuovo
            </button>
          )}
        </div>

        {sortedOrders.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-slate-500">
            {search ? 'Nessun cliente trovato' : 'Nessun ordine per questa data'}
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-260px)] md:h-[55vh]">
            <div className="p-2 space-y-1">
              {sortedOrders.map((order) => {
                const isSelected = selectedCustomerId === order.customerId
                const doneCount = order.items.filter(i => i.done).length
                const totalCount = order.items.length
                const status = getOrderStatus(order.items)

                return (
                  <button
                    key={order.customerId}
                    onClick={() => setSelectedCustomerId(order.customerId)}
                    className={cn(
                      'w-full px-4 rounded-xl text-left transition-all',
                      'flex items-center justify-between gap-2',
                      workMode ? 'py-4' : 'py-3',
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : STATUS_COLORS[status]
                    )}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className={cn(
                        'font-medium truncate',
                        workMode ? 'text-base' : 'text-sm',
                        isSelected ? 'text-white' : 'text-slate-900'
                      )}>
                        {order.customerName}
                      </span>
                      <span className={cn(
                        workMode ? 'text-sm' : 'text-xs',
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      )}>
                        {order.customerType === 'fixed' ? 'Fisso' : 'Giornaliero'}
                      </span>
                    </div>
                    <div className={cn(
                      'font-semibold shrink-0',
                      workMode ? 'text-base' : 'text-sm',
                      isSelected ? 'text-slate-200' :
                        status === 'done' ? 'text-emerald-700' :
                        status === 'partial' ? 'text-red-700' : 'text-slate-500'
                    )}>
                      {doneCount}/{totalCount}
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      <NewDailyOrderDialog
        open={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        onSave={handleCreateOrder}
        existingOrders={orders}
      />
    </>
  )
}
