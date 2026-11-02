'use client'

import { useMemo } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { panettoniApi } from '@/lib/api'
import { statusFromItems, withItemState, withRowStatus, withStatusFromItems } from '@/lib/panettoni/helpers'
import type {
  NewPanettoneOrder,
  PanettoneFlavor,
  PanettoneItemState,
  PanettoneOrder,
  PanettoneStatus,
  PanettoniForCustomer,
  PlanParams,
  PlanSettings,
} from '@/lib/panettoni/types'

// SWR keys all start with 'panettoni' so the realtime handler can invalidate
// the whole section with one matcher. None are persisted to localStorage
// (see lib/swr-provider.tsx), so a reload always shows server state.

// The same orders are shown in two places: the season table (['panettoni', 'orders', season])
// and, for customers linked to the gestionale, each day in Ordini (['panettoni', 'by-date', date]).
// A change made in one place must refresh the other locally (realtime is off on Vercel).
const isDayKey = (key: unknown) => Array.isArray(key) && key[0] === 'panettoni' && key[1] === 'by-date'
const isSeasonKey = (key: unknown) => Array.isArray(key) && key[0] === 'panettoni' && key[1] === 'orders'

/**
 * Builds optimistic data from what is ON SCREEN. SWR passes the last
 * server-confirmed value first and the displayed one second: building on the
 * confirmed value would drop an earlier optimistic change still in flight
 * (tap two cells quickly → the first one flips back on screen).
 */
function onScreen<T>(committed: T | undefined, displayed: T | undefined, next: (current: T | undefined) => T): T {
  return next(displayed ?? committed)
}

export function usePanettoneFlavors() {
  const { data, error, isLoading, mutate } = useSWR<PanettoneFlavor[]>(
    ['panettoni', 'flavors'],
    () => panettoniApi.flavors(),
  )

  // Optimistic local change, rolled back if the request fails, then revalidated.
  const optimistic = (next: (list: PanettoneFlavor[]) => PanettoneFlavor[], request: () => Promise<unknown>) =>
    mutate(
      async (current) => {
        await request()
        return current
      },
      {
        optimisticData: (committed, displayed) => onScreen(committed, displayed, (current) => next(current ?? [])),
        rollbackOnError: true,
        populateCache: false,
        revalidate: true,
      },
    )

  return {
    flavors: data ?? [],
    error,
    isLoading,
    createFlavor: async (name: string, color: string) => {
      const created = await panettoniApi.createFlavor(name, color)
      await mutate((current) => [...(current ?? []), created], { revalidate: true })
      return created
    },
    updateFlavor: (id: string, patch: Partial<Pick<PanettoneFlavor, 'name' | 'color' | 'active'>>) =>
      optimistic(
        (list) => list.map((f) => (f.id === id ? { ...f, ...patch } : f)),
        () => panettoniApi.updateFlavor(id, patch),
      ),
    // Resolves to 'hidden' when the flavor is used by some order (kept, just not offered).
    deleteFlavor: async (id: string) => {
      const { result } = await panettoniApi.deleteFlavor(id)
      await mutate()
      return result
    },
    reorderFlavors: (orderedIds: string[]) =>
      optimistic(
        (list) =>
          orderedIds
            .map((id, i) => {
              const f = list.find((x) => x.id === id)
              return f && { ...f, sortOrder: i }
            })
            .filter((f): f is PanettoneFlavor => !!f),
        () => panettoniApi.reorderFlavors(orderedIds),
      ),
  }
}

