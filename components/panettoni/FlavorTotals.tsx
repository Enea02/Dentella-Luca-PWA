'use client'

import { usePanettoneFlavors, usePanettoneOrders } from '@/hooks/usePanettoni'
import { currentSeason } from '@/lib/panettoni/types'

// Pieces still to deliver per flavor (orders not yet `done`, flavors not yet handed over).
export function FlavorTotals() {
  const { flavors } = usePanettoneFlavors()
  const { orders } = usePanettoneOrders(currentSeason())
  const active = orders.filter((o) => o.status !== 'done')

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
      {flavors
        .filter((f) => f.active)
        .map((f) => {
          let total = 0
          let customers = 0
          for (const o of active) {
            const item = o.items.find((i) => i.flavorId === f.id)
            const q = item && !item.delivered ? item.qty : 0
            total += q
            if (q) customers++
          }
          return (
            <div
              key={f.id}
              className="rounded-xl bg-white ring-1 ring-slate-200 px-4 py-3.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-3.5 w-3.5 rounded shrink-0" style={{ backgroundColor: f.color }} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{f.name}</div>
                  <div className="text-[11px] text-slate-400">{customers} clienti</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 tabular-nums">{total}</div>
            </div>
          )
        })}
    </div>
  )
}
