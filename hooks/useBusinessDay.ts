'use client'

import { useEffect, useRef } from 'react'
import { useBakery } from '@/hooks/useData'
import { useAppStore } from '@/lib/store'

// Format a Date as a local-time ISO date string (YYYY-MM-DD), mirroring
// getTodayISO()'s output but in LOCAL time (not UTC) so the day doesn't shift.
function toLocalISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Once per app session (on first mount, after the bakery loads), select the
 * "business day": if an admin cutoff hour is configured and the current local
 * hour is >= that cutoff, default to tomorrow's date; otherwise today's. When
 * no cutoff is set (orderCutoffHour == null) the selected date is left as-is.
 */
export function useBusinessDay() {
  const { bakery } = useBakery()
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)
  const appliedRef = useRef(false)

  useEffect(() => {
    if (appliedRef.current) return
    if (!bakery) return

    // Bakery is now available — run exactly once for this session.
    appliedRef.current = true

    const cutoff = bakery.orderCutoffHour
    if (cutoff == null) return

    const now = new Date()
    const target = new Date(now)
    if (now.getHours() >= cutoff) {
      // Tomorrow, computed in LOCAL time.
      target.setDate(target.getDate() + 1)
    }
    setSelectedDate(toLocalISODate(target))
  }, [bakery, setSelectedDate])
}
