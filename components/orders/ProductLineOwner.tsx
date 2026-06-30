'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { OrderItem, Product } from '@/lib/types'
import { PIZZA_VARIANT_SECTION } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Check } from 'lucide-react'

interface ProductLineOwnerProps {
  item: OrderItem
  product: Product | undefined
  onToggle: (done: boolean) => void
  onUpdate?: (quantity: number, unit: 'pieces' | 'kg') => void
  onUpdateVariant?: (variant: string) => void
  onRemove?: () => void
}

export function ProductLineOwner({ item, product, onToggle, onUpdate, onUpdateVariant, onRemove }: ProductLineOwnerProps) {
  const [quantity, setQuantity] = useState(item.quantity.toString())
  const [variant, setVariant] = useState(item.variant ?? '')

  // Keep the local input in sync with the data. Without this, React reuses this
  // component instance for products shared across customers (same productId key),
  // and the quantity field keeps showing the previously-viewed customer's value.
  useEffect(() => { setQuantity(item.quantity.toString()) }, [item.quantity])
  useEffect(() => { setVariant(item.variant ?? '') }, [item.variant])

  const isPizza = product?.section === PIZZA_VARIANT_SECTION

  const handleQuantityBlur = () => {
    const num = parseFloat(quantity)
    if (!isNaN(num) && num > 0 && num !== item.quantity) {
      onUpdate?.(num, item.unit)
    } else if (num <= 0) {
      onRemove?.()
    } else {
      setQuantity(item.quantity.toString())
    }
  }

  const handleVariantBlur = () => {
    const next = variant.trim()
    if (next !== (item.variant ?? '')) {
      onUpdateVariant?.(next)
    }
  }

  return (
    <div className={cn(
      'px-3 md:px-4 py-3 rounded-xl transition-all',
      'flex flex-col gap-2',
      item.done
        ? 'bg-emerald-50 ring-1 ring-emerald-200'
        : 'bg-white ring-1 ring-slate-200'
    )}>
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {/* Toggle checkbox */}
        <button
          onClick={() => onToggle(!item.done)}
          className={cn(
            'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
            item.done
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-slate-300 hover:border-slate-400'
          )}
        >
          {item.done && <Check className="h-3 w-3 text-white" />}
        </button>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-medium truncate text-sm',
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

        {/* Quantity input */}
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onBlur={handleQuantityBlur}
          className="w-12 md:w-16 h-8 px-1 md:px-3 text-center text-sm rounded-lg shrink-0"
          min={0}
          step={item.unit === 'kg' ? 'any' : 1}
        />

        {/* Unit select */}
        <Select
          value={item.unit}
          onValueChange={(value) => onUpdate?.(item.quantity, value as 'pieces' | 'kg')}
        >
          <SelectTrigger className="w-14 md:w-16 h-8 px-2 text-xs rounded-lg shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pieces">pz</SelectItem>
            <SelectItem value="kg">kg</SelectItem>
          </SelectContent>
        </Select>

        {/* Remove button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-red-600 shrink-0"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Variant input (only for Pizze farcite) */}
      {isPizza && onUpdateVariant && (
        <div className="flex items-center gap-2 pl-8">
          <span className="text-xs text-slate-500 shrink-0">Variante:</span>
          <Input
            type="text"
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            onBlur={handleVariantBlur}
            placeholder="Es. extra prosciutto, senza olive..."
            className="h-7 text-xs rounded-lg"
          />
        </div>
      )}
    </div>
  )
}
