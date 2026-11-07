'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { usePanettoneFlavors, usePanettoneOrders, usePanettoneSeasons } from '@/hooks/usePanettoni'
import { can } from '@/lib/auth/permissions'
import { archiveByCustomer, orderTotal, shortDate } from '@/lib/panettoni/helpers'
import { currentSeason, type PanettoneFlavor } from '@/lib/panettoni/types'
import { cn } from '@/lib/utils'
import { alpha } from './status'

// Delivered orders grouped by customer, with the pieces delivered to each one
// per flavor. One campaign at a time, or every campaign ("Tutti gli anni").
// "Ripristina" puts an order of the current campaign back in the table as `stock`.
export function ArchiveList() {
  const { user } = useAuth()
  const canToggle = can(user, 'orders:toggle')
  const thisSeason = currentSeason()
  const [season, setSeason] = useState<number | 'all'>(thisSeason)
  const [search, setSearch] = useState('')
  const seasons = usePanettoneSeasons()
  const { flavors } = usePanettoneFlavors()
  const { orders, isLoading, setStatus } = usePanettoneOrders(season)

  const customers = archiveByCustomer(orders, search)
  const allDone = orders.filter((o) => o.status === 'done')
  const pieces = allDone.reduce((a, o) => a + orderTotal(o), 0)
  const shownOrders = customers.reduce((a, c) => a + c.orders.length, 0)
  const seasonOptions = seasons.length > 0 ? seasons : [thisSeason]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-base font-semibold text-slate-900">Archivio ordini consegnati</h2>
        <span className="text-xs text-slate-400">
          {allDone.length} ordini · {pieces} pz consegnati
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca cliente…"
            aria-label="Cerca cliente"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-900 outline-none focus:border-slate-400 [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Cancella ricerca"
              className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {[...seasonOptions, 'all' as const].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeason(s)}
              className={cn(
                'h-11 shrink-0 rounded-xl border px-3.5 text-[13px] font-semibold',
                season === s ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600',
              )}
            >
              {s === 'all' ? 'Tutti gli anni' : `Natale ${s}`}
            </button>
          ))}
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-xl bg-white ring-1 ring-slate-200 px-6 py-10 text-center text-[13px] text-slate-400">
          {isLoading ? 'Caricamento…' : search ? `Nessun cliente trovato per “${search}”.` : 'Nessun ordine consegnato.'}
        </div>
      ) : (
        <>
          {search && (
            <span className="text-xs text-slate-500">
              {customers.length} {customers.length === 1 ? 'cliente' : 'clienti'} · {shownOrders} ordini
            </span>
          )}
          {customers.map((c) => (
            <section key={c.key} className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
              <header className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-slate-50 px-4 py-3 border-b border-slate-200">
                <div className="min-w-40 flex-1">
                  <div className="text-[15px] font-bold text-slate-900">{c.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {c.orders.length} {c.orders.length === 1 ? 'ordine' : 'ordini'}
                    {c.customerId ? ' · cliente del gestionale' : ''}
                  </div>
                </div>
                <FlavorChips flavors={flavors} qtyOf={(id) => c.byFlavor.get(id) ?? 0} strong />
                <div className="min-w-14 text-right">
                  <div className="text-base font-bold tabular-nums text-slate-900">{c.total} pz</div>
                  <div className="text-[10px] font-semibold uppercase tracking-[.05em] text-slate-400">consegnati</div>
                </div>
              </header>

              {c.orders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 last:border-b-0 flex-wrap">
                  <span className="shrink-0 h-2.5 w-2.5 rounded-full bg-green-500" />
                  <div className="min-w-40 flex-1">
                    {o.customerName !== c.name && (
                      <div className="text-[13px] font-semibold text-slate-900">{o.customerName}</div>
                    )}
                    <div className="text-[11px] text-slate-500">
                      {season === 'all' ? `Natale ${o.season} · ` : ''}
                      consegna {o.deliveryKind === 'preciso' ? 'il' : 'entro il'} {shortDate(o.deliveryDate)}
                      {o.phone ? ` · ${o.phone}` : ''}
                    </div>
                  </div>
                  <FlavorChips
                    flavors={flavors}
                    qtyOf={(id) => o.items.find((i) => i.flavorId === id)?.qty ?? 0}
                  />
                  <div className="text-sm font-bold text-slate-900 tabular-nums min-w-12 text-right">{orderTotal(o)} pz</div>
                  {canToggle && o.season === thisSeason && (
                    <button
                      type="button"
                      onClick={() => setStatus(o.id, 'stock').catch(() => toast.error('Errore durante il ripristino'))}
                      className="h-[34px] px-3 rounded-[10px] border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Ripristina
                    </button>
                  )}
                </div>
              ))}
            </section>
          ))}
        </>
      )}
    </div>
  )
}

/** "12 Classico · 6 Pistacchio" as colored chips, in the table's flavor order. */
function FlavorChips({
  flavors,
  qtyOf,
  strong,
}: {
  flavors: PanettoneFlavor[]
  qtyOf: (flavorId: string) => number
  strong?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1 flex-[2] min-w-[200px]">
      {flavors
        .map((f) => ({ f, qty: qtyOf(f.id) }))
        .filter(({ qty }) => qty > 0)
        .map(({ f, qty }) => (
          <span
            key={f.id}
            className={cn(
              'inline-flex items-center gap-1 rounded-full font-semibold',
              strong ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]',
            )}
            style={{ backgroundColor: alpha(f.color, strong ? 0.14 : 0.08), color: f.color }}
          >
            {qty} {f.name}
          </span>
        ))}
    </div>
  )
}
