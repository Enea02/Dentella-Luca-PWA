'use client'

import { SWRConfig, preload } from 'swr'
import type { Cache } from 'swr'
import { useRef, type ReactNode } from 'react'
import { productsApi, customersApi, sectionsApi } from '@/lib/api'

// Only reference data is persisted across sessions. Orders/statistics/users
// go stale quickly and must never be served from an old localStorage snapshot.
const PERSIST_KEYS = ['products', 'customers', 'sections', 'production-groups', 'divisors', 'bakery']

function localStorageProvider(): Cache {
  // Rendered during SSR — no window/localStorage available there.
  if (typeof window === 'undefined') {
    return new Map()
  }

  let initial: [string, unknown][] = []
  try {
    initial = JSON.parse(localStorage.getItem('swr-cache') || '[]')
  } catch {
    initial = []
  }
  const map = new Map<string, unknown>(initial)

  const persist = () => {
    try {
      const entries = [...map.entries()].filter(([key]) =>
        PERSIST_KEYS.includes(typeof key === 'string' ? key : ''),
      )
      localStorage.setItem('swr-cache', JSON.stringify(entries))
    } catch {
      // Quota exceeded or storage unavailable — fail silently.
    }
  }

  // `visibilitychange -> hidden` and `pagehide` fire reliably on mobile when the
  // app is backgrounded/closed; `beforeunload` does NOT on iOS Safari (and it
  // also blocks the bfcache), so we avoid it for this mobile-first PWA.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persist()
  })
  window.addEventListener('pagehide', persist)

  return map as unknown as Cache
}

export function SWRProvider({ children }: { children: ReactNode }) {
  // Prefetch critical reference data once at mount so navigating to pages that
  // share it (orders -> production) renders instantly from cache.
  const prefetched = useRef(false)
  if (!prefetched.current && typeof window !== 'undefined') {
    prefetched.current = true
    preload('products', () => productsApi.list())
    preload('customers', () => customersApi.list())
    preload('sections', () => sectionsApi.list())
  }

  return (
    <SWRConfig
      value={{
        provider: localStorageProvider,
        revalidateOnFocus: false,
        dedupingInterval: 10_000,
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  )
}
