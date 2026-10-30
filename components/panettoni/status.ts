import type { PanettoneStatus } from '@/lib/panettoni/types'

// Row colors per status (design handoff: todo white, stock yellow, done green).
export const STATUS_STYLE: Record<PanettoneStatus, { row: string; dot: string; line: string }> = {
  todo: { row: 'bg-white', dot: 'bg-slate-300', line: 'border-slate-200' },
  stock: { row: 'bg-yellow-100', dot: 'bg-yellow-500', line: 'border-amber-200' },
  done: { row: 'bg-green-100', dot: 'bg-green-500', line: 'border-green-200' },
}

/** Hex color + 2-digit alpha, e.g. alpha(color, 0.08) for a tinted background. */
export function alpha(hex: string, a: number): string {
  return hex + Math.round(a * 255).toString(16).padStart(2, '0')
}