export function usePanettoneOrders(season: number) {
  const { mutate: globalMutate } = useSWRConfig()
  const refreshDays = () => globalMutate(isDayKey)
  const { data, error, isLoading, mutate } = useSWR<PanettoneOrder[]>(
    ['panettoni', 'orders', season],
    () => panettoniApi.orders(season),
    { keepPreviousData: true },
  )

  // Optimistic local patch, rolled back if the request fails, then revalidated.
  const patchOrder = (
    id: string,
    patch: (o: PanettoneOrder) => PanettoneOrder,
    request: () => Promise<unknown>,
  ) =>
    mutate(
      async (current) => {
        await request()
        return current
      },
      {
        optimisticData: (committed, displayed) =>
          onScreen(committed, displayed, (current) => (current ?? []).map((o) => (o.id === id ? patch(o) : o))),
        rollbackOnError: true,
        populateCache: false,
        revalidate: true,
      },
    ).finally(refreshDays)

  return {
    orders: data ?? [],
    isLoading,
    error,
    mutate,
    createOrder: async (order: NewPanettoneOrder) => {
      const created = await panettoniApi.createOrder(order)
      await mutate((current) => [...(current ?? []), created], { revalidate: true })
      refreshDays()
      return created
    },
    updateOrder: (id: string, fields: Partial<Omit<NewPanettoneOrder, 'items'>>) =>
      patchOrder(id, (o) => ({ ...o, ...fields }) as PanettoneOrder, () => panettoniApi.updateOrder(id, fields)),
    deleteOrder: (id: string) =>
      mutate(
        async (current) => {
          await panettoniApi.deleteOrder(id)
          return current
        },
        {
          optimisticData: (committed, displayed) =>
            onScreen(committed, displayed, (current) => (current ?? []).filter((o) => o.id !== id)),
          rollbackOnError: true,
          populateCache: false,
          revalidate: true,
        },
      ).finally(refreshDays),
    setStatus: (id: string, status: PanettoneStatus) =>
      patchOrder(id, (o) => withRowStatus(o, status), () => panettoniApi.setStatus(id, status)),
    // One cell: da fare / in magazzino / consegnato. All delivered → archive.
    setItemState: (id: string, flavorId: string, state: PanettoneItemState) =>
      patchOrder(
        id,
        (o) => withItemState(o, flavorId, state),
        () => panettoniApi.setItemState(id, flavorId, state),
      ),
    // qty 0 removes the flavor from the order.
    setItemQty: (id: string, flavorId: string, qty: number) =>
      patchOrder(
        id,
        (o) => {
          const rest = o.items.filter((i) => i.flavorId !== flavorId)
          if (qty === 0) return withStatusFromItems({ ...o, items: rest })
          const prev = o.items.find((i) => i.flavorId === flavorId)
          const producedQty = Math.min(prev?.producedQty ?? 0, qty)
          const state = prev?.state ?? 'todo'
          return withStatusFromItems({ ...o, items: [...rest, { flavorId, qty, producedQty, state }] })
        },
        () => panettoniApi.setItemQty(id, flavorId, qty),
      ),
  }
}

export function usePanettonePlanSettings(season: number) {
  const { mutate: globalMutate } = useSWRConfig()
  const { data, error, isLoading, mutate } = useSWR<PlanSettings>(
    ['panettoni', 'plan-settings', season],
    () => panettoniApi.planSettings(season),
  )

  return {
    settings: data,
    isLoading,
    error,
    // Any parameter change voids the confirmation (mirrors the server).
    update: (patch: Partial<PlanParams> & { startDate?: string | null }) =>
      mutate(() => panettoniApi.updatePlanSettings(season, patch), {
        optimisticData: (committed, displayed) =>
          onScreen(committed, displayed, (current) =>
            current ? { ...current, ...patch, confirmedAt: null, confirmedPlan: null } : (current as never),
          ),
        rollbackOnError: true,
        populateCache: true,
        revalidate: false,
      }),
    confirm: () => mutate(() => panettoniApi.confirmPlan(season), { populateCache: true, revalidate: false }),
    // Marks a flavor of a confirmed-plan day as baked. Changes orders too
    // (producedQty, todo → stock), so the orders key is revalidated as well.
    markProduced: async (date: string, flavorId: string, done: boolean) => {
      await mutate(
        async (current) => {
          await panettoniApi.markProduced(season, date, flavorId, done)
          return current
        },
        {
          optimisticData: (committed, displayed) =>
            onScreen(committed, displayed, (current) => {
              if (!current?.confirmedPlan) return current as PlanSettings
              const days = current.confirmedPlan.days.map((d) =>
                d.date !== date || !d.items[flavorId]
                  ? d
                  : { ...d, items: { ...d.items, [flavorId]: { ...d.items[flavorId], done } } },
              )
              return { ...current, confirmedPlan: { ...current.confirmedPlan, days } }
            }),
          rollbackOnError: true,
          populateCache: false,
          revalidate: true,
        },
      )
      await globalMutate(['panettoni', 'orders', season])
    },
  }
}

