'use client'

import { cn } from '@/lib/utils'
import type { OrderItem, Product } from '@/lib/types'
import { Check } from 'lucide-react'

interface ProductLineStaffProps {
  item: OrderItem
  product: Product | undefined
  onToggle: (done: boolean) => void
}

export function ProductLineStaff({ item, product, onToggle }: ProductLineStaffProps) {
  const unitLabel = item.unit === 'kg' ? 'kg' : 'pz'

  return (
    <button
      onClick={() => onToggle(!item.done)}
      className={cn(
        'w-full px-4 py-3 rounded-xl text-left transition-all',
        'flex items-center justify-between gap-3',
        'hover:shadow-sm active:scale-[0.99]',
        item.done
          ? 'bg-emerald-50 ring-1 ring-emerald-200'
          : 'bg-white ring-1 ring-slate-200'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
          item.done
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-300'
        )}>
          {item.done && <Check className="h-3 w-3 text-white" />}
        </div>
        <div className="min-w-0">
          <p className={cn(
            'font-medium truncate',
            item.done ? 'text-emerald-800 line-through opacity-70' : 'text-slate-900'
          )}>
            {product?.name || 'Prodotto sconosciuto'}
          </p>
          <p className={cn(
            'text-xs',
            item.done ? 'text-emerald-600' : 'text-slate-500'
          )}>
            {product?.section}
          </p>
        </div>
      </div>
      <div className={cn(
        'text-sm font-semibold shrink-0',
        item.done ? 'text-emerald-700' : 'text-slate-700'
      )}>
        {item.quantity} {unitLabel}
      </div>
    </button>
  )
}
