'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { usePanettoneFlavors, usePanettoneOrders, usePanettonePlanSettings } from '@/hooks/usePanettoni'
import { can } from '@/lib/auth/permissions'
import { dowShort, isPlanStale, longDate, planHorizon, shortDate } from '@/lib/panettoni/helpers'
import { buildPlan, plannableOrders, type PlanResult } from '@/lib/panettoni/plan'
import {
  currentSeason,
  DEFAULT_PLAN_PARAMS,
  type PlanParams,
  type PlanPriority,
  type PlanStrategy,
} from '@/lib/panettoni/types'
import { cn } from '@/lib/utils'

const STRATEGIES: { id: PlanStrategy; label: string; desc: string }[] = [
  { id: 'tardi', label: 'Il più tardi possibile', desc: 'Parte da Natale e va indietro: massima freschezza.' },
  { id: 'bilanciato', label: 'Carico uniforme', desc: 'Distribuisce i pezzi in modo simile su tutti i giorni.' },
  { id: 'presto', label: 'Il prima possibile', desc: 'Produce subito: più margine, panettoni meno freschi.' },
]
const PRIOS: { id: PlanPriority; label: string }[] = [
  { id: 'preciso', label: 'Data precisa' },
  { id: 'entro', label: 'Entro il' },
  { id: 'nessuna', label: 'Indifferente' },
]
const CHART_H = 150 // px available to the tallest bar