/**
 * Panettoni of customers linked to the gestionale, for one day (Ordini).
 * Same cadence as useOrders(date). Changes write to the panettoni orders and
 * refresh the season table too.
 */
export function usePanettoniForDate(date: string) {
  const { mutate: globalMutate } = useSWRConfig()
  const { data, error, isLoading, mutate } = useSWR<PanettoniForCustomer[]>(
    date ? ['panettoni', 'by-date', date] : null,
    () => panettoniApi.forDate(date),
    { dedupingInterval: 5_000, refreshInterval: 30_000, keepPreviousData: true },
  )

  const byCustomer = useMemo(() => groupByCustomer(data ?? []), [data])

  const done = async () => {
    await mutate()
    await globalMutate(isSeasonKey)
  }

  // Optimistic local patch of one order, rolled back if the request fails.
  const patch = (
    orderId: string,
    next: (o: PanettoniForCustomer) => PanettoniForCustomer | null,
    request: () => Promise<unknown>,
  ) =>
    mutate(
      async (current) => {
        await request()
        return current
      },
      {
        optimisticData: (committed, displayed) =>
          onScreen(committed, displayed, (current) =>
            (current ?? []).flatMap((o) => {
              if (o.orderId !== orderId) return [o]
              const n = next(o)
              return n ? [n] : []
            }),
          ),
        rollbackOnError: true,
        populateCache: false,
        revalidate: false,
      },
    ).finally(done)

  return {
    /** By customer: a customer may have more than one panettoni order on the same day. */
    byCustomer,
    error,
    isLoading,
    addPanettone: async (customerId: string, flavorId: string, qty: number) => {
      await panettoniApi.addForCustomer(customerId, date, flavorId, qty)
      await done()
    },
    // In magazzino / Consegnato from Ordini: the same cell as in the Panettoni table.
    setItemState: (orderId: string, flavorId: string, state: PanettoneItemState) =>
      patch(
        orderId,
        (o) => {
          const items = o.items.map((i) => (i.flavorId === flavorId ? { ...i, state } : i))
          return { ...o, items, status: statusFromItems(items, o.status) }
        },
        () => panettoniApi.setItemState(orderId, flavorId, state),
      ),
    // Moves ONE flavor to a later day: refresh every loaded day (the target too) and the season table.
    postpone: (orderId: string, flavorId: string, toDate: string) =>
      patch(
        orderId,
        (o) => {
          const items = o.items.filter((i) => i.flavorId !== flavorId)
          return items.length ? { ...o, items } : null
        },
        () => panettoniApi.postpone(orderId, flavorId, toDate),
      ).finally(() => globalMutate(isDayKey)),
    // qty 0 removes the flavor; removing the last one deletes the whole panettoni order.
    setQty: (orderId: string, flavorId: string, qty: number) => {
      const order = data?.find((o) => o.orderId === orderId)
      const isLast = !!order && order.items.length === 1 && order.items[0].flavorId === flavorId
      if (qty === 0 && isLast) {
        return patch(orderId, () => null, () => panettoniApi.deleteOrder(orderId))
      }
      return patch(
        orderId,
        (o) => ({
          ...o,
          items:
            qty === 0
              ? o.items.filter((i) => i.flavorId !== flavorId)
              : o.items.map((i) => (i.flavorId === flavorId ? { ...i, qty } : i)),
        }),
        () => panettoniApi.setItemQty(orderId, flavorId, qty),
      )
    },
  }
}

function groupByCustomer(list: PanettoniForCustomer[]): Map<string, PanettoniForCustomer[]> {
  const map = new Map<string, PanettoniForCustomer[]>()
  for (const o of list) map.set(o.customerId, [...(map.get(o.customerId) ?? []), o])
  return map
}
