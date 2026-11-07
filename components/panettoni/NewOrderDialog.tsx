'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { usePanettoneFlavors, usePanettoneOrders } from '@/hooks/usePanettoni'
import type { DeliveryKind, PanettoneOrder } from '@/lib/panettoni/types'
import { cn } from '@/lib/utils'
import { CustomerNameField } from './CustomerNameField'
import { DatePickerField, TimePickerField } from './pickers'
import { alpha } from './status'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  season: number
  // Edit mode: customer and delivery of an existing order (flavors and
  // quantities are changed from the table).
  order?: PanettoneOrder | null
}

const MAX_QTY = 9999
const clampQty = (n: number) => Math.min(MAX_QTY, Math.max(1, Math.round(n) || 1))

const emptyForm = (season: number) => ({
  name: '',
  customerId: null as string | null, // linked customer of the gestionale
  phone: '',
  kind: 'preciso' as DeliveryKind,
  date: `${season}-12-24`,
  time: '',
  deposit: '',
  notes: '',
})

const formFromOrder = (o: PanettoneOrder) => ({
  name: o.customerName,
  customerId: o.customerId,
  phone: o.phone ?? '',
  kind: o.deliveryKind,
  date: o.deliveryDate,
  time: o.pickupTime ?? '',
  deposit: o.deposit != null ? String(o.deposit) : '',
  notes: o.notes ?? '',
})

const inputClass =
  'h-[38px] rounded-[10px] border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none focus:border-slate-400'
const labelClass = 'text-xs font-semibold text-slate-600'

