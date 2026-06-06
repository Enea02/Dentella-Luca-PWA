'use client'

import { cn, getOrderStatus } from '@/lib/utils'
import { STATUS_COLORS } from '@/lib/constants'
import type { ComputedDayOrder } from '@/lib/types'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'

export interface ProductionSection {
  id: string
  label: string
  products: { id: string; name: string; unit: 'pieces' | 'kg' }[]
}

interface ProductionTableProps {
  title: string
  sections: ProductionSection[]
  orders: ComputedDayOrder[]
  onToggleCell: (customerId: string, productId: string, done: boolean) => void
  displayMode?: 'by-article' | 'by-section'
}

export function ProductionTable({ title, sections, orders, onToggleCell, displayMode = 'by-article' }: ProductionTableProps) {
  const workMode = useAppStore(state => state.workMode)
  const allProductIds = sections.flatMap(s => s.products.map(p => p.id))

  const relevantOrders = orders
    .filter(order => order.items.some(item => allProductIds.includes(item.productId)))
    .sort((a, b) => a.customerName.localeCompare(b.customerName, 'it'))

  if (relevantOrders.length === 0) return null

  return (
    <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>

      {/* Mobile: card list (hidden on md+) */}
      <div className="md:hidden divide-y divide-slate-100">
        {relevantOrders.map(order => {
          const status = getOrderStatus(order.items.filter(i => allProductIds.includes(i.productId)))
          const itemsBySection = sections
            .map(section => ({
              section,
              items: section.products
                .map(product => ({ product, item: order.items.find(i => i.productId === product.id) }))
                .filter((x): x is { product: typeof x.product; item: NonNullable<typeof x.item> } => !!x.item),
            }))
            .filter(s => s.items.length > 0)

          return (
            <div key={order.customerId} className="p-3 space-y-2">
              <div className={cn(
                'inline-flex rounded-lg px-2 py-1 text-sm font-semibold',
                STATUS_COLORS[status]
              )}>
                {order.customerName}
              </div>
              <div className="space-y-2">
                {itemsBySection.map(({ section, items }) => (
                  <div key={section.id}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      {section.label}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {items.map(({ product, item }) => (
                        <button
                          key={product.id}
                          onClick={() => onToggleCell(order.customerId, product.id, !item.done)}
                          className={cn(
                            'flex flex-col items-start gap-0.5 rounded-xl px-2.5 py-2 text-left transition-colors min-h-[52px]',
                            item.done
                              ? 'bg-emerald-50 ring-1 ring-emerald-200'
                              : 'bg-slate-50 ring-1 ring-slate-200 active:bg-slate-100'
                          )}
                        >
                          <span className={cn(
                            'text-sm font-semibold tabular-nums leading-none',
                            item.done ? 'text-emerald-700' : 'text-slate-800'
                          )}>
                            {item.quantity} {item.unit === 'kg' ? 'kg' : 'pz'}
                          </span>
                          <span className={cn(
                            'text-xs leading-tight line-clamp-2',
                            item.done ? 'text-emerald-600' : 'text-slate-500'
                          )}>
                            {product.name}{item.variant ? ` · ${item.variant}` : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: original table (hidden on mobile) */}
      <ScrollArea className="hidden md:block w-full">
        {displayMode === 'by-section' ? (
          <table className="min-w-max w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="w-36 shrink-0 px-3 py-2 text-xs font-medium text-slate-500 bg-slate-50 border-b border-r border-slate-200 align-middle">
                  Cliente
                </th>
                {sections.map(section => (
                  <th
                    key={section.id}
                    className="px-2 py-1.5 text-center text-xs font-bold text-slate-700 bg-slate-100 border-b border-r border-slate-200 last:border-r-0 tracking-wide"
                  >
                    {section.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {relevantOrders.map(order => {
                const status = getOrderStatus(order.items.filter(i => allProductIds.includes(i.productId)))
                return (
                  <tr key={order.customerId} className="border-b border-slate-50 last:border-0">
                    <td className={cn(
                      'px-3 py-2 font-medium border-r border-slate-100 align-middle',
                      workMode ? 'w-44 text-base' : 'w-36 text-sm',
                      STATUS_COLORS[status]
                    )}>
                      <span className="block truncate">{order.customerName}</span>
                    </td>
                    {sections.map(section => {
                      const sectionItems = section.products
                        .map(product => ({ product, item: order.items.find(i => i.productId === product.id) }))
                        .filter((x): x is { product: typeof x.product; item: NonNullable<typeof x.item> } => !!x.item)

                      if (sectionItems.length === 0) {
                        return (
                          <td
                            key={section.id}
                            className="text-center text-slate-300 align-middle border-r border-slate-100 last:border-r-0 px-2"
                          >
                            —
                          </td>
                        )
                      }

                      return (
                        <td key={section.id} className="p-0 align-middle border-r border-slate-100 last:border-r-0">
                          <div className="divide-y divide-slate-50">
                            {sectionItems.map(({ product, item }) => (
                              <button
                                key={product.id}
                                onClick={() => onToggleCell(order.customerId, product.id, !item.done)}
                                className={cn(
                                  'w-full flex flex-col items-center px-2 transition-colors text-center',
                                  workMode ? 'min-h-[48px] py-2 gap-0.5' : 'min-h-[36px] py-1.5 gap-0',
                                  item.done ? 'bg-emerald-50' : 'hover:bg-slate-50'
                                )}
                              >
                                <span className={cn(
                                  'font-semibold tabular-nums leading-none',
                                  workMode ? 'text-base' : 'text-sm',
                                  item.done ? 'text-emerald-700' : 'text-slate-800'
                                )}>
                                  {item.quantity} {item.unit === 'kg' ? 'kg' : 'pz'}
                                </span>
                                <span className={cn(
                                  'leading-tight min-w-0 w-full text-center',
                                  workMode ? 'text-sm' : 'text-xs',
                                  item.done ? 'text-emerald-600' : 'text-slate-500'
                                )}>
                                  {product.name}{item.variant ? ` · ${item.variant}` : ''}
                                </span>
                              </button>
                            ))}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <table className="min-w-max w-full border-collapse text-left">
            <thead>
              {/* Row 1 – section group headers */}
              <tr>
                <th
                  rowSpan={2}
                  className="w-36 shrink-0 px-3 py-2 text-xs font-medium text-slate-500 bg-slate-50 border-b border-r border-slate-200 align-middle"
                >
                  Cliente
                </th>
                {sections.map(section => (
                  <th
                    key={section.id}
                    colSpan={section.products.length}
                    className="px-2 py-1.5 text-center text-xs font-bold text-slate-700 bg-slate-100 border-b border-r border-slate-200 last:border-r-0 tracking-wide"
                  >
                    {section.label}
                  </th>
                ))}
              </tr>

              {/* Row 2 – individual product names */}
              <tr>
                {sections.map(section =>
                  section.products.map((product, idx) => (
                    <th
                      key={product.id}
                      className={cn(
                        'w-20 px-1 py-2 text-center font-normal text-slate-500 bg-slate-50 border-b border-slate-200',
                        idx === section.products.length - 1 && 'border-r border-slate-200'
                      )}
                    >
                      <span className="block text-xs leading-tight whitespace-normal">
                        {product.name}
                      </span>
                    </th>
                  ))
                )}
              </tr>
            </thead>

            <tbody>
              {relevantOrders.map(order => {
                const status = getOrderStatus(order.items.filter(i => allProductIds.includes(i.productId)))
                return (
                  <tr key={order.customerId} className="border-b border-slate-50 last:border-0">
                    <td className={cn(
                      'px-3 py-2 font-medium border-r border-slate-100 align-middle',
                      workMode ? 'w-44 text-base' : 'w-36 text-sm',
                      STATUS_COLORS[status]
                    )}>
                      <span className="block truncate">{order.customerName}</span>
                    </td>

                    {sections.map(section =>
                      section.products.map((product, idx) => {
                        const item = order.items.find(i => i.productId === product.id)

                        if (!item) {
                          return (
                            <td
                              key={product.id}
                              className={cn(
                                'text-center text-slate-300 align-middle',
                                workMode ? 'w-28 text-base' : 'w-20 text-sm',
                                idx === section.products.length - 1 && 'border-r border-slate-100'
                              )}
                            >
                              —
                            </td>
                          )
                        }

                        return (
                          <td
                            key={product.id}
                            className={cn(
                              'p-0 align-middle',
                              workMode ? 'w-28' : 'w-20',
                              idx === section.products.length - 1 && 'border-r border-slate-100'
                            )}
                          >
                            <button
                              onClick={() => onToggleCell(order.customerId, product.id, !item.done)}
                              className={cn(
                                'w-full h-full flex flex-col items-center justify-center gap-0.5 px-1 transition-colors',
                                workMode ? 'min-h-[72px] py-3' : 'min-h-[44px] py-2',
                                item.done ? 'bg-emerald-50' : 'hover:bg-slate-50'
                              )}
                            >
                              <span className={cn(
                                'font-semibold leading-none',
                                workMode ? 'text-base' : 'text-sm',
                                item.done ? 'text-emerald-700' : 'text-slate-800'
                              )}>
                                {item.quantity}
                              </span>
                              <span className={cn(
                                'leading-none',
                                workMode ? 'text-sm' : 'text-xs',
                                item.done ? 'text-emerald-500' : 'text-slate-400'
                              )}>
                                {item.unit === 'kg' ? 'kg' : 'pz'}
                              </span>
                              {item.variant && (
                                <span
                                  title={item.variant}
                                  className={cn(
                                    'mt-0.5 italic leading-tight text-center max-w-full break-words line-clamp-2',
                                    workMode ? 'text-xs' : 'text-[10px]',
                                    item.done ? 'text-emerald-600' : 'text-slate-500'
                                  )}
                                >
                                  {item.variant}
                                </span>
                              )}
                            </button>
                          </td>
                        )
                      })
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
