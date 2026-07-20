'use client'

import { useEffect, useRef, useState } from 'react'
import type { OrderItem, Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SheetCellProps {
  product: Product
  item?: OrderItem
  /** Grid coordinates, used for Excel-style keyboard navigation. */
  r: number
  c: number
  onCommit: (productId: string, quantity: number, unit: 'pieces' | 'kg') => void
  onRemove: (productId: string) => void
}

/**
 * One editable cell of the spreadsheet: a quantity input + a small unit chip (pz/kg).
 * - Commits on blur (or immediately on unit change) — no network write per keystroke.
 * - Enter / ↓ / ↑ move to the cell above/below (like a spreadsheet); Tab moves right.
 * - Syncs from external data only while not focused.
 */
export function SheetCell({ product, item, r, c, onCommit, onRemove }: SheetCellProps) {
  const [value, setValue] = useState(item ? String(item.quantity) : '')
  const [unit, setUnit] = useState<'pieces' | 'kg'>(item?.unit ?? product.unit)
  const focused = useRef(false)

  const itemQty = item?.quantity
  const itemUnit = item?.unit
  useEffect(() => {
    if (focused.current) return
    setValue(itemQty != null ? String(itemQty) : '')
    setUnit(itemUnit ?? product.unit)
  }, [itemQty, itemUnit, product.unit])

  const commit = (raw: string, u: 'pieces' | 'kg') => {
    const q = parseFloat(raw)
    if (isNaN(q) || q <= 0) {
      if (item) onRemove(product.id)
      setValue('')
      return
    }
    if (!item || Number(item.quantity) !== q || item.unit !== u) {
      onCommit(product.id, q, u)
    }
  }

  const move = (dr: number, from: HTMLInputElement) => {
    const target = from
      .closest('table')
      ?.querySelector<HTMLInputElement>(`input[data-r="${r + dr}"][data-c="${c}"]`)
    if (target) {
      target.focus()
      target.select()
    }
  }

  // Size the input to the number's length (in char widths) so 3+ digit values aren't
  // clipped: the column grows to fit and shrinks back to the minimum for short values.
  const inputWidth = `${Math.max(value.length, 2) + 1.5}ch`

  return (
    <div className="flex h-full items-center justify-center gap-0.5 px-0.5">
      <input
        data-r={r}
        data-c={c}
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={value}
        onFocus={(e) => {
          focused.current = true
          e.currentTarget.select()
        }}
        onBlur={() => {
          focused.current = false
          commit(value, unit)
        }}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'ArrowDown') {
            e.preventDefault()
            commit(value, unit)
            move(1, e.currentTarget)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            commit(value, unit)
            move(-1, e.currentTarget)
          }
        }}
        style={{ width: inputWidth }}
        className="shrink-0 bg-transparent py-3 text-center text-sm tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:[-webkit-appearance:none] [&::-webkit-outer-spin-button]:[-webkit-appearance:none]"
      />
      <Select
        value={unit}
        onValueChange={(v) => {
          const u = v as 'pieces' | 'kg'
          setUnit(u)
          if (item) commit(value, u)
        }}
      >
        <SelectTrigger
          tabIndex={-1}
          aria-label="Cambia unità"
          className={cn(
            'h-auto w-auto shrink-0 gap-0 border-0 bg-transparent p-1 text-[10px] font-medium leading-none text-slate-400 shadow-none transition-colors hover:text-slate-700 focus-visible:ring-0 data-[size=default]:h-auto [&_svg]:hidden',
            value === '' && 'pointer-events-none invisible',
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="min-w-[4rem]">
          <SelectItem value="pieces">pz</SelectItem>
          <SelectItem value="kg">kg</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
