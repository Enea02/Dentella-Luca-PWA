'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { CalendarDays, CalendarPlus } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

const toDate = (iso: string) => new Date(iso + 'T00:00:00')
const toIso = (d: Date) => format(d, 'yyyy-MM-dd')
const nextDay = (iso: string) => {
  const d = toDate(iso)
  d.setDate(d.getDate() + 1)
  return toIso(d)
}

/**
 * Long press on a product in Ordini → "Posticipa": tomorrow, or a chosen later day.
 */
export function PostponeDialog({
  open,
  title,
  subtitle,
  fromDate,
  onPostpone,
  onClose,
}: {
  open: boolean
  title: string
  subtitle?: string
  fromDate: string // the day being viewed
  onPostpone: (toDate: string) => void
  onClose: () => void
}) {
  const [picking, setPicking] = useState(false)
  const tomorrow = nextDay(fromDate)
  const close = () => {
    setPicking(false)
    onClose()
  }
  const choose = (iso: string) => {
    setPicking(false)
    onPostpone(iso)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[400px] p-0 gap-0 rounded-2xl border-0 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
      >
        <div className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base font-semibold text-slate-900">Posticipa {title}</DialogTitle>
          <DialogDescription className="mt-0.5 text-[13px] text-slate-500">
            {subtitle ? `${subtitle} · ` : ''}lo ritrovi nell&apos;ordine del giorno che scegli
          </DialogDescription>
        </div>
        <div className="px-5 pb-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => choose(tomorrow)}
            className="flex items-center gap-3 min-h-14 px-4 py-2.5 rounded-xl text-left ring-1 bg-slate-900 text-white ring-slate-900 hover:bg-slate-800"
          >
            <CalendarPlus className="h-5 w-5 shrink-0" />
            <span className="flex flex-col">
              <span className="text-[15px] font-semibold leading-tight">Domani</span>
              <span className="text-xs leading-tight text-slate-300">
                {format(toDate(tomorrow), 'EEEE d MMMM', { locale: it })}
              </span>
            </span>
          </button>
          {!picking ? (
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="flex items-center gap-3 min-h-14 px-4 py-2.5 rounded-xl text-left ring-1 bg-white text-slate-800 ring-slate-300 hover:bg-slate-50"
            >
              <CalendarDays className="h-5 w-5 shrink-0 text-slate-500" />
              <span className="text-[15px] font-semibold leading-tight">Scegli un giorno…</span>
            </button>
          ) : (
            <div className="flex justify-center rounded-xl ring-1 ring-slate-200">
              <Calendar
                mode="single"
                locale={it}
                defaultMonth={toDate(tomorrow)}
                disabled={{ before: toDate(tomorrow) }}
                onSelect={(d) => d && choose(toIso(d))}
              />
            </div>
          )}
        </div>
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={close}
            className="w-full h-11 rounded-[10px] border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Annulla
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
