'use client'

import { useAuth } from '@/hooks/useAuth'
import { useProducts } from '@/hooks/useData'
import type { ComputedDayOrder } from '@/lib/types'
import { ProductLineStaff } from './ProductLineStaff'
import { ProductLineOwner } from './ProductLineOwner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getOrderStatus } from '@/lib/utils'
import { STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface DayOrderProps {
  order: ComputedDayOrder | null
  onToggleItem: (productId: string, done: boolean) => void
}

export function DayOrder({ order, onToggleItem }: DayOrderProps) {
  const { role } = useAuth()
  const { products } = useProducts()

  if (!order) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 text-center h-full flex items-center justify-center">
        <p className="text-slate-500">Seleziona un cliente per vedere l&apos;ordine</p>
      </div>
    )
  }

  const status = getOrderStatus(order.items)
  const doneCount = order.items.filter(i => i.done).length

  return (
    <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">{order.customerName}</h2>
            <p className="text-xs text-slate-500">
              {order.customerType === 'fixed' ? 'Cliente fisso' : 'Cliente giornaliero'}
            </p>
          </div>
          <div className={cn(
            'px-3 py-1 rounded-full text-xs font-medium',
            STATUS_COLORS[status]
          )}>
            {doneCount}/{order.items.length} completati
          </div>
        </div>
      </div>

      {/* Items list */}
      <ScrollArea className="flex-1 h-[calc(100vh-350px)] md:h-[50vh]">
        <div className="p-3 space-y-2">
          {order.items.map((item) => {
            const product = products.find(p => p.id === item.productId)
            
            if (role === 'owner') {
              return (
                <ProductLineOwner
                  key={item.productId}
                  item={item}
                  product={product}
                  onToggle={(done) => onToggleItem(item.productId, done)}
                />
              )
            }

            return (
              <ProductLineStaff
                key={item.productId}
                item={item}
                product={product}
                onToggle={(done) => onToggleItem(item.productId, done)}
              />
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