export function PlanView() {
  const season = currentSeason()
  const { user } = useAuth()
  const canEdit = can(user, 'orders:edit')
  const { flavors } = usePanettoneFlavors()
  const { orders } = usePanettoneOrders(season)
  const { settings, update, confirm } = usePanettonePlanSettings(season)
  const [selDay, setSelDay] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const P: PlanParams = settings ?? DEFAULT_PLAN_PARAMS
  const horizon = planHorizon(settings ?? { season, startDate: null })
  const stale = isPlanStale(orders, settings)
  const confirmed = !!settings?.confirmedAt
  // A confirmed, still-valid plan is shown as saved (what Produzione follows);
  // otherwise a live preview recomputed at every change.
  const plan: PlanResult =
    confirmed && !stale && settings?.confirmedPlan
      ? settings.confirmedPlan
      : buildPlan(plannableOrders(orders), P, horizon)

  const flavorById = new Map(flavors.map((f) => [f.id, f]))
  const flavorRank = new Map(flavors.map((f, i) => [f.id, i]))

  const setP = (patch: Partial<PlanParams> & { startDate?: string | null }) => {
    if (!canEdit) return
    update(patch).catch(() => toast.error('Errore durante il salvataggio dei vincoli'))
  }
  const doConfirm = async () => {
    setConfirming(true)
    try {
      await confirm()
    } catch {
      toast.error('Errore durante la conferma del piano')
    } finally {
      setConfirming(false)
    }
  }

  const active = plan.days.filter((d) => d.total > 0)
  const peak = active.reduce<(typeof active)[number] | null>((a, d) => (!a || d.total > a.total ? d : a), null)
  const planTotal = active.reduce((a, d) => a + d.total, 0)
  const maxTot = Math.max(P.cap, ...plan.days.map((d) => d.total), 1)
  const scale = CHART_H / maxTot
  const selDate = selDay && plan.days.some((d) => d.date === selDay) ? selDay : (peak?.date ?? plan.end)
  const sel = plan.days.find((d) => d.date === selDate)

  const rules = [
    `Ogni ordine va sfornato almeno ${P.lead === 0 ? 'lo stesso giorno della' : P.lead === 1 ? '1 giorno prima della' : `${P.lead} giorni prima della`} consegna.`,
    P.strategy === 'tardi'
      ? `Parte dal ${shortDate(plan.end)} e va indietro: produce il più tardi possibile.`
      : P.strategy === 'presto'
        ? `Parte dal ${shortDate(plan.start)} e va avanti, iniziando dalle consegne più vicine.`
        : 'Divide il totale in parti simili per ogni giorno aperto, senza superare la capacità.',
    P.strategy === 'presto'
      ? 'Se un giorno è pieno, il resto passa al giorno dopo (sempre prima della scadenza).'
      : `Se un giorno supera ${P.cap} pz, l'eccesso passa al giorno prima.`,
    P.prio === 'nessuna'
      ? 'Gli ordini con data precisa ed "entro il" hanno la stessa priorità.'
      : `A parità di scadenza vengono prima gli ordini ${P.prio === 'preciso' ? 'con data precisa' : '"entro il"'}.`,
    P.group ? `Massimo ${P.maxG} gusti diversi al giorno, con i gusti uguali raggruppati.` : 'Nessun limite ai gusti diversi nello stesso giorno.',
    P.sunClosed ? 'La domenica non si produce.' : 'Si produce anche la domenica.',
    'Gli ordini già in magazzino non vengono pianificati.',
  ]

  return (
    <div className="flex flex-wrap gap-4 items-start">
      <aside className="flex-[1_1_260px] max-w-[340px] flex flex-col gap-3">
        {!canEdit && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-slate-100 ring-1 ring-slate-200">
            <Lock className="h-4 w-4 shrink-0 mt-0.5 text-slate-500" />
            <div className="text-xs leading-[1.45] text-slate-600">
              <strong className="text-slate-900">Solo lettura.</strong> Per cambiare vincoli e regole serve il permesso{' '}
              <span className="font-mono text-[11px]">orders:edit</span>.
            </div>
          </div>
        )}
        <div className={cn('flex flex-col gap-3', !canEdit && 'opacity-55 pointer-events-none')} aria-disabled={!canEdit}>
          <Card title="Vincoli del laboratorio" sub="Il piano si ricalcola a ogni modifica">
            <Row label="Inizio produzione" sub="primo giorno pianificabile">
              <input
                type="date"
                value={horizon.start}
                max={horizon.end}
                onChange={(e) => e.target.value && setP({ startDate: e.target.value })}
                className="h-9 rounded-[10px] border border-slate-200 bg-white px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
              />
            </Row>
            <Stepper
              label="Capacità giornaliera"
              sub="panettoni sfornabili al giorno"
              value={P.cap}
              onDec={() => setP({ cap: Math.max(5, P.cap - 5) })}
              onInc={() => setP({ cap: P.cap + 5 })}
            />
            <Stepper
              label="Anticipo minimo"
              sub="giorni tra cottura e consegna"
              value={`${P.lead} g`}
              onDec={() => setP({ lead: Math.max(0, P.lead - 1) })}
              onInc={() => setP({ lead: Math.min(5, P.lead + 1) })}
            />
            {P.group && (
              <Stepper
                label="Gusti diversi al giorno"
                sub="massimo impasti distinti"
                value={P.maxG}
                onDec={() => setP({ maxG: Math.max(1, P.maxG - 1) })}
                onInc={() => setP({ maxG: Math.min(12, P.maxG + 1) })}
              />
            )}
            <ToggleRow
              label="Domenica chiuso"
              sub="Non pianifica produzione la domenica"
              on={P.sunClosed}
              onClick={() => setP({ sunClosed: !P.sunClosed })}
              last
            />
          </Card>

          <Card title="Come ragiona" sub="Scegli le regole dell'algoritmo">
            <div className="px-4 py-3 border-b border-slate-100 flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Strategia</span>
              {STRATEGIES.map((st) => {
                const on = P.strategy === st.id
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setP({ strategy: st.id })}
                    className={cn(
                      'flex items-start gap-2.5 w-full px-3 py-2.5 rounded-[10px] text-left border',
                      on ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white',
                    )}
                  >
                    <span
                      className={cn(
                        'shrink-0 mt-0.5 h-3.5 w-3.5 rounded-full bg-white',
                        on ? 'border-4 border-slate-900' : 'border-[1.5px] border-slate-300',
                      )}
                    />
                    <span className="flex flex-col gap-px min-w-0">
                      <span className="text-[13px] font-semibold text-slate-900">{st.label}</span>
                      <span className="text-[11px] leading-[1.35] text-slate-500">{st.desc}</span>
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="px-4 py-3 border-b border-slate-100 flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600">A parità di giorno, prima…</span>
              <div className="flex gap-1 p-[3px] rounded-[10px] bg-slate-100">
                {PRIOS.map((pr) => (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => setP({ prio: pr.id })}
                    className={cn(
                      'flex-1 h-8 rounded-lg text-xs font-semibold',
                      P.prio === pr.id ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'text-slate-500',
                    )}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>
            <ToggleRow
              label="Raggruppa i gusti"
              sub="Limita gli impasti diversi nello stesso giorno"
              on={P.group}
              onClick={() => setP({ group: !P.group })}
            />
            <div className="px-4 py-3 bg-slate-50">
              <div className="text-[11px] font-semibold uppercase tracking-[.04em] text-slate-400 mb-1.5">
                Riassunto regole attive
              </div>
              <ol className="list-decimal pl-[18px] flex flex-col gap-1 text-xs leading-[1.45] text-slate-600">
                {rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ol>
            </div>
          </Card>
        </div>
      </aside>

      <div className="flex-[3_1_520px] min-w-0 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-slate-600">
            <strong className="text-slate-900">
              {planTotal} pz in {active.length} giorni di produzione
            </strong>{' '}
            ·{' '}
            {peak
              ? `picco ${dowShort(peak.date)} ${Number(peak.date.slice(8))} con ${peak.total}/${P.cap} pz`
              : 'nessun ordine da pianificare'}
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={doConfirm}
              disabled={confirming || (confirmed && !stale)}
              className={cn(
                'h-10 px-[18px] rounded-[10px] text-sm font-bold',
                confirmed && !stale
                  ? 'border border-green-200 bg-green-100 text-green-800'
                  : 'bg-slate-900 text-white disabled:opacity-60',
              )}
            >
              {confirmed && !stale ? 'Piano confermato ✓' : stale ? 'Ricalcola e conferma' : 'Conferma piano'}
            </button>
          )}
        </div>

        {stale && (
          <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3 text-[13px] text-amber-800">
            <strong>Piano da ricalcolare:</strong> sono arrivati o cambiati ordini dopo la conferma. Qui vedi l&apos;anteprima
            aggiornata{canEdit ? ': confermala per passarla alla Produzione.' : '.'}
          </div>
        )}

        <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <h2 className="text-sm font-semibold text-slate-900">Produzione suggerita per giorno</h2>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-4 border-t-[1.5px] border-dashed border-slate-400" />
              capacità {P.cap} pz · tocca un giorno
            </span>
          </div>
          {plan.days.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-slate-400">
              L&apos;inizio produzione è dopo il {shortDate(plan.end)}: nessun giorno da pianificare.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div style={{ minWidth: Math.max(520, plan.days.length * 46) }}>
                <div className="relative h-[200px] flex items-end gap-1.5 border-b border-slate-200">
                  <div
                    className="absolute inset-x-0 border-t-[1.5px] border-dashed border-slate-400 z-[2] pointer-events-none"
                    style={{ bottom: P.cap * scale }}
                  />
                  {plan.days.map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setSelDay(d.date)}
                      className={cn(
                        'flex-1 min-w-10 h-full flex flex-col justify-end items-center gap-1 px-0.5 rounded-t-lg',
                        d.date === selDate ? 'bg-slate-100' : 'bg-transparent',
                        d.closed && 'bg-[repeating-linear-gradient(135deg,#f1f5f9_0_6px,#ffffff_6px_12px)]',
                      )}
                    >
                      <span
                        className={cn('text-[11px] font-bold tabular-nums', d.total >= P.cap ? 'text-amber-700' : 'text-slate-600')}
                      >
                        {d.closed ? '' : d.total || ''}
                      </span>
                      <span className="flex flex-col-reverse w-[70%] max-w-11 rounded-t-md overflow-hidden">
                        {Object.values(d.items)
                          .sort((a, b) => (flavorRank.get(a.flavorId) ?? 0) - (flavorRank.get(b.flavorId) ?? 0))
                          .map((it) => (
                            <span
                              key={it.flavorId}
                              className="block w-full border-t border-white"
                              style={{
                                height: Math.max(2, it.qty * scale),
                                backgroundColor: flavorById.get(it.flavorId)?.color ?? '#94a3b8',
                              }}
                            />
                          ))}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5 pt-1.5">
                  {plan.days.map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setSelDay(d.date)}
                      className={cn(
                        'flex-1 min-w-10 rounded-lg py-1 text-center',
                        d.date === selDate ? 'bg-slate-900 text-white' : d.closed ? 'text-slate-300' : 'text-slate-600',
                      )}
                    >
                      <span className="block text-[10px] uppercase tracking-[.04em]">{d.closed ? 'chiuso' : dowShort(d.date)}</span>
                      <span className="block text-sm font-bold">{Number(d.date.slice(8))}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {plan.left.length > 0 && (
          <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3 flex flex-col gap-1">
            <div className="text-[13px] font-semibold text-amber-800">Non tutto entra nei vincoli</div>
            {plan.left.map((l) => (
              <div key={`${l.orderId}:${l.flavorId}`} className="text-xs text-amber-800">
                {l.name} — {l.qty} pz {flavorById.get(l.flavorId)?.name} (consegna {shortDate(l.due)}): servirebbe produrre
                prima del {shortDate(plan.start)} o aumentare la capacità.
              </div>
            ))}
          </div>
        )}

        {sel && <DayDetail day={sel} cap={P.cap} flavorById={flavorById} />}
      </div>
    </div>
  )
}

export function DayDetail({
  day,
  cap,
  flavorById,
  renderAction,
}: {
  day: PlanResult['days'][number]
  cap: number
  flavorById: Map<string, { name: string; color: string }>
  // Produzione adds a "fatto" control per flavor.
  renderAction?: (flavorId: string) => React.ReactNode
}) {
  const items = day.closed ? [] : Object.values(day.items).sort((a, b) => b.qty - a.qty)
  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">{longDate(day.date)}</h2>
        <span
          className={cn(
            'px-2.5 py-0.5 rounded-full text-xs font-bold',
            !day.closed && day.total >= cap ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600',
          )}
        >
          {day.closed ? 'chiuso' : `${day.total} / ${cap} pz`}
        </span>
      </div>
      {items.length === 0 && (
        <div className="px-4 py-6 text-center text-[13px] text-slate-400">
          {day.closed ? 'Giorno di chiusura.' : 'Niente da produrre: giorno libero.'}
        </div>
      )}
      {items.map((it) => {
        const f = flavorById.get(it.flavorId)
        return (
          <div
            key={it.flavorId}
            className={cn('px-4 py-3 border-b border-slate-100 last:border-b-0 flex flex-col gap-2', it.done && 'bg-green-50')}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: f?.color }} />
                <span className="text-sm font-semibold text-slate-900">{f?.name ?? 'Gusto rimosso'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-slate-900 tabular-nums">{it.qty} pz</span>
                {renderAction?.(it.flavorId)}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pl-5">
              {it.orders.map((o, i) => (
                <span
                  key={`${o.orderId}:${i}`}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs bg-slate-50 ring-1',
                    o.moved ? 'ring-amber-200' : 'ring-slate-200',
                  )}
                >
                  <span className="font-semibold text-slate-900">{o.name}</span>
                  <span className="text-slate-500">{o.qty} pz</span>
                  <span
                    className={cn(
                      'px-1.5 py-px rounded-full text-[10px] font-bold',
                      o.moved
                        ? 'bg-amber-100 text-amber-800'
                        : o.kind === 'preciso'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {o.kind === 'preciso' ? 'il ' : 'entro '}
                    {shortDate(o.due)}
                    {o.moved ? ' · anticipato' : ''}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
      </div>
      {children}
    </div>
  )
}

function Row({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-slate-900">{label}</div>
        <div className="text-[11px] text-slate-400">{sub}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">{children}</div>
    </div>
  )
}

function Stepper({
  label,
  sub,
  value,
  onDec,
  onInc,
}: {
  label: string
  sub: string
  value: React.ReactNode
  onDec: () => void
  onInc: () => void
}) {
  const btn =
    'h-9 w-9 rounded-[10px] border border-slate-200 bg-white text-lg font-semibold text-slate-900 hover:bg-slate-100'
  return (
    <Row label={label} sub={sub}>
      <button type="button" onClick={onDec} className={btn} aria-label={`Diminuisci ${label}`}>
        −
      </button>
      <div className="min-w-11 text-center text-base font-bold text-slate-900 tabular-nums">{value}</div>
      <button type="button" onClick={onInc} className={btn} aria-label={`Aumenta ${label}`}>
        +
      </button>
    </Row>
  )
}

function ToggleRow({
  label,
  sub,
  on,
  onClick,
  last,
}: {
  label: string
  sub: string
  on: boolean
  onClick: () => void
  last?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn('flex w-full items-center justify-between gap-3 px-4 py-3 text-left', !last && 'border-b border-slate-100')}
    >
      <div>
        <div className="text-[13px] font-semibold text-slate-900">{label}</div>
        <div className="text-[11px] text-slate-400">{sub}</div>
      </div>
      <span className={cn('shrink-0 relative w-10 h-6 rounded-full transition-colors', on ? 'bg-slate-900' : 'bg-slate-300')}>
        <span
          className={cn(
            'absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-[left]',
            on ? 'left-[19px]' : 'left-[3px]',
          )}
        />
      </span>
    </button>
  )
}
