'use client'

import { useState, useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { it } from 'date-fns/locale'
import { ShieldAlert, Loader2, Calendar } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStatistics } from '@/hooks/useData'
import type { CustomerStat, ProductStat, CustomerProductStat } from '@/hooks/useData'
import { can } from '@/lib/auth/permissions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'

const TODAY = format(new Date(), 'yyyy-MM-dd')

type Preset = 'today' | 'week' | 'month' | 'custom'

function presetRange(preset: Preset): { from: string; to: string } {
  const today = new Date()
  if (preset === 'today') return { from: TODAY, to: TODAY }
  if (preset === 'week') return { from: format(subDays(today, 6), 'yyyy-MM-dd'), to: TODAY }
  return { from: format(subDays(today, 29), 'yyyy-MM-dd'), to: TODAY }
}

function pct(done: number, total: number) {
  if (total === 0) return '—'
  return `${Math.round((done / total) * 100)}%`
}

function formatQty(qty: number, unit: string) {
  return `${qty % 1 === 0 ? qty : qty.toFixed(2)} ${unit === 'kg' ? 'kg' : 'pz'}`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: {
  label: string
  value: string | number
  accent?: 'green' | 'amber' | 'red'
}) {
  const valueClass =
    accent === 'green' ? 'text-emerald-600' :
    accent === 'amber' ? 'text-amber-600' :
    accent === 'red' ? 'text-red-500' :
    'text-slate-900'
  return (
    <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

function Empty() {
  return <p className="py-10 text-center text-sm text-slate-400">Nessun dato nel periodo selezionato</p>
}

function CustomerTable({ rows }: { rows: CustomerStat[] }) {
  if (rows.length === 0) return <Empty />
  return (
    <>
      {/* Mobile: card list */}
      <div className="md:hidden space-y-2">
        {rows.map((r) => (
          <div key={r.customerId} className="rounded-2xl border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="font-medium text-sm text-slate-900 truncate">{r.customerName}</p>
                <p className="text-xs text-slate-400">
                  {r.customerType === 'fixed' ? 'Fisso' : 'Giornaliero'} · {r.orderDays} giorni
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-700 shrink-0">{pct(r.doneQuantity, r.totalQuantity)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Ord. <span className="text-slate-700 font-medium">{r.totalQuantity.toLocaleString('it')}</span></span>
              <span>Evasa <span className="text-slate-700 font-medium">{r.doneQuantity.toLocaleString('it')}</span></span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
              <th className="pb-2 font-medium">Cliente</th>
              <th className="pb-2 font-medium text-right">Giorni</th>
              <th className="pb-2 font-medium text-right">Qtà ord.</th>
              <th className="pb-2 font-medium text-right">Qtà evasa</th>
              <th className="pb-2 font-medium text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.customerId} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-2.5">
                  <span className="font-medium text-slate-900">{r.customerName}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {r.customerType === 'fixed' ? 'Fisso' : 'Giorn.'}
                  </span>
                </td>
                <td className="py-2.5 text-right text-slate-600">{r.orderDays}</td>
                <td className="py-2.5 text-right text-slate-600">{r.totalQuantity.toLocaleString('it')}</td>
                <td className="py-2.5 text-right text-slate-600">{r.doneQuantity.toLocaleString('it')}</td>
                <td className="py-2.5 text-right font-semibold text-slate-700">{pct(r.doneQuantity, r.totalQuantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function ProductTable({ rows }: { rows: ProductStat[] }) {
  if (rows.length === 0) return <Empty />
  return (
    <>
      {/* Mobile: card list */}
      <div className="md:hidden space-y-2">
        {rows.map((r) => (
          <div key={r.productId} className="rounded-2xl border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="font-medium text-sm text-slate-900 truncate">{r.productName}</p>
                <p className="text-xs text-slate-400">{r.section}</p>
              </div>
              <span className="text-sm font-semibold text-slate-700 shrink-0">{pct(r.doneQuantity, r.totalQuantity)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Ord. <span className="text-slate-700 font-medium">{formatQty(r.totalQuantity, r.unit)}</span></span>
              <span>Evasa <span className="text-slate-700 font-medium">{formatQty(r.doneQuantity, r.unit)}</span></span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
              <th className="pb-2 font-medium">Articolo</th>
              <th className="pb-2 font-medium">Sezione</th>
              <th className="pb-2 font-medium text-right">Qtà ord.</th>
              <th className="pb-2 font-medium text-right">Qtà evasa</th>
              <th className="pb-2 font-medium text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.productId} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-2.5 font-medium text-slate-900">{r.productName}</td>
                <td className="py-2.5 text-xs text-slate-500">{r.section}</td>
                <td className="py-2.5 text-right text-slate-600">{formatQty(r.totalQuantity, r.unit)}</td>
                <td className="py-2.5 text-right text-slate-600">{formatQty(r.doneQuantity, r.unit)}</td>
                <td className="py-2.5 text-right font-semibold text-slate-700">{pct(r.doneQuantity, r.totalQuantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function CustomerProductTable({ rows }: { rows: CustomerProductStat[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, { customerName: string; items: CustomerProductStat[] }>()
    for (const r of rows) {
      if (!map.has(r.customerId)) map.set(r.customerId, { customerName: r.customerName, items: [] })
      map.get(r.customerId)!.items.push(r)
    }
    return [...map.values()]
  }, [rows])

  if (grouped.length === 0) return <Empty />
  return (
    <>
      {/* Mobile: grouped cards */}
      <div className="md:hidden space-y-3">
        {grouped.map((group) => (
          <div key={group.items[0].customerId} className="rounded-2xl border border-slate-200 p-3">
            <p className="font-medium text-sm text-slate-900 mb-2">{group.customerName}</p>
            <div className="space-y-1.5">
              {group.items.map((r) => (
                <div key={`${r.customerId}-${r.productId}`} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-700 truncate flex-1">{r.productName}</span>
                  <span className="text-slate-500 tabular-nums">
                    {formatQty(r.doneQuantity, r.unit)}/{formatQty(r.totalQuantity, r.unit)}
                  </span>
                  <span className="font-semibold text-slate-700 tabular-nums w-10 text-right">
                    {pct(r.doneQuantity, r.totalQuantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
              <th className="pb-2 font-medium">Cliente</th>
              <th className="pb-2 font-medium">Articolo</th>
              <th className="pb-2 font-medium text-right">Qtà ord.</th>
              <th className="pb-2 font-medium text-right">Qtà evasa</th>
              <th className="pb-2 font-medium text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map((group) =>
              group.items.map((r, idx) => (
                <tr
                  key={`${r.customerId}-${r.productId}`}
                  className={`border-b border-slate-50 hover:bg-slate-50 ${idx === 0 ? 'border-t border-slate-100' : ''}`}
                >
                  <td className="py-2.5 font-medium text-slate-900">
                    {idx === 0 ? r.customerName : ''}
                  </td>
                  <td className="py-2.5 text-slate-600">{r.productName}</td>
                  <td className="py-2.5 text-right text-slate-600">{formatQty(r.totalQuantity, r.unit)}</td>
                  <td className="py-2.5 text-right text-slate-600">{formatQty(r.doneQuantity, r.unit)}</td>
                  <td className="py-2.5 text-right font-semibold text-slate-700">{pct(r.doneQuantity, r.totalQuantity)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StatisticsPage() {
  const { user } = useAuth()
  const [preset, setPreset] = useState<Preset>('week')
  const [from, setFrom] = useState(presetRange('week').from)
  const [to, setTo] = useState(TODAY)

  const { stats, isLoading } = useStatistics(from, to)

  if (!can(user, 'statistics:view')) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <ShieldAlert className="h-12 w-12 text-slate-400" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">Accesso negato</h2>
          <p className="text-slate-500">Solo i titolari possono accedere a questa sezione</p>
        </div>
      </div>
    )
  }

  function applyPreset(p: Preset) {
    setPreset(p)
    if (p !== 'custom') {
      const r = presetRange(p)
      setFrom(r.from)
      setTo(r.to)
    }
  }

  const completionPct = stats && stats.totalQuantityOrdered > 0
    ? Math.round((stats.totalQuantityDone / stats.totalQuantityOrdered) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-lg font-semibold text-slate-900 mb-4">Statistiche</h1>

      {/* Date range filter */}
      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => applyPreset(p)}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                preset === p
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p === 'today' ? 'Oggi' : p === 'week' ? 'Ultimi 7 giorni' : 'Ultimi 30 giorni'}
            </button>
          ))}

          <div className="flex items-center gap-2 ml-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`h-8 px-3 text-xs rounded-xl gap-1 ${preset === 'custom' ? 'ring-1 ring-slate-400' : ''}`}
                >
                  <Calendar className="h-3 w-3" />
                  {format(new Date(from + 'T00:00:00'), 'd MMM yyyy', { locale: it })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={new Date(from + 'T00:00:00')}
                  onSelect={(d) => {
                    if (d) { setFrom(format(d, 'yyyy-MM-dd')); setPreset('custom') }
                  }}
                  locale={it}
                />
              </PopoverContent>
            </Popover>

            <span className="text-xs text-slate-400">→</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`h-8 px-3 text-xs rounded-xl gap-1 ${preset === 'custom' ? 'ring-1 ring-slate-400' : ''}`}
                >
                  <Calendar className="h-3 w-3" />
                  {format(new Date(to + 'T00:00:00'), 'd MMM yyyy', { locale: it })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={new Date(to + 'T00:00:00')}
                  onSelect={(d) => {
                    if (d) { setTo(format(d, 'yyyy-MM-dd')); setPreset('custom') }
                  }}
                  locale={it}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : !stats ? (
        <div className="text-center py-16 text-slate-400">Nessun dato disponibile</div>
      ) : (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard label="Giorni attivi" value={stats.activeDays} />
            <StatCard label="Clienti serviti" value={stats.uniqueCustomers} />
            <StatCard label="Quantità totale" value={stats.totalQuantityOrdered.toLocaleString('it')} />
            <StatCard
              label="Completamento"
              value={`${completionPct}%`}
              accent={completionPct >= 80 ? 'green' : completionPct >= 50 ? 'amber' : 'red'}
            />
          </div>

          {/* Detailed tabs */}
          <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
            <Tabs defaultValue="customer">
              <TabsList className="w-full rounded-xl bg-slate-100 p-1 mb-4">
                <TabsTrigger
                  value="customer"
                  className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs"
                >
                  Per Cliente
                </TabsTrigger>
                <TabsTrigger
                  value="product"
                  className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs"
                >
                  Per Articolo
                </TabsTrigger>
                <TabsTrigger
                  value="cp"
                  className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs"
                >
                  Cliente × Articolo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="customer">
                <CustomerTable rows={stats.perCustomer} />
              </TabsContent>
              <TabsContent value="product">
                <ProductTable rows={stats.perProduct} />
              </TabsContent>
              <TabsContent value="cp">
                <CustomerProductTable rows={stats.perCustomerProduct} />
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  )
}
