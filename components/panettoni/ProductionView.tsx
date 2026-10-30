'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { usePanettoneFlavors, usePanettoneOrders, usePanettonePlanSettings } from '@/hooks/usePanettoni'
import { can } from '@/lib/auth/permissions'
import { dowShort, isPlanStale, todayRome } from '@/lib/panettoni/helpers'
import { plannableOrders } from '@/lib/panettoni/plan'
import { currentSeason } from '@/lib/panettoni/types'
import { cn } from '@/lib/utils'
import { DayDetail } from './PlanView'

// "Cosa impastare oggi" from the CONFIRMED plan. Each flavor of a day can be
// marked "fatto": its pieces are credited to the destination orders, which
// move to `stock` once fully produced (see /api/panettoni/production).
export function ProductionView() {
  const season = currentSeason()
  const { user } = useAuth()
  const canToggle = can(user, 'orders:toggle')
  const { flavors } = usePanettoneFlavors()
  const { orders } = usePanettoneOrders(season)
  const { settings, isLoading, markProduced } = usePanettonePlanSettings(season)
  const [selDay, setSelDay] = useState<string | null>(null)

  const flavorById = new Map(flavors.map((f) => [f.id, f]))
  const plan = settings?.confirmedPlan ?? null
  const stale = isPlanStale(orders, settings)

  if (isLoading && !settings) {
    return <div className="py-10 text-center text-[13px] text-slate-400">Caricamento…</div>
  }

  if (!plan) {
    // Without a plan, show what is still to bake per flavor (todo orders).
    const remaining = new Map<string, { qty: number; customers: number }>()
    for (const o of plannableOrders(orders)) {
      for (const i of o.items) {
        const r = remaining.get(i.flavorId) ?? { qty: 0, customers: 0 }
        remaining.set(i.flavorId, { qty: r.qty + i.qty, customers: r.customers + 1 })
      }
    }
    const list = [...remaining].sort((a, b) => b[1].qty - a[1].qty)
    return (
      <div className="flex flex-col gap-3">
        <Notice tone="amber" title="Piano non confermato">
          La produzione giorno per giorno compare dopo aver confermato il piano in{' '}
          <Link href="/panettoni/pianificazione" replace className="font-semibold underline">
            Pianificazione
          </Link>
          . Intanto ecco cosa resta da produrre in totale.
        </Notice>
        <div className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Da produrre</h2>
            <span className="text-xs text-slate-400">ordini da fare, esclusi i pezzi già prodotti</span>
          </div>
          {list.length === 0 && (
            <div className="px-4 py-6 text-center text-[13px] text-slate-400">Niente da produrre.</div>
          )}
          {list.map(([flavorId, r]) => {
            const f = flavorById.get(flavorId)
            return (
              <div key={flavorId} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: f?.color }} />
                  <span className="text-sm font-semibold text-slate-900">{f?.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500">{r.customers} clienti</span>
                  <span className="text-lg font-bold text-slate-900 tabular-nums">{r.qty}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const today = todayRome()
  const workDays = plan.days.filter((d) => d.total > 0)
  const defaultDay =
    workDays.find((d) => d.date === today)?.date ??
    workDays.find((d) => d.date > today)?.date ??
    workDays[workDays.length - 1]?.date ??
    plan.end
  const selDate = selDay && plan.days.some((d) => d.date === selDay) ? selDay : defaultDay
  const sel = plan.days.find((d) => d.date === selDate)!
  const items = Object.values(sel?.items ?? {})
  const doneCount = items.filter((i) => i.done).length

  const toggle = (flavorId: string, done: boolean) =>
    markProduced(selDate, flavorId, done).catch(() => toast.error('Errore durante il salvataggio'))

  return (
    <div className="flex flex-col gap-3">
      {stale && (
        <Notice tone="amber" title="Piano da ricalcolare">
          Sono arrivati o cambiati ordini dopo la conferma: il piano qui sotto non li comprende.{' '}
          <Link href="/panettoni/pianificazione" replace className="font-semibold underline">
            Vai alla Pianificazione
          </Link>
        </Notice>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {workDays.map((d) => {
            const allDone = Object.values(d.items).every((i) => i.done)
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelDay(d.date)}
                className={cn(
                  'shrink-0 min-w-14 rounded-[10px] px-2.5 py-1.5 text-center ring-1',
                  d.date === selDate
                    ? 'bg-slate-900 text-white ring-slate-900'
                    : allDone
                      ? 'bg-green-50 text-green-800 ring-green-200'
                      : 'bg-white text-slate-600 ring-slate-200',
                )}
              >
                <span className="block text-[10px] uppercase tracking-[.04em]">
                  {d.date === today ? 'oggi' : dowShort(d.date)}
                </span>
                <span className="block text-sm font-bold">{Number(d.date.slice(8))}</span>
              </button>
            )
          })}
        </div>
        {items.length > 0 && (
          <span className="text-xs text-slate-500">
            {doneCount}/{items.length} gusti fatti
          </span>
        )}
      </div>

      {workDays.length === 0 ? (
        <div className="rounded-xl bg-white ring-1 ring-slate-200 px-6 py-10 text-center text-[13px] text-slate-400">
          Il piano confermato non ha giorni di produzione.
        </div>
      ) : (
        <DayDetail
          day={sel}
          cap={settings?.cap ?? 0}
          flavorById={flavorById}
          renderAction={(flavorId) => {
            const done = !!sel.items[flavorId]?.done
            return (
              <button
                type="button"
                disabled={!canToggle}
                onClick={() => toggle(flavorId, !done)}
                aria-pressed={done}
                className={cn(
                  'inline-flex items-center gap-1.5 h-10 px-3 rounded-[10px] text-xs font-bold border disabled:opacity-50',
                  done ? 'bg-green-100 border-green-200 text-green-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100',
                )}
              >
                <Check className={cn('h-4 w-4', !done && 'opacity-30')} />
                {done ? 'Fatto' : 'Segna fatto'}
              </button>
            )
          }}
        />
      )}
      <p className="text-xs text-slate-400">
        &quot;Fatto&quot; accredita i pezzi agli ordini indicati: un ordine con tutti i gusti prodotti passa in magazzino.
      </p>
    </div>
  )
}

function Notice({ tone, title, children }: { tone: 'amber'; title: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-xl px-4 py-3 text-[13px]', tone === 'amber' && 'bg-amber-50 ring-1 ring-amber-200 text-amber-800')}>
      <strong>{title}.</strong> {children}
    </div>
  )
}
