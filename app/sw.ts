/// <reference lib="webworker" />

import { defaultCache } from '@serwist/next/worker'
import {
  BackgroundSyncQueue,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
  StaleWhileRevalidate,
} from 'serwist'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Reference data — StaleWhileRevalidate (serve from cache, refresh in background)
    {
      matcher: /\/api\/(products|customers|sections|production-groups|divisors|bakery)$/,
      handler: new NetworkFirst({
        cacheName: 'api-reference-data',
        networkTimeoutSeconds: 3,
        plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 24 * 60 * 60 })], // 24h
      }),
    },
    // Daily orders — NetworkFirst (fresh when possible, cache as fallback)
    {
      matcher: /\/api\/orders\?date=/,
      handler: new NetworkFirst({
        cacheName: 'api-orders',
        networkTimeoutSeconds: 3,
        plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 5 * 60 })], // 5min
      }),
    },
    // Orders range (statistics) — StaleWhileRevalidate
    {
      matcher: /\/api\/orders\/range/,
      handler: new StaleWhileRevalidate({
        cacheName: 'api-orders-range',
        plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 })], // 1h
      }),
    },
    // Google fonts — CacheFirst (immutable)
    {
      matcher: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: new CacheFirst({
        cacheName: 'google-fonts',
        plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 })], // 1 year
      }),
    },
    // Icons and static assets — CacheFirst
    {
      matcher: /\/icons\/.*\.png$/,
      handler: new CacheFirst({
        cacheName: 'static-assets',
        plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 })], // 30 days
      }),
    },
    // Default for everything else
    ...defaultCache,
  ],
})

// ---- Background Sync for idempotent toggle mutations ----
// The most frequent action in production is marking a product as "done"
// (POST /api/orders/toggle). If WiFi drops, the request is queued and
// replayed automatically when the connection returns.
const toggleQueue = new BackgroundSyncQueue('toggle-sync', {
  maxRetentionTime: 24 * 60, // 24 hours
})

serwist.registerCapture(
  /\/api\/orders\/toggle$/,
  async ({ request }) => {
    try {
      return await fetch(request.clone())
    } catch {
      await toggleQueue.pushRequest({ request })
      return new Response(JSON.stringify({ queued: true }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
  'POST',
)

serwist.addEventListeners()
