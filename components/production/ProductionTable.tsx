'use client'

import { cn, getOrderStatus } from '@/lib/utils'
import { STATUS_COLORS } from '@/lib/constants'
import type { ComputedDayOrder, Product } from '@/lib/types'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

interface ProductionColumn {
  id: string
  label: string
  productIds: string[]
}

interface ProductionTableProps {
  title: string
  columns: ProductionColumn[]
  orders: ComputedDayOrder[]
  products: Product[]
  onToggleCell: (customerId: string, productId: string, done: boolean) => void
}

export function ProductionTable({ 
  title, 
  columns, 
  orders, 
  products,
  onToggleCell 
}: ProductionTableProps) {
  // Filter orders that have at least one item in these columns
  const relevantOrders = orders.filter(order => {
    const productIds = columns.flatMap(c => c.productIds)
    return order.items.some(item => productIds.includes(item.productId))
  })

  if (relevantOrders.length === 0) {
    return null
  }

  return (
    <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>

      <ScrollArea className="w-full">
        <div className="min-w-max">
          {/* Header */}
          <div className="flex border-b border-slate-100">
            <div className="w-40 shrink-0 px-3 py-2 text-xs font-medium text-slate-500 bg-slate-50">
              Cliente
            </div>
            {columns.map(col => (
              <div 
                key={col.id}
                className="w-24 shrink-0 px-2 py-2 text-xs font-medium text-slate-500 text-center bg-slate-50"
              >
                {col.label}
              </div>
            ))}
          </div>

          {/* Rows */}
          {relevantOrders.map(order => {
            const status = getOrderStatus(order.items)
            return (
              <div key={order.customerId} className="flex border-b border-slate-50 last:border-0">
                <div className={cn(
                  'w-40 shrink-0 px-3 py-2 text-sm font-medium',
                  STATUS_COLORS[status]
                )}>
                  <span className="truncate block">{order.customerName}</span>
                </div>
                {columns.map(col => {
                  // Get items for this column's products
                  const colItems = order.items.filter(item => 
                    col.productIds.includes(item.productId)
                  )
                  
                  if (colItems.length === 0) {
                    return (
                      <div 
                        key={col.id}
                        className="w-24 shrink-0 px-2 py-2 text-center text-slate-300"
                      >
                        -
                      </div>
                    )
                  }

                  // Sum quantities and check if all done
                  const totalQty = colItems.reduce((sum, item) => sum + item.quantity, 0)
                  const allDone = colItems.every(item => item.done)
                  const productNames = colItems.map(item => {
                    const product = products.find(p => p.id === item.productId)
                    return product?.name.split(' ').pop() || ''
                  }).join(', ')

                  return (
                    <button
                      key={col.id}
                      onClick={() => {
                        // Toggle the first item in this column
                        const firstItem = colItems[0]
                        if (firstItem) {
                          onToggleCell(order.customerId, firstItem.productId, !allDone)
                        }
                      }}
                      className={cn(
                        'w-24 shrink-0 px-2 py-2 text-center transition-colors',
                        allDone ? 'bg-emerald-100' : 'hover:bg-slate-50'
                      )}
                    >
                      <span className={cn(
                        'text-sm font-medium',
                        allDone ? 'text-emerald-700' : 'text-slate-700'
                      )}>
                        {totalQty}
                      </span>
                      {colItems.length === 1 && productNames && (
                        <span className={cn(
                          'block text-xs truncate',
                          allDone ? 'text-emerald-600' : 'text-slate-400'
                        )}>
                          {productNames}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
