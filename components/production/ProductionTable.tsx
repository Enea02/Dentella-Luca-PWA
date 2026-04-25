'use client'

import { cn, getOrderStatus } from '@/lib/utils'
import { STATUS_COLORS } from '@/lib/constants'
import type { ComputedDayOrder } from '@/lib/types'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

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
}

export function ProductionTable({ title, sections, orders, onToggleCell }: ProductionTableProps) {
  const allProductIds = sections.flatMap(s => s.products.map(p => p.id))

  const relevantOrders = orders.filter(order =>
    order.items.some(item => allProductIds.includes(item.productId))
  )

  if (relevantOrders.length === 0) return null

  return (
    <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>

      <ScrollArea className="w-full">
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
              const status = getOrderStatus(order.items)
              return (
                <tr key={order.customerId} className="border-b border-slate-50 last:border-0">
                  {/* Customer name cell */}
                  <td className={cn(
                    'w-36 px-3 py-2 text-sm font-medium border-r border-slate-100 align-middle',
                    STATUS_COLORS[status]
                  )}>
                    <span className="block truncate">{order.customerName}</span>
                  </td>

                  {/* Product cells */}
                  {sections.map(section =>
                    section.products.map((product, idx) => {
                      const item = order.items.find(i => i.productId === product.id)

                      if (!item) {
                        return (
                          <td
                            key={product.id}
                            className={cn(
                              'w-20 text-center text-slate-300 text-sm align-middle',
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
                            'w-20 p-0 align-middle',
                            idx === section.products.length - 1 && 'border-r border-slate-100'
                          )}
                        >
                          <button
                            onClick={() => onToggleCell(order.customerId, product.id, !item.done)}
                            className={cn(
                              'w-full h-full min-h-[44px] flex flex-col items-center justify-center gap-0.5 px-1 py-2 transition-colors',
                              item.done ? 'bg-emerald-50' : 'hover:bg-slate-50'
                            )}
                          >
                            <span className={cn(
                              'text-sm font-semibold leading-none',
                              item.done ? 'text-emerald-700' : 'text-slate-800'
                            )}>
                              {item.quantity}
                            </span>
                            <span className={cn(
                              'text-xs leading-none',
                              item.done ? 'text-emerald-500' : 'text-slate-400'
                            )}>
                              {item.unit === 'kg' ? 'kg' : 'pz'}
                            </span>
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
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
