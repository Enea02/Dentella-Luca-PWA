'use client'

import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { usePanettoneFlavors, usePanettoneOrders } from '@/hooks/usePanettoni'
import { can } from '@/lib/auth/permissions'
import { orderTotal, shortDate } from '@/lib/panettoni/helpers'
import { currentSeason } from '@/lib/panettoni/types'
import { alpha } from './status'

// Delivered orders, most recent first. "Ripristina" puts one back in the table as `stock`.
export function ArchiveList() {
  const { user } = useAuth()
  const canToggle = can(user, 'orders:toggle')
  const { flavors } = usePanettoneFlavors()
  const { orders, setStatus } = usePanettoneOrders(currentSeason())

  const done = orders
    .filter((o) => o.status === 'done')
    .sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? ''))
  const pieces = done.reduce((a, o) => a + orderTotal(o), 0)

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-base font-semibold text-slate-900">Archivio ordini consegnati</h2>
        <span className="text-xs text-slate-400">
          {done.length} ordini · {pieces} pz consegnati
        </span>
      </div>

      {done.length === 0 ? (
        <div className="rounded-xl bg-white ring-1 ring-slate-200 px-6 py-10 text-center text-[13px] text-slate-400">
          Nessun ordine consegnato.
        </div>
      ) : (
        <div className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
          {done.map((o) => (
            <div key={o.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 flex-wrap">
              <span className="shrink-0 h-2.5 w-2.5 rounded-full bg-green-500" />
              <div className="min-w-40 flex-1">
                <div className="text-sm font-semibold text-slate-900">{o.customerName}</div>
                <div className="text-[11px] text-slate-500">
                  {o.phone ?? '—'} · consegna {o.deliveryKind === 'preciso' ? 'il' : 'entro il'} {shortDate(o.deliveryDate)}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 flex-[2] min-w-[200px]">
                {flavors
                  .map((f) => ({ f, qty: o.items.find((i) => i.flavorId === f.id)?.qty ?? 0 }))
                  .filter(({ qty }) => qty > 0)
                  .map(({ f, qty }) => (
                    <span
                      key={f.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ backgroundColor: alpha(f.color, 0.08), color: f.color }}
                    >
                      {qty} {f.name}
                    </span>
                  ))}
              </div>
              <div className="text-sm font-bold text-slate-900 tabular-nums min-w-12 text-right">{orderTotal(o)} pz</div>
              {canToggle && (
                <button
                  type="button"
                  onClick={() =>
                    setStatus(o.id, 'stock').catch(() => toast.error('Errore durante il ripristino'))
                  }
                  className="h-[34px] px-3 rounded-[10px] border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Ripristina
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
