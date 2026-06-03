import { auth } from '@/auth'
import { hub } from '@/lib/realtime/hub'

// `postgres` LISTEN/NOTIFY requires Node.js APIs (not the Edge runtime), and
// the SSE stream must never be cached or statically optimized.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const HEARTBEAT_MS = 25_000

export async function GET() {
  const session = await auth()
  const bakeryId = session?.user?.bakeryId
  if (!bakeryId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  let heartbeat: ReturnType<typeof setInterval> | undefined
  let streamController: ReadableStreamDefaultController | undefined

  const stream = new ReadableStream({
    start(controller) {
      streamController = controller
      hub.subscribe(bakeryId, controller)

      // Initial comment frame so the client's EventSource transitions to open.
      controller.enqueue(encoder.encode(': connected\n\n'))

      // Heartbeat comment keeps the connection alive through Cloudflare
      // Tunnel's ~100s idle timeout. EventSource ignores comment frames.
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          // Stream already closed; cancel() will clean up.
        }
      }, HEARTBEAT_MS)
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat)
      if (streamController) hub.unsubscribe(bakeryId, streamController)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
