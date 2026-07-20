'use client'

import { useState } from 'react'
import { ChevronDown, Star, SlidersHorizontal } from 'lucide-react'
import { useProducts, useSections, useRecurringBase } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/auth/permissions'
import { cn, toPieces } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { OrderItem } from '@/lib/types'

interface AdditionsBoardProps {
  date: string
  orderItems: OrderItem[]
}

// Additions are always shown in pieces (pz), even for products normally sold by weight.
function fmt(pieces: number): string {
  return `${Math.round(pieces)} pz`
}

export function AdditionsBoard({ date, orderItems }: AdditionsBoardProps) {
  const { products, update } = useProducts()
  const { sections } = useSections()
  const { base } = useRecurringBase(date)
  const { user } = useAuth()
  const canManage = can(user, 'products:write')
  const [isOpen, setIsOpen] = useState(false)

  const baseByProduct = new Map(base.map((b) => [b.productId, b.pieces]))

  // Actual production (pieces) per product from today's computed orders.
  const actualByProduct = new Map<string, number>()
  for (const item of orderItems) {
    const product = products.find((p) => p.id === item.productId)
    const pieces = toPieces(item.quantity, item.unit, product?.piecesPerKg)
    actualByProduct.set(item.productId, (actualByProduct.get(item.productId) ?? 0) + pieces)
  }

  // Watched products with a non-zero delta vs the recurring baseline.
  const watched = products.filter((p) => p.additionsWatch)
  const rows = watched
    .map((product) => {
      const actual = actualByProduct.get(product.id) ?? 0
      const basePieces = baseByProduct.get(product.id) ?? 0
      const deltaPieces = actual - basePieces
      return { product, actual, deltaPieces }
    })
    .filter((r) => Math.round(r.deltaPieces) !== 0)
    .sort((a, b) => a.product.name.localeCompare(b.product.name))

  const groupedProducts = [...sections]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      section: s,
      products: products
        .filter((p) => p.section === s.name)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.products.length > 0)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2">
        <CollapsibleTrigger className="flex-1">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-amber-100 text-amber-900 transition-colors">
            <div className="flex items-center gap-2">
              <ChevronDown className={cn('h-4 w-4 transition-transform', !isOpen && '-rotate-90')} />
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span className="font-semibold">Aggiunte</span>
            </div>
            <span className="text-xs font-medium text-amber-700">
              {rows.length === 0 ? 'nessuna' : `${rows.length} ${rows.length === 1 ? 'articolo' : 'articoli'}`}
            </span>
          </div>
        </CollapsibleTrigger>

        {/* Star manager: choose which products appear here (admin — products:write). */}
        {canManage && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              title="Scegli i prodotti da seguire"
              aria-label="Scegli i prodotti da seguire"
              className="shrink-0 rounded-xl bg-amber-100 p-3 text-amber-700 transition-colors hover:bg-amber-200"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-0 rounded-2xl">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">Prodotti seguiti</p>
              <p className="text-xs text-slate-500">Compaiono nella bacheca Aggiunte</p>
            </div>
            <ScrollArea className="h-72">
              <div className="p-2 space-y-2">
                {groupedProducts.map(({ section, products: sp }) => (
                  <div key={section.id}>
                    <p className={cn('px-2 py-1 text-xs font-semibold rounded-md inline-block', section.color)}>
                      {section.name}
                    </p>
                    <div className="mt-1 space-y-0.5">
                      {sp.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => update(p.id, { additionsWatch: !p.additionsWatch })}
                          className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <span className="text-sm text-slate-700 truncate">{p.name}</span>
                          <Star
                            className={cn(
                              'h-4 w-4 shrink-0',
                              p.additionsWatch ? 'fill-amber-400 text-amber-400' : 'text-slate-300',
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {groupedProducts.length === 0 && (
                  <p className="px-2 py-4 text-center text-sm text-slate-400">Nessun prodotto</p>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        )}
      </div>

      <CollapsibleContent>
        <div className="mt-2 space-y-1">
          {watched.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">
              Nessun prodotto seguito.{canManage ? ' Usa il pulsante a destra per aggiungerne.' : ''}
            </p>
          ) : rows.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">
              Nessuna aggiunta rispetto alla base fissa del giorno.
            </p>
          ) : (
            rows.map(({ product, actual, deltaPieces }) => {
              const positive = deltaPieces > 0
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between px-4 py-2 rounded-lg bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-700 truncate">{product.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        positive ? 'text-emerald-600' : 'text-red-600',
                      )}
                    >
                      {positive ? '+' : '−'}
                      {fmt(Math.abs(deltaPieces))}
                    </span>
                    <span className="text-slate-300">=</span>
                    <span className="text-sm font-bold text-slate-900 min-w-[3.5rem] text-right">
                      {fmt(actual)}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
