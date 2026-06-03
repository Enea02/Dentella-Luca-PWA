import { sql } from '@/lib/db/client'

export type RealtimeEventType =
  | 'orders.updated'
  | 'customers.updated'
  | 'products.updated'
  | 'production-groups.updated'
  | 'bakery.updated'
  | 'users.updated'
  | 'permissions.updated'
  | 'divisors.updated'

export interface RealtimeEvent {
  type: RealtimeEventType
  entityId?: string
  date?: string
}

/**
 * Emit a realtime event to all clients connected to the given bakery via
 * Postgres LISTEN/NOTIFY. Must be called AFTER the DB transaction commits
 * (never inside `db.transaction()`), otherwise clients would revalidate and
 * read stale state.
 *
 * The payload is intentionally minimal (`{type, entityId?, date?}`) — no PII —
 * the client uses `type` to decide which SWR cache key(s) to invalidate, then
 * refetches via the permission-checked API.
 */
export async function notify(bakeryId: string, event: RealtimeEvent): Promise<void> {
  const channel = `bakery:${bakeryId}`
  await sql.notify(channel, JSON.stringify(event))
}
