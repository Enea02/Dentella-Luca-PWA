'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePanettoneFlavors } from '@/hooks/usePanettoni'

/**
 * "+ Aggiungi panettone" in a customer's day (Ordini): the pieces go to that
 * customer's panettoni order for this day, which also shows in the Panettoni table.
 */
export function AddPanettone({ onAdd }: { onAdd: (flavorId: string, qty: number) => Promise<void> }) {
  const { flavors } = usePanettoneFlavors()
  const [open, setOpen] = useState(false)
  const [flavorId, setFlavorId] = useState('')
  const [qty, setQty] = useState('1')
  const [saving, setSaving] = useState(false)

  const n = parseInt(qty, 10)
  const valid = !!flavorId && Number.isFinite(n) && n > 0

  const close = () => {
    setOpen(false)
    setFlavorId('')
    setQty('1')
  }

  const add = async () => {
    if (!valid) return
    setSaving(true)
    try {
      await onAdd(flavorId, n)
      close()
    } catch {
      toast.error('Errore durante il salvataggio del panettone')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-amber-300 py-2 text-xs text-amber-700 transition-colors hover:border-amber-400 hover:text-amber-800"
      >
        + Aggiungi panettone
      </button>
    )
  }

  return (
    <div className="grid gap-2 rounded-xl bg-amber-50/60 p-2 ring-1 ring-amber-200">
      <Select value={flavorId} onValueChange={setFlavorId}>
        <SelectTrigger className="w-full rounded-xl bg-white">
          <SelectValue placeholder="Gusto del panettone" />
        </SelectTrigger>
        <SelectContent>
          {flavors
            .filter((f) => f.active)
            .map((f) => (
              <SelectItem key={f.id} value={f.id}>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                  {f.name}
                </span>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      <input
        type="number"
        min="1"
        inputMode="numeric"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder="Pezzi"
        aria-label="Pezzi"
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={close}
          className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-xs text-slate-600"
        >
          Annulla
        </button>
        <button
          type="button"
          onClick={add}
          disabled={!valid || saving}
          className="flex-1 rounded-xl bg-amber-500 py-2 text-xs font-semibold text-slate-900 disabled:opacity-40"
        >
          {saving ? '...' : 'Aggiungi'}
        </button>
      </div>
    </div>
  )
}
