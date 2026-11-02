'use client'

import { useState } from 'react'
import { Link2, X } from 'lucide-react'
import { useCustomers } from '@/hooks/useData'
import { cn } from '@/lib/utils'

/**
 * Customer name of a panettoni order. Typing suggests the customers of the
 * gestionale: picking one LINKS the order (it then also shows in that customer's
 * day in Ordini). A free name (walk-in) stays unlinked; editing the name of a
 * linked order unlinks it.
 */
export function CustomerNameField({
  name,
  customerId,
  onChange,
  inputClass,
}: {
  name: string
  customerId: string | null
  onChange: (name: string, customerId: string | null) => void
  inputClass: string
}) {
  const { customers } = useCustomers()
  const [open, setOpen] = useState(false)

  const query = name.trim().toLowerCase()
  const suggestions = query
    ? customers
        .filter((c) => c.active && c.name.toLowerCase().includes(query))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 6)
    : []

  return (
    <div className="relative flex flex-col gap-1">
      <input
        type="text"
        value={name}
        onChange={(e) => {
          onChange(e.target.value, null) // a typed name is a free name until a customer is picked
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Es. Rossi Maria o un cliente del gestionale"
        aria-label="Nome cliente"
        autoComplete="off"
        className={cn(inputClass, customerId && 'border-indigo-300 bg-indigo-50/40')}
      />
      {customerId && (
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">
          <Link2 className="h-3 w-3" />
          Collegato al gestionale
          <button
            type="button"
            onClick={() => onChange(name, null)}
            aria-label="Scollega dal gestionale"
            className="-mr-0.5 rounded-full p-0.5 hover:bg-indigo-200"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}
      {open && !customerId && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[40px] z-20 overflow-hidden rounded-[10px] bg-white shadow-lg ring-1 ring-slate-200">
          <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[.04em] text-slate-400">
            Clienti del gestionale
          </div>
          {suggestions.map((c) => (
            <button
              key={c.id}
              type="button"
              // mousedown, not click: it must win over the input's blur.
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(c.name, c.id)
                setOpen(false)
              }}
              className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-sm text-slate-900 hover:bg-slate-50"
            >
              <span className="truncate">{c.name}</span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {c.type === 'fixed' ? 'Fisso' : 'Giornaliero'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