export function NewOrderDialog({ open, onOpenChange, season, order }: Props) {
  const editing = !!order
  const { flavors } = usePanettoneFlavors()
  const { createOrder, updateOrder } = usePanettoneOrders(season)
  const [form, setForm] = useState(() => emptyForm(season))
  // Typed as text so the field can be emptied while writing (e.g. "300").
  const [qtyText, setQtyText] = useState('1')
  const qty = clampQty(Number(qtyText))
  const setQty = (n: number) => setQtyText(String(clampQty(n)))
  // Insertion-ordered queue; tapping a flavor already queued adds to it.
  const [queue, setQueue] = useState<{ flavorId: string; qty: number }[]>([])
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))
  const reset = () => {
    setForm(emptyForm(season))
    setQty(1)
    setQueue([])
  }

  // Edit mode: fill the form with the order each time the dialog opens.
  const orderId = order?.id
  useEffect(() => {
    if (open && order) setForm(formFromOrder(order))
  }, [open, orderId])

  const addToQueue = (flavorId: string) =>
    setQueue((q) =>
      q.some((x) => x.flavorId === flavorId)
        ? q.map((x) => (x.flavorId === flavorId ? { ...x, qty: Math.min(10_000, x.qty + qty) } : x))
        : [...q, { flavorId, qty }],
    )

  const flavorById = new Map(flavors.map((f) => [f.id, f]))
  const queueTotal = queue.reduce((a, q) => a + q.qty, 0)
  const canSave = (editing || queue.length > 0) && !!form.date && !saving

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const deposit = parseFloat(form.deposit.replace(',', '.'))
      if (order) {
        await updateOrder(order.id, {
          customerId: form.customerId,
          customerName: form.name.trim() || order.customerName,
          phone: form.phone.trim() || null,
          deliveryKind: form.kind,
          deliveryDate: form.date,
          pickupTime: form.time || null,
          deposit: Number.isFinite(deposit) && deposit > 0 ? deposit : null,
          notes: form.notes.trim() || null,
        })
        onOpenChange(false)
        return
      }
      await createOrder({
        customerId: form.customerId,
        customerName: form.name.trim() || 'Nuovo cliente',
        phone: form.phone.trim() || null,
        deliveryKind: form.kind,
        deliveryDate: form.date,
        pickupTime: form.time || null,
        deposit: Number.isFinite(deposit) && deposit > 0 ? deposit : null,
        notes: form.notes.trim() || null,
        items: queue,
      })
      reset()
      onOpenChange(false)
    } catch {
      toast.error("Errore durante il salvataggio dell'ordine")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[720px] p-0 gap-0 rounded-2xl border-0 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.25)] max-h-[calc(100dvh-2rem)] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <DialogTitle className="text-base font-semibold text-slate-900">
            {editing ? 'Modifica ordine panettoni' : 'Nuovo ordine panettoni'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editing ? "Cliente e consegna dell'ordine" : 'Cliente, consegna e gusti del nuovo ordine'}
          </DialogDescription>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Chiudi"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Nome cliente</span>
              <CustomerNameField
                name={form.name}
                customerId={form.customerId}
                onChange={(name, customerId) => setForm((f) => ({ ...f, name, customerId }))}
                inputClass={inputClass}
              />
            </div>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Telefono</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="335 1234567"
                className={inputClass}
              />
            </label>
          </div>

          <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-3">
            <div className="flex gap-1.5 mb-2.5">
              {(['preciso', 'entro'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set('kind', k)}
                  className={cn(
                    'flex-1 h-9 rounded-[10px] text-[13px] font-semibold border',
                    form.kind === k
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600',
                  )}
                >
                  {k === 'preciso' ? 'Data precisa' : 'Entro il'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="panettoni-delivery-date" className={labelClass}>
                  {form.kind === 'preciso' ? 'Consegna il' : 'Entro il'}
                </label>
                <DatePickerField id="panettoni-delivery-date" value={form.date} onChange={(v) => set('date', v)} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="panettoni-pickup-time" className={labelClass}>
                  Ora ritiro
                </label>
                <TimePickerField id="panettoni-pickup-time" value={form.time} onChange={(v) => set('time', v)} />
              </div>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Acconto €</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.5"
                  value={form.deposit}
                  onChange={(e) => set('deposit', e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </label>
            </div>
          </div>

          {/* Flavors and quantities: only for a new order (an existing one is edited in the table). */}
          {!editing && (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className={labelClass}>1. Quantità</span>
                  <div className="flex items-center gap-2">
                    <StepButton onClick={() => setQty(qty - 1)} label="Diminuisci">
                      −
                    </StepButton>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      aria-label="Quantità"
                      value={qtyText}
                      onChange={(e) => setQtyText(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      onBlur={(e) => setQty(Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      className="w-[84px] h-10 rounded-[10px] bg-slate-900 text-white text-center text-lg font-bold tabular-nums outline-none ring-offset-2 focus:ring-2 focus:ring-amber-400"
                    />
                    <span className="text-xs text-slate-400">pz</span>
                    <StepButton onClick={() => setQty(qty + 1)} label="Aumenta">
                      +
                    </StepButton>
                  </div>
                </div>

                <span className={labelClass}>2. Tocca il gusto per aggiungerlo alla coda</span>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
                  {flavors
                    .filter((f) => f.active)
                    .map((f) => {
                      const inQueue = queue.find((q) => q.flavorId === f.id)?.qty ?? 0
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => addToQueue(f.id)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold min-h-11 border"
                          style={{ borderColor: alpha(f.color, 0.2), backgroundColor: alpha(f.color, 0.06), color: f.color }}
                        >
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                          <span className="flex-1 text-left">{f.name}</span>
                          <span
                            className="min-w-[22px] text-center text-[11px] font-bold rounded-full px-1.5 py-0.5"
                            style={inQueue ? { backgroundColor: f.color, color: '#fff' } : { color: 'transparent' }}
                          >
                            {inQueue}
                          </span>
                        </button>
                      )
                    })}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={labelClass}>Coda ordine</span>
                  <span className="text-xs font-bold text-slate-900">{queueTotal} pz</span>
                </div>
                {queue.length === 0 ? (
                  <div className="p-4 text-center text-[13px] text-slate-400">Nessun gusto aggiunto.</div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {queue.map((q) => {
                      const f = flavorById.get(q.flavorId)
                      return (
                        <div key={q.flavorId} className="flex items-center gap-2.5 bg-white rounded-[10px] px-2.5 py-2 ring-1 ring-slate-200">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: f?.color }} />
                          <span className="flex-1 text-sm font-medium text-slate-900">{f?.name}</span>
                          <span className="text-sm font-bold text-slate-900 tabular-nums">{q.qty} pz</span>
                          <button
                            type="button"
                            onClick={() => setQueue((all) => all.filter((x) => x.flavorId !== q.flavorId))}
                            aria-label="Rimuovi"
                            className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          <label className="flex flex-col gap-1">
            <span className={labelClass}>Note</span>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Es. incarto regalo, ritiro dal retro…"
              className="rounded-[10px] border border-slate-200 px-2.5 py-2 text-sm text-slate-900 outline-none resize-y focus:border-slate-400"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 rounded-[10px] border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className={cn(
              'h-10 px-5 rounded-[10px] text-sm font-bold',
              canSave ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed',
            )}
          >
            {saving ? 'Salvataggio…' : editing ? 'Salva modifiche' : 'Salva ordine'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StepButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="h-10 w-10 rounded-[10px] border border-slate-200 bg-white text-xl font-semibold text-slate-900 hover:bg-slate-100"
    >
      {children}
    </button>
  )
}
