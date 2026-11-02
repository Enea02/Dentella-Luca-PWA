'use client'

import { Check, Package, RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { PanettoneItemState } from '@/lib/panettoni/types'
import { cn } from '@/lib/utils'

export interface StateChoice {
  state: PanettoneItemState
  label: string
  hint?: string
}

export const ITEM_STATE_LABEL: Record<PanettoneItemState, string> = {
  todo: 'da fare',
  stock: 'in magazzino',
  delivered: 'consegnato',
}

/**
 * Options offered for ONE flavor of an order, from its current state — the same
 * in the Panettoni table and in Ordini (gestionale). `completesOrder`: choosing
 * "Consegnato" would deliver the last flavor (the order goes to the archive).
 */
export function itemChoices(current: PanettoneItemState, completesOrder: boolean): StateChoice[] {
  const delivered: StateChoice = {
    state: 'delivered',
    label: 'Consegnato',
    hint: completesOrder ? "Tutto consegnato: l'ordine va in archivio" : undefined,
  }
  if (current === 'todo') return [{ state: 'stock', label: 'In magazzino' }, delivered]
  if (current === 'stock') return [delivered, { state: 'todo', label: 'Rimetti da fare' }]
  return [
    { state: 'stock', label: 'Rimetti in magazzino' },
    { state: 'todo', label: 'Rimetti da fare' },
  ]
}

// Same colors as the cells of the orders table.
const TONE: Record<PanettoneItemState, { btn: string; icon: React.ReactNode }> = {
  stock: {
    btn: 'bg-amber-100 text-amber-900 ring-amber-300 hover:bg-amber-200',
    icon: <Package className="h-5 w-5 text-amber-600" />,
  },
  delivered: {
    btn: 'bg-emerald-100 text-emerald-900 ring-emerald-300 hover:bg-emerald-200',
    icon: <Check className="h-5 w-5 text-emerald-600" strokeWidth={3} />,
  },
  todo: {
    btn: 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50',
    icon: <RotateCcw className="h-5 w-5 text-slate-500" />,
  },
}

/**
 * "What happened to these panettoni?" — asked on a tap in the orders table
 * (one flavor, or the whole row when tapping the customer).
 */
export function StateChooser({
  open,
  title,
  subtitle,
  choices,
  onChoose,
  onClose,
}: {
  open: boolean
  title: string
  subtitle?: string
  choices: StateChoice[]
  onChoose: (state: PanettoneItemState) => void
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[400px] p-0 gap-0 rounded-2xl border-0 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
      >
        <div className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base font-semibold text-slate-900">{title}</DialogTitle>
          <DialogDescription className={cn('mt-0.5 text-[13px] text-slate-500', !subtitle && 'sr-only')}>
            {subtitle ?? 'Scegli il nuovo stato'}
          </DialogDescription>
        </div>
        <div className="px-5 pb-4 flex flex-col gap-2">
          {choices.map((c) => (
            <button
              key={c.state}
              type="button"
              onClick={() => onChoose(c.state)}
              className={cn(
                'flex items-center gap-3 min-h-14 px-4 py-2.5 rounded-xl text-left ring-1 transition-colors',
                TONE[c.state].btn,
              )}
            >
              {TONE[c.state].icon}
              <span className="flex flex-col">
                <span className="text-[15px] font-semibold leading-tight">{c.label}</span>
                {c.hint && <span className="text-xs leading-tight opacity-75">{c.hint}</span>}
              </span>
            </button>
          ))}
        </div>
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-[10px] border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Annulla
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
