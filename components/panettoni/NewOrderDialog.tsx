'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { usePanettoneFlavors, usePanettoneOrders } from '@/hooks/usePanettoni'
import type { DeliveryKind } from '@/lib/panettoni/types'
import { cn } from '@/lib/utils'
import { DatePickerField, TimePickerField } from './pickers'
import { alpha } from './status'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  season: number
}

const emptyForm = (season: number) => ({
  name: '',
  phone: '',
  kind: 'preciso' as DeliveryKind,
  date: `${season}-12-24`,
  time: '',
  deposit: '',
  notes: '',
})

const inputClass =
  'h-[38px] rounded-[10px] border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none focus:border-slate-400'
const labelClass = 'text-xs font-semibold text-slate-600'

export function NewOrderDialog({ open, onOpenChange, season }: Props) {
  const { flavors } = usePanettoneFlavors()
  const { createOrder } = usePanettoneOrders(season)
  const [form, setForm] = useState(() => emptyForm(season))
  const [qty, setQty] = useState(1)
  // Insertion-ordered queue; tapping a flavor already queued adds to it.
  const [queue, setQueue] = useState<{ flavorId: string; qty: number }[]>([])
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))
  const reset = () => {
    setForm(emptyForm(season))
    setQty(1)
    setQueue([])
  }

  const addToQueue = (flavorId: string) =>
    setQueue((q) =>
      q.some((x) => x.flavorId === flavorId)
        ? q.map((x) => (x.flavorId === flavorId ? { ...x, qty: x.qty + qty } : x))
        : [...q, { flavorId, qty }],
    )

  const flavorById = new Map(flavors.map((f) => [f.id, f]))
  const queueTotal = queue.reduce((a, q) => a + q.qty, 0)
  const canSave = queue.length > 0 && !!form.date && !saving

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const deposit = parseFloat(form.deposit.replace(',', '.'))
      await createOrder({
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
          <DialogTitle className="text-base font-semibold text-slate-900">Nuovo ordine panettoni</DialogTitle>
          <DialogDescription className="sr-only">Cliente, consegna e gusti del nuovo ordine</DialogDescription>
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
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Nome cliente</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Es. Rossi Maria"
                className={inputClass}
              />
            </label>
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

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className={labelClass}>1. Quantità</span>
              <div className="flex items-center gap-2">
                <StepButton onClick={() => setQty((q) => Math.max(1, q - 1))} label="Diminuisci">
                  −
                </StepButton>
                <div className="min-w-[72px] h-10 flex items-center justify-center rounded-[10px] bg-slate-900 text-white text-lg font-bold tabular-nums">
                  {qty}
                </div>
                <span className="text-xs text-slate-400">pz</span>
                <StepButton onClick={() => setQty((q) => q + 1)} label="Aumenta">
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
            {saving ? 'Salvataggio…' : 'Salva ordine'}
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
