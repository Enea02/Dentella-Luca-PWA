'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X } from 'lucide-react'
import type { Customer } from '@/lib/types'

interface SheetAddCustomerProps {
  customers: Customer[]
  /** A customer already selectable in the sheet (has an order today or was just added). */
  isPresent: (customerId: string) => boolean
  onPickExisting: (customerId: string) => void
  onCreateNew: (name: string) => Promise<void>
}

/**
 * Bottom-of-sheet "+ Aggiungi cliente" with the same autocomplete as Ordini → Clienti:
 * type to filter existing customers (with Fisso/Giornaliero badge), click to pick one, or
 * confirm a new name to create a giornaliero. The suggestions list is rendered in a portal
 * (fixed, opening upward) so the table's `overflow-auto` doesn't clip it.
 */
export function SheetAddCustomer({ customers, isPresent, onPickExisting, onCreateNew }: SheetAddCustomerProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pos, setPos] = useState<{ left: number; bottom: number; width: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const sorted = [...customers].sort((a, b) => a.name.localeCompare(b.name))
  const filtered = value.trim()
    ? sorted.filter((c) => c.name.toLowerCase().includes(value.trim().toLowerCase()))
    : sorted
  const isExisting = selectedId !== null
  const isNew = value.trim().length > 0 && !isExisting

  const updatePos = () => {
    const el = inputRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({ left: r.left, bottom: window.innerHeight - r.top + 4, width: r.width })
  }

  useLayoutEffect(() => {
    if (!listOpen) return
    updatePos()
    const handler = () => updatePos()
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  }, [listOpen])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function reset() {
    setValue('')
    setSelectedId(null)
    setListOpen(false)
    setOpen(false)
  }

  function pick(c: Customer) {
    setSelectedId(c.id)
    setValue(c.name)
    setListOpen(false)
  }

  async function confirm() {
    if (busy) return
    if (selectedId) {
      onPickExisting(selectedId)
      reset()
      return
    }
    const name = value.trim()
    if (!name) return
    setBusy(true)
    try {
      await onCreateNew(name)
      reset()
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Aggiungi cliente
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1.5">
      <div className="relative flex min-w-0 flex-1 items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setSelectedId(null)
            setListOpen(true)
          }}
          onFocus={() => setListOpen(true)}
          onBlur={() => setTimeout(() => setListOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirm()
            if (e.key === 'Escape') reset()
          }}
          placeholder="Cerca o inserisci cliente..."
          className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1 pr-14 text-sm outline-none focus:border-slate-400"
        />
        {isExisting && (
          <span className="pointer-events-none absolute right-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            Esistente
          </span>
        )}
        {isNew && (
          <span className="pointer-events-none absolute right-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
            Nuovo
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={confirm}
        disabled={busy || !value.trim()}
        className="shrink-0 rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white disabled:opacity-40"
      >
        {busy ? '…' : 'OK'}
      </button>
      <button type="button" onClick={reset} className="shrink-0 text-slate-400 hover:text-slate-700">
        <X className="h-4 w-4" />
      </button>

      {listOpen &&
        pos &&
        filtered.length > 0 &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              left: pos.left,
              bottom: pos.bottom,
              width: Math.max(pos.width, 220),
            }}
            className="z-[60] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
          >
            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.map((c) => {
                const present = isPresent(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={present}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      if (!present) pick(c)
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="ml-2 shrink-0 text-xs text-slate-400">
                      {present ? 'già in elenco' : c.type === 'fixed' ? 'Fisso' : 'Giornaliero'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
