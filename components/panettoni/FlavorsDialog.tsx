'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { usePanettoneFlavors } from '@/hooks/usePanettoni'
import { DEFAULT_FLAVORS } from '@/lib/panettoni/flavors'
import type { PanettoneFlavor } from '@/lib/panettoni/types'
import { cn } from '@/lib/utils'

// The handoff colors first, then a few extra hues for new flavors.
const PALETTE = [
  ...DEFAULT_FLAVORS.map((f) => f.color),
  '#0f766e',
  '#0369a1',
  '#1d4ed8',
  '#9d174d',
  '#db2777',
  '#65a30d',
  '#334155',
  '#7c2d12',
]

const errorMessage = (err: unknown) => (err instanceof Error && err.message ? err.message : 'Errore durante il salvataggio')

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Add, rename, recolor, reorder, hide or remove the flavors offered in the
 * Panettoni section. The list order is the column order of the orders table.
 */
export function FlavorsDialog({ open, onOpenChange }: Props) {
  const { flavors, createFlavor, updateFlavor, deleteFlavor, reorderFlavors } = usePanettoneFlavors()
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PALETTE[0])
  const [adding, setAdding] = useState(false)

  // Suggest a color not used yet for the next flavor.
  useEffect(() => {
    if (!open) return
    const used = new Set(flavors.map((f) => f.color.toLowerCase()))
    setNewColor(PALETTE.find((c) => !used.has(c.toLowerCase())) ?? PALETTE[0])
  }, [open, flavors])

  const move = (index: number, delta: -1 | 1) => {
    const ids = flavors.map((f) => f.id)
    const target = index + delta
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorderFlavors(ids).catch((err) => toast.error(errorMessage(err)))
  }

  const add = async () => {
    const name = newName.trim()
    if (!name || adding) return
    setAdding(true)
    try {
      await createFlavor(name, newColor)
      setNewName('')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setAdding(false)
    }
  }

  const remove = async (f: PanettoneFlavor) => {
    try {
      const result = await deleteFlavor(f.id)
      if (result === 'hidden') {
        toast(`“${f.name}” è usato in alcuni ordini: l'ho nascosto invece di eliminarlo.`)
      }
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const activeCount = flavors.filter((f) => f.active).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[560px] p-0 gap-0 rounded-2xl border-0 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.25)] max-h-[calc(100dvh-2rem)] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <DialogTitle className="text-base font-semibold text-slate-900">Gusti</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              {`${activeCount} disponibili · l'ordine qui è quello delle colonne della tabella`}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Chiudi"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="px-3 sm:px-5 py-4 flex flex-col gap-1.5 overflow-y-auto">
          {flavors.map((f, i) => (
            <FlavorRow
              key={f.id}
              flavor={f}
              first={i === 0}
              last={i === flavors.length - 1}
              onMove={(delta) => move(i, delta)}
              onUpdate={(patch) => updateFlavor(f.id, patch).catch((err) => toast.error(errorMessage(err)))}
              onRemove={() => remove(f)}
            />
          ))}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50">
          <span className="text-xs font-semibold text-slate-600">Nuovo gusto</span>
          <div className="mt-1.5 flex items-center gap-2">
            <ColorPicker color={newColor} onChange={setNewColor} />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="Es. Pere e cioccolato"
              maxLength={40}
              className="flex-1 min-w-0 h-10 rounded-[10px] border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
            />
            <button
              type="button"
              onClick={add}
              disabled={!newName.trim() || adding}
              className={cn(
                'inline-flex items-center gap-1.5 h-10 px-4 rounded-[10px] text-sm font-bold',
                newName.trim() && !adding ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed',
              )}
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Aggiungi
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FlavorRow({
  flavor: f,
  first,
  last,
  onMove,
  onUpdate,
  onRemove,
}: {
  flavor: PanettoneFlavor
  first: boolean
  last: boolean
  onMove: (delta: -1 | 1) => void
  onUpdate: (patch: Partial<Pick<PanettoneFlavor, 'name' | 'color' | 'active'>>) => void
  onRemove: () => void
}) {
  const [name, setName] = useState(f.name)
  const [confirming, setConfirming] = useState(false)
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Follow outside changes (rollback after an error, realtime) when not editing.
  useEffect(() => setName(f.name), [f.name])
  useEffect(() => () => clearTimeout(confirmTimer.current), [])

  const commitName = () => {
    const next = name.trim()
    if (!next) return setName(f.name)
    if (next !== f.name) onUpdate({ name: next })
  }

  // Two-step remove: first tap arms the button for 3 s.
  const askRemove = () => {
    if (confirming) {
      clearTimeout(confirmTimer.current)
      setConfirming(false)
      onRemove()
      return
    }
    setConfirming(true)
    confirmTimer.current = setTimeout(() => setConfirming(false), 3000)
  }

  const iconBtn =
    'h-9 w-8 sm:w-9 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 sm:gap-1.5 rounded-xl px-1.5 sm:px-2 py-1.5 ring-1',
        f.active ? 'bg-white ring-slate-200' : 'bg-slate-50 ring-slate-200',
      )}
    >
      <ColorPicker color={f.color} onChange={(color) => onUpdate({ color })} />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        maxLength={40}
        aria-label="Nome del gusto"
        className={cn(
          'flex-1 min-w-0 h-9 rounded-lg border border-transparent bg-transparent px-1.5 sm:px-2 text-sm font-medium outline-none hover:border-slate-200 focus:border-slate-400 focus:bg-white',
          f.active ? 'text-slate-900' : 'text-slate-400 line-through',
        )}
      />
      {!f.active && (
        <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-slate-200 text-[10px] font-bold uppercase text-slate-500">
          Nascosto
        </span>
      )}
      <button type="button" onClick={() => onMove(-1)} disabled={first} aria-label="Sposta su" className={iconBtn}>
        <ArrowUp className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => onMove(1)} disabled={last} aria-label="Sposta giù" className={iconBtn}>
        <ArrowDown className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onUpdate({ active: !f.active })}
        aria-label={f.active ? 'Nascondi' : 'Rendi disponibile'}
        title={f.active ? 'Nascondi (non si potrà più ordinare)' : 'Rendi di nuovo disponibile'}
        className={iconBtn}
      >
        {f.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={askRemove}
        aria-label="Rimuovi"
        title="Rimuovi"
        className={cn(
          'h-9 shrink-0 inline-flex items-center justify-center rounded-lg transition-colors',
          confirming
            ? 'px-2.5 bg-red-600 text-white text-xs font-bold'
            : 'w-8 sm:w-9 text-slate-400 hover:bg-red-50 hover:text-red-600',
        )}
      >
        {confirming ? 'Rimuovi?' : <Trash2 className="h-4 w-4" />}
      </button>
    </div>
  )
}

function ColorPicker({ color, onChange }: { color: string; onChange: (color: string) => void }) {
  const [open, setOpen] = useState(false)
  // The native picker fires on every drag step: keep a draft, commit on close.
  const [draft, setDraft] = useState(color)
  useEffect(() => setDraft(color), [color])
  const onOpenChange = (next: boolean) => {
    if (!next && draft.toLowerCase() !== color.toLowerCase()) onChange(draft)
    setOpen(next)
  }
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Colore"
          className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg hover:bg-slate-100"
        >
          <span className="h-5 w-5 rounded-md ring-1 ring-black/10" style={{ backgroundColor: open ? draft : color }} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <div className="grid grid-cols-5 gap-1.5">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setDraft(c)
                if (c.toLowerCase() !== color.toLowerCase()) onChange(c)
                setOpen(false)
              }}
              aria-label={c}
              className={cn(
                'h-8 w-8 rounded-lg ring-1 ring-black/10',
                c.toLowerCase() === draft.toLowerCase() && 'ring-2 ring-slate-900 ring-offset-2',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <label className="mt-2.5 flex items-center justify-between gap-2 text-xs text-slate-600">
          Altro colore
          <input
            type="color"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
          />
        </label>
      </PopoverContent>
    </Popover>
  )
}
