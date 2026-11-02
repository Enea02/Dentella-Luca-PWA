'use client'

import { useEffect, useRef } from 'react'

const MOVE_TOLERANCE = 10 // px: more than this is a scroll, not a press

/**
 * Long press on a row (touch or mouse). Returns props to spread on the element.
 * - Ignored when the press starts on a form field (quantity, unit, variant…).
 * - Cancelled when the finger moves (the user is scrolling the list).
 * - The click that ends a long press is swallowed, so the row's own tap
 *   action (e.g. "fatto") doesn't fire too.
 */
export function useLongPress(onLongPress: (() => void) | undefined, delay = 500) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const start = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)

  useEffect(() => () => clearTimeout(timer.current), [])

  if (!onLongPress) return {}

  const cancel = () => {
    clearTimeout(timer.current)
    start.current = null
  }

  return {
    onPointerDown: (e: React.PointerEvent) => {
      fired.current = false // a new gesture
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, [role="combobox"]')) return
      start.current = { x: e.clientX, y: e.clientY }
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        fired.current = true
        start.current = null
        navigator.vibrate?.(30)
        onLongPress()
      }, delay)
    },
    onPointerMove: (e: React.PointerEvent) => {
      const s = start.current
      if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > MOVE_TOLERANCE) cancel()
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onClickCapture: (e: React.MouseEvent) => {
      if (!fired.current) return
      fired.current = false
      e.preventDefault()
      e.stopPropagation()
    },
    // No native "copy / share" menu on a long press.
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  }
}
