'use client'

import useSWR, { useSWRConfig } from 'swr'
import { panettoniApi } from '@/lib/api'
import { withDelivery, withRowStatus, withStatusFromDeliveries } from '@/lib/panettoni/helpers'
import type {
  NewPanettoneOrder,
  PanettoneFlavor,
  PanettoneOrder,
  PanettoneStatus,
  PlanParams,
  PlanSettings,
} from '@/lib/panettoni/types'

// SWR keys all start with 'panettoni' so the realtime handler can invalidate
// the whole section with one matcher. None are persisted to localStorage
// (see lib/swr-provider.tsx), so a reload always shows server state.

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
      { optimisticData: (current) => next(current ?? []), rollbackOnError: true, populateCache: false, revalidate: true },
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
        optimisticData: (current) => (current ?? []).map((o) => (o.id === id ? patch(o) : o)),
        rollbackOnError: true,
        populateCache: false,
        revalidate: true,
      },
    )

  return {
    orders: data ?? [],
    isLoading,
    error,
    mutate,
    createOrder: async (order: NewPanettoneOrder) => {
      const created = await panettoniApi.createOrder(order)
      await mutate((current) => [...(current ?? []), created], { revalidate: true })
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
          optimisticData: (current) => (current ?? []).filter((o) => o.id !== id),
          rollbackOnError: true,
          populateCache: false,
          revalidate: true,
        },
      ),
    setStatus: (id: string, status: PanettoneStatus) =>
      patchOrder(id, (o) => withRowStatus(o, status), () => panettoniApi.setStatus(id, status)),
    // One cell: that flavor handed to the customer. All delivered → archive.
    setDelivered: (id: string, flavorId: string, delivered: boolean) =>
      patchOrder(
        id,
        (o) => withDelivery(o, flavorId, delivered),
        () => panettoniApi.setDelivered(id, flavorId, delivered),
      ),
    // qty 0 removes the flavor from the order.
    setItemQty: (id: string, flavorId: string, qty: number) =>
      patchOrder(
        id,
        (o) => {
          const rest = o.items.filter((i) => i.flavorId !== flavorId)
          if (qty === 0) return withStatusFromDeliveries({ ...o, items: rest })
          const prev = o.items.find((i) => i.flavorId === flavorId)
          const producedQty = Math.min(prev?.producedQty ?? 0, qty)
          return { ...o, items: [...rest, { flavorId, qty, producedQty, delivered: prev?.delivered ?? false }] }
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
        optimisticData: (current) =>
          current ? { ...current, ...patch, confirmedAt: null, confirmedPlan: null } : (current as never),
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
          optimisticData: (current) => {
            if (!current?.confirmedPlan) return current as PlanSettings
            const days = current.confirmedPlan.days.map((d) =>
              d.date !== date || !d.items[flavorId]
                ? d
                : { ...d, items: { ...d.items, [flavorId]: { ...d.items[flavorId], done } } },
            )
            return { ...current, confirmedPlan: { ...current.confirmedPlan, days } }
          },
          rollbackOnError: true,
          populateCache: false,
          revalidate: true,
        },
      )
      await globalMutate(['panettoni', 'orders', season])
    },
  }
}
