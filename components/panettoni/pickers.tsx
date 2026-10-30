'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { normalizeTime } from '@/lib/panettoni/helpers'
import { cn } from '@/lib/utils'

// Same look as the TopNav day picker (shadcn Popover + Calendar), sized for
// the form fields of the Panettoni dialogs.

const fieldClass =
  'h-[38px] w-full inline-flex items-center gap-2 rounded-[10px] border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none hover:bg-slate-50 focus-visible:border-slate-400 data-[state=open]:border-slate-400'

const toDate = (iso: string) => new Date(iso + 'T00:00:00')

export function DatePickerField({
  value,
  onChange,
  id,
}: {
  value: string // YYYY-MM-DD, '' = none
  onChange: (iso: string) => void
  id?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" id={id} className={fieldClass}>
          <CalendarIcon className="h-4 w-4 shrink-0 text-slate-500" />
          <span className={cn('truncate', !value && 'text-slate-400')}>
            {value ? format(toDate(value), 'EEE d MMM yyyy', { locale: it }) : 'Scegli il giorno'}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? toDate(value) : undefined}
          defaultMonth={value ? toDate(value) : undefined}
          onSelect={(date) => {
            if (!date) return
            onChange(format(date, 'yyyy-MM-dd'))
            setOpen(false)
          }}
          locale={it}
        />
      </PopoverContent>
    </Popover>
  )
}

// Pickup slots every 30 minutes across the shop's day.
const TIMES = Array.from({ length: 27 }, (_, i) => {
  const minutes = 7 * 60 + i * 30 // 07:00 → 20:00
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
})

export function TimePickerField({
  value,
  onChange,
  id,
}: {
  value: string // 'HH:MM' (or free text from older orders), '' = none
  onChange: (time: string) => void
  id?: string
}) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const pick = (time: string) => {
    onChange(time)
    setOpen(false)
  }
  const onOpenChange = (next: boolean) => {
    if (next) setTyped(TIMES.includes(value) ? '' : value)
    setOpen(next)
  }
  const commitTyped = () => {
    const time = normalizeTime(typed)
    if (time) pick(time)
  }
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button type="button" id={id} className={fieldClass}>
          <Clock className="h-4 w-4 shrink-0 text-slate-500" />
          <span className={cn('truncate', !value && 'text-slate-400')}>{value || 'Nessun orario'}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="mb-2 text-sm font-medium text-slate-900">Ora ritiro</div>
        <div className="mb-2.5 flex items-center gap-1.5">
          <input
            type="text"
            inputMode="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitTyped()
              }
            }}
            placeholder="Scrivi l'ora, es. 10:45"
            maxLength={40}
            aria-label="Scrivi l'ora"
            className="flex-1 min-w-0 h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          />
          <button
            type="button"
            onClick={commitTyped}
            disabled={!typed.trim()}
            className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40"
          >
            OK
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {TIMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => pick(t)}
              className={cn(
                'h-8 w-14 rounded-md text-sm tabular-nums transition-colors',
                t === value ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {t}
            </button>
          ))}
        </div>
        {value && (
          <button
            type="button"
            onClick={() => pick('')}
            className="mt-2 w-full h-8 rounded-md text-sm text-slate-500 hover:bg-accent hover:text-accent-foreground"
          >
            Nessun orario
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
