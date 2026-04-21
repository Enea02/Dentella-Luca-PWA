'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { cn, getOrderStatus, sortByStatus } from '@/lib/utils'
import type { ComputedDayOrder } from '@/lib/types'
import { STATUS_COLORS } from '@/lib/constants'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CustomerListProps {
  orders: ComputedDayOrder[]
  isLoading: boolean
}

export function CustomerList({ orders, isLoading }: CustomerListProps) {
  const { selectedCustomerId, setSelectedCustomerId } = useAppStore()

  // Sort orders by status (pending first, then partial, then done)
  const sortedOrders = useMemo(() => {
    const withStatus = orders.map(order => ({
      ...order,
      status: getOrderStatus(order.items),
    }))
    return sortByStatus(withStatus)
  }, [orders])

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

  if (sortedOrders.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 text-center">
        <p className="text-slate-500">Nessun ordine per questa data</p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      <ScrollArea className="h-[calc(100vh-200px)] md:h-[62vh]">
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
                  'w-full px-4 py-3 rounded-xl text-left transition-all',
                  'flex items-center justify-between gap-2',
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : STATUS_COLORS[status]
                )}
              >
                <div className="flex flex-col min-w-0">
                  <span className={cn(
                    'font-medium truncate',
                    isSelected ? 'text-white' : 'text-slate-900'
                  )}>
                    {order.customerName}
                  </span>
                  <span className={cn(
                    'text-xs',
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  )}>
                    {order.customerType === 'fixed' ? 'Fisso' : 'Giornaliero'}
                  </span>
                </div>
                <div className={cn(
                  'text-sm font-medium shrink-0',
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
    </div>
  )
}
