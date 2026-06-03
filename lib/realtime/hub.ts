import { sql } from '@/lib/db/client'

/**
 * Singleton broadcaster bridging Postgres LISTEN/NOTIFY to connected SSE
 * clients. One dedicated Postgres LISTEN connection per bakery channel is held
 * only while at least one client is subscribed; it is released when the last
 * client for that bakery disconnects.
 *
 * Multi-tenant isolation: events flow on a per-bakery channel (`bakery:{id}`),
 * so a bakery never receives another bakery's events.
 */
class Hub {
  /** bakeryId -> set of active SSE stream controllers. */
  private subscribers = new Map<string, Set<ReadableStreamDefaultController>>()
  /** bakeryId -> handle returned by `sql.listen`, used to `.unlisten()`. */
  private listeners = new Map<string, Promise<{ unlisten: () => Promise<void> }>>()
  private encoder = new TextEncoder()

  /**
   * Register a new SSE client. On the first subscriber for a bakery, opens the
   * dedicated Postgres LISTEN connection for `bakery:{id}`.
   */
  subscribe(bakeryId: string, controller: ReadableStreamDefaultController): void {
    let set = this.subscribers.get(bakeryId)
    if (!set) {
      set = new Set()
      this.subscribers.set(bakeryId, set)
    }
    set.add(controller)

    if (!this.listeners.has(bakeryId)) {
      const channel = `bakery:${bakeryId}`
      // postgres v3 manages a dedicated `max: 1` connection for `.listen()`
      // and auto-reconnects/re-LISTENs if it drops.
      const handle = sql.listen(channel, (payload) => {
        this.fanOut(bakeryId, payload)
      })
      this.listeners.set(bakeryId, handle)
    }
  }

  /**
   * Deregister an SSE client. When a bakery's set empties, releases its
   * Postgres LISTEN connection.
   */
  unsubscribe(bakeryId: string, controller: ReadableStreamDefaultController): void {
    const set = this.subscribers.get(bakeryId)
    if (!set) return
    set.delete(controller)
    this.releaseIfEmpty(bakeryId)
  }

  /**
   * Release a bakery's Postgres LISTEN connection once it has no subscribers.
   * Called both on explicit unsubscribe and after fan-out prunes a dead
   * controller, so a stream that errored without firing `cancel()` cannot leak
   * the LISTEN connection.
   */
  private releaseIfEmpty(bakeryId: string): void {
    const set = this.subscribers.get(bakeryId)
    if (!set || set.size > 0) return
    this.subscribers.delete(bakeryId)
    const handle = this.listeners.get(bakeryId)
    this.listeners.delete(bakeryId)
    handle
      ?.then((h) => h.unlisten())
      .catch(() => {
        // Listener may have failed to establish or already torn down; ignore.
      })
  }

  /**
   * Fan a NOTIFY payload out to every SSE client of a bakery as an SSE `data:`
   * frame. Controllers whose `enqueue` throws (stream already closed) are
   * pruned silently.
   */
  private fanOut(bakeryId: string, payload: string): void {
    const set = this.subscribers.get(bakeryId)
    if (!set || set.size === 0) return

    const frame = this.encoder.encode(`data: ${payload}\n\n`)
    let pruned = false
    for (const controller of set) {
      try {
        controller.enqueue(frame)
      } catch {
        set.delete(controller)
        pruned = true
      }
    }
    // If every client for this bakery was dead, release its LISTEN connection.
    if (pruned) this.releaseIfEmpty(bakeryId)
  }
}

function createHub(): Hub {
  return new Hub()
}

// Singleton across HMR in dev so we don't leak duplicate LISTEN connections.
const globalForHub = globalThis as unknown as { __realtimeHub?: Hub }
const hub = (globalForHub.__realtimeHub ??= createHub())
if (process.env.NODE_ENV !== 'production') globalForHub.__realtimeHub = hub

export { hub }
