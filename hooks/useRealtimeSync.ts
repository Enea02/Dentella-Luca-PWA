'use client'

import { useEffect } from 'react'
import { useSWRConfig } from 'swr'

/** Minimal shape of the SSE payload emitted by `lib/realtime/notify.ts`. */
interface RealtimeEvent {
  type:
    | 'orders.updated'
    | 'customers.updated'
    | 'products.updated'
    | 'production-groups.updated'
    | 'bakery.updated'
    | 'users.updated'
    | 'permissions.updated'
    | 'divisors.updated'
  entityId?: string
  date?: string
}

const INITIAL_BACKOFF_MS = 1_000
const MAX_BACKOFF_MS = 30_000

/**
 * Subscribes the current tab to the bakery's realtime event stream
 * (`/api/events`, SSE) and invalidates the matching SWR cache key(s) when an
 * event arrives, so changes made by other users propagate without a reload.
 *
 * Reconnect uses manual exponential backoff (1s -> 30s, reset on open) instead
 * of EventSource's native reconnect, which is not backoff-configurable.
 *
 * `mutate` is taken from `useSWRConfig()` (bound to the active SWR provider).
 * It MUST NOT be the top-level `import { mutate } from 'swr'`: that unbound
 * global targets the default cache and would silently miss the custom
 * localStorage-backed provider, so realtime updates would do nothing.
 */
export function useRealtimeSync() {
  const { mutate } = useSWRConfig()

  useEffect(() => {
    let source: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    let backoff = INITIAL_BACKOFF_MS
    let closed = false

    const handleEvent = (event: RealtimeEvent) => {
      switch (event.type) {
        case 'orders.updated':
          if (event.date) {
            // A specific day changed: revalidate that day's orders...
            mutate(['orders', event.date])
            // ...and any loaded statistics ranges that may include it.
            mutate((key) => Array.isArray(key) && key[0] === 'statistics')
          } else {
            // Recurring order changed: revalidate every loaded orders date
            // plus statistics, since any date could be affected.
            mutate(
              (key) =>
                Array.isArray(key) &&
                (key[0] === 'orders' || key[0] === 'statistics')
            )
          }
          break
        case 'customers.updated':
          mutate('customers')
          break
        case 'products.updated':
          // Products and sections are linked in the products view.
          mutate('products')
          mutate('sections')
          break
        case 'production-groups.updated':
          mutate('production-groups')
          break
        case 'bakery.updated':
          mutate('bakery')
          break
        case 'users.updated':
          mutate('users')
          break
        case 'permissions.updated':
          // Permission changes invalidate the users list.
          mutate('users')
          break
        case 'divisors.updated':
          mutate('divisors')
          break
      }
    }

    const connect = () => {
      if (closed) return
      source = new EventSource('/api/events')

      source.onopen = () => {
        // Successful connection: reset the backoff window.
        backoff = INITIAL_BACKOFF_MS
      }

      source.onmessage = (e) => {
        try {
          handleEvent(JSON.parse(e.data) as RealtimeEvent)
        } catch {
          // Ignore malformed frames (comments/heartbeats never reach here).
        }
      }

      source.onerror = () => {
        // Tear down and reconnect manually with exponential backoff so we
        // don't flood the server while it (or the network) is down.
        source?.close()
        source = null
        if (closed) return
        reconnectTimer = setTimeout(connect, backoff)
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS)
      }
    }

    connect()

    return () => {
      closed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      source?.close()
    }
  }, [mutate])
}
