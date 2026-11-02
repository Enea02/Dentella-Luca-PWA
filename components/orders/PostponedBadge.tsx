import { cn } from '@/lib/utils'

/** "rimandato dal 15/12" under a product postponed here from another day. */
export function PostponedBadge({ from, className }: { from?: string; className?: string }) {
  if (!from) return null
  return (
    <p className={cn('text-[11px] font-semibold text-amber-700', className)}>
      ↻ rimandato dal {from.slice(8, 10)}/{from.slice(5, 7)}
    </p>
  )
}
