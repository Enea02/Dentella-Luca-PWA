'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/auth/permissions'
import { cn, toPieces } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { Product, ProductSection, OrderItem, Divisor } from '@/lib/types'
interface ProductTotal {
  product: Product
  totalPieces: number
  divisor: number
}

interface TotalsSectionProps {
  section: ProductSection
  color: string
  products: Product[]
  orderItems: OrderItem[]
  divisors: Divisor[]
  onUpdateDivisor: (productId: string, value: number) => void
}

export function TotalsSection({
  section,
  color,
  products,
  orderItems,
  divisors,
  onUpdateDivisor
}: TotalsSectionProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  // Calculate totals for each product in this section
  const productTotals: ProductTotal[] = products
    .filter(p => p.section === section)
    .map(product => {
      const items = orderItems.filter(item => item.productId === product.id)
      const totalPieces = items.reduce((sum, item) => sum + toPieces(item.quantity, item.unit, product.piecesPerKg), 0)
      const divisor = divisors.find(d => d.productId === product.id)?.value || 1
      return { product, totalPieces, divisor }
    })
    .filter(pt => pt.totalPieces > 0)

  if (productTotals.length === 0) {
    return null
  }

  const sectionTotal = productTotals.reduce((sum, pt) => sum + pt.totalPieces, 0)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          'flex items-center justify-between px-4 py-3 rounded-xl transition-colors',
          color
        )}>
          <div className="flex items-center gap-2">
            <ChevronDown className={cn(
              'h-4 w-4 transition-transform',
              !isOpen && '-rotate-90'
            )} />
            <span className="font-semibold">{section}</span>
          </div>
          <span className="font-bold">{sectionTotal} pz</span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-1">
          {productTotals.map(({ product, totalPieces, divisor }) => (
            <TotalsRow
              key={product.id}
              product={product}
              totalPieces={totalPieces}
              divisor={divisor}
              isOwner={can(user, 'divisors:write')}
              onUpdateDivisor={(value) => onUpdateDivisor(product.id, value)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface TotalsRowProps {
  product: Product
  totalPieces: number
  divisor: number
  isOwner: boolean
  onUpdateDivisor: (value: number) => void
}

function TotalsRow({ product, totalPieces, divisor, isOwner, onUpdateDivisor }: TotalsRowProps) {
  const [localDivisor, setLocalDivisor] = useState(divisor.toString())
  const result = Math.ceil(totalPieces / divisor)

  const handleBlur = () => {
    const num = parseInt(localDivisor, 10)
    if (!isNaN(num) && num > 0 && num !== divisor) {
      onUpdateDivisor(num)
    } else {
      setLocalDivisor(divisor.toString())
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 rounded-lg transition-colors bg-slate-50">
      <span className="text-sm font-medium text-slate-700">
        {product.name}
      </span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">{totalPieces} pz</span>
        
        {isOwner ? (
          <>
            <span className="text-slate-400">/</span>
            <Input
              type="number"
              value={localDivisor}
              onChange={(e) => setLocalDivisor(e.target.value)}
              onBlur={handleBlur}
              className="w-14 h-7 text-center text-sm rounded-lg"
              min={1}
            />
          </>
        ) : (
          divisor > 1 && (
            <>
              <span className="text-slate-400">/ {divisor}</span>
            </>
          )
        )}

        {divisor > 1 && (
          <>
            <span className="text-slate-400">=</span>
            <span className="font-semibold text-slate-900 min-w-[3rem] text-right">
              {result}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
