'use client'

import { cn } from '@/lib/utils'
import type { OrderItem, Product } from '@/lib/types'
import { Check } from 'lucide-react'
import { useAppStore } from '@/lib/store'

interface ProductLineStaffProps {
  item: OrderItem
  product: Product | undefined
  onToggle: (done: boolean) => void
}

export function ProductLineStaff({ item, product, onToggle }: ProductLineStaffProps) {
  const unitLabel = item.unit === 'kg' ? 'kg' : 'pz'
  const workMode = useAppStore(state => state.workMode)

  return (
    <button
      onClick={() => onToggle(!item.done)}
      className={cn(
        'w-full px-4 rounded-xl text-left transition-all',
        'flex items-center justify-between gap-3',
        'hover:shadow-sm active:scale-[0.99]',
        workMode ? 'py-5' : 'py-3',
        item.done
          ? 'bg-emerald-50 ring-1 ring-emerald-200'
          : 'bg-white ring-1 ring-slate-200'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          'rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
          workMode ? 'h-7 w-7' : 'h-5 w-5',
          item.done
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-300'
        )}>
          {item.done && <Check className={cn(workMode ? 'h-4 w-4' : 'h-3 w-3', 'text-white')} />}
        </div>
        <div className="min-w-0">
          <p className={cn(
            'font-medium truncate',
            workMode ? 'text-base' : 'text-sm',
            item.done ? 'text-emerald-800 line-through opacity-70' : 'text-slate-900'
          )}>
            {product?.name || 'Prodotto sconosciuto'}
          </p>
          <p className={cn(
            item.done ? 'text-emerald-600' : 'text-slate-500',
            workMode ? 'text-sm' : 'text-xs'
          )}>
            {product?.section}
          </p>
        </div>
      </div>
      <div className={cn(
        'font-semibold shrink-0',
        workMode ? 'text-base' : 'text-sm',
        item.done ? 'text-emerald-700' : 'text-slate-700'
      )}>
        {item.quantity} {unitLabel}
      </div>
    </button>
  )
}
