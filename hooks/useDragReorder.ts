'use client'

import { useRef, useState } from 'react'

/**
 * Drag-to-reorder via **Pointer Events** — works with both mouse and touch,
 * unlike the HTML5 drag-and-drop API which doesn't fire on mobile browsers
 * (iOS Safari especially). Items live-swap as you drag a handle; on release,
 * `onCommit(orderedIds)` fires with the final order (only if it changed).
 *
 * Usage:
 *   const { displayItems, registerRow, dragHandleProps, draggingId } =
 *     useDragReorder(items, (i) => i.id, (ids) => save(ids))
 *   // render `displayItems` (not `items`)
 *   // row container:  ref={registerRow(item.id)}
 *   // drag handle:    <div {...dragHandleProps(item.id)} className="touch-none cursor-grab">⠿</div>
 *   // dragged style:  draggingId === item.id && '…'
 *
 * Attach the handle to a dedicated grip element (not the whole row), so the rest
 * of the row stays interactive on touch.
 */
export function useDragReorder<T>(
  items: T[],
  getId: (item: T) => string,
  onCommit: (orderedIds: string[]) => void,
) {
  const dragIdRef = useRef<string | null>(null)
  const orderRef = useRef<string[] | null>(null)
  const rowRefs = useRef<Map<string, HTMLElement>>(new Map())
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [orderOverride, setOrderOverride] = useState<string[] | null>(null)

  const baseIds = items.map(getId)

  const displayItems = orderOverride
    ? (() => {
        const byId = new Map(items.map((it) => [getId(it), it]))
        return orderOverride
          .map((id) => byId.get(id))
          .filter((it): it is T => it !== undefined)
      })()
    : items

  const registerRow = (id: string) => (el: HTMLElement | null) => {
    if (el) rowRefs.current.set(id, el)
    else rowRefs.current.delete(id)
  }

  const rowIdUnderY = (clientY: number): string | null => {
    for (const [id, el] of rowRefs.current) {
      const r = el.getBoundingClientRect()
      if (clientY >= r.top && clientY <= r.bottom) return id
    }
    return null
  }

  const dragHandleProps = (id: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault()
      dragIdRef.current = id
      orderRef.current = baseIds
      setDraggingId(id)
      setOrderOverride(baseIds)
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    onPointerMove: (e: React.PointerEvent) => {
      const dragging = dragIdRef.current
      if (!dragging) return
      const targetId = rowIdUnderY(e.clientY)
      if (!targetId || targetId === dragging) return
      const arr = orderRef.current ?? baseIds
      const from = arr.indexOf(dragging)
      const to = arr.indexOf(targetId)
      if (from === -1 || to === -1) return
      const next = [...arr]
      next.splice(from, 1)
      next.splice(to, 0, dragging)
      orderRef.current = next
      setOrderOverride(next)
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
      const dragging = dragIdRef.current
      const finalOrder = orderRef.current
      dragIdRef.current = null
      orderRef.current = null
      setDraggingId(null)
      setOrderOverride(null)
      if (dragging && finalOrder && finalOrder.join(',') !== baseIds.join(',')) {
        onCommit(finalOrder)
      }
    },
    onPointerCancel: (e: React.PointerEvent) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
      dragIdRef.current = null
      orderRef.current = null
      setDraggingId(null)
      setOrderOverride(null)
    },
  })

  return { displayItems, registerRow, dragHandleProps, draggingId }
}
