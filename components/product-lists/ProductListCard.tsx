'use client'

import { cn } from '@/lib/utils'
import { SECTION_COLORS } from '@/lib/constants'
import type { Product, ComputedDayOrder } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CustomerOrder {
  customerName: string
  quantity: number
  unit: string
}

interface ProductListCardProps {
  product: Product
  customerOrders: CustomerOrder[]
}

export function ProductListCard({ product, customerOrders }: ProductListCardProps) {
  const unitLabel = product.unit === 'kg' ? 'kg' : 'pz'
  const totalQty = customerOrders.reduce((sum, co) => sum + co.quantity, 0)

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-900 truncate">{product.name}</h3>
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
            SECTION_COLORS[product.section]
          )}>
            {product.section}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1 text-sm">
          <span className="text-slate-500">{customerOrders.length} clienti</span>
          <span className="font-medium text-slate-700">
            Tot: {totalQty} {unitLabel}
          </span>
        </div>
      </div>

      {/* Customer list */}
      <ScrollArea className="flex-1 max-h-48">
        <div className="px-4 py-2 space-y-1">
          {customerOrders
            .sort((a, b) => a.customerName.localeCompare(b.customerName))
            .map((co, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between text-sm py-1"
              >
                <span className="text-slate-600 truncate">{co.customerName}</span>
                <span className="text-slate-900 font-medium shrink-0 ml-2">
                  {co.quantity} {co.unit === 'kg' ? 'kg' : 'pz'}
                </span>
              </div>
            ))
          }
        </div>
      </ScrollArea>
    </div>
  )
}
