'use client'

import { useMemo } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { productsApi, customersApi, ordersApi, divisorsApi, createDailyOrder, addOrderItem, clearDailyOrder, bakeryApi, usersApi, sectionsApi, productionGroupsApi, getOrdersForRange, getRecurringBase } from '@/lib/api'
import type { Bakery, ComputedDayOrder, Customer, Divisor, OrderItem, Product, ProductionGroup, RecurringBaseTotal, Role, SectionDef, User } from '@/lib/types'

// ---- Cross-key SWR invalidation matchers ----
// Some entities feed *derived* views: orders for fixed customers are COMPUTED
// from recurring templates + customer state, and statistics aggregate orders.
// A mutation on the source entity must invalidate those derived keys too,
// otherwise the dependent view stays stale until realtime / the 30s refresh /
// a reload. We can't rely on realtime alone (it's disabled on serverless).
const isOrdersKey = (key: unknown) => Array.isArray(key) && key[0] === 'orders'
const isStatsKey = (key: unknown) => Array.isArray(key) && key[0] === 'statistics'
// orders + statistics + the "Aggiunte" baseline all derive from customer state and
// recurring templates. A change to those sources must invalidate all three.
const isOrdersOrStatsKey = (key: unknown) =>
  Array.isArray(key) &&
  (key[0] === 'orders' || key[0] === 'statistics' || key[0] === 'recurring-base')

// Statistics types
export interface CustomerStat {
  customerId: string
  customerName: string
  customerType: string
  orderDays: number
  totalQuantity: number
  doneQuantity: number
}

export interface ProductStat {
  productId: string
  productName: string
  section: string
  unit: string
  totalQuantity: number
  doneQuantity: number
}

export interface CustomerProductStat {
  customerId: string
  customerName: string
  productId: string
  productName: string
  unit: string
  totalQuantity: number
  doneQuantity: number
}

export interface Statistics {
  activeDays: number
  uniqueCustomers: number
  totalQuantityOrdered: number
  totalQuantityDone: number
  perCustomer: CustomerStat[]
  perProduct: ProductStat[]
  perCustomerProduct: CustomerProductStat[]
}

function computeStats(
  data: { date: string; orders: ComputedDayOrder[] }[],
  products: Product[]
): Statistics {
  const productMap = new Map(products.map(p => [p.id, p]))
  const customerMap = new Map<string, CustomerStat>()
  const productStatMap = new Map<string, ProductStat>()
  const cpMap = new Map<string, CustomerProductStat>()
  let activeDays = 0

  for (const { orders } of data) {
    if (orders.length > 0) activeDays++
    for (const order of orders) {
      if (!customerMap.has(order.customerId)) {
        customerMap.set(order.customerId, {
          customerId: order.customerId,
          customerName: order.customerName,
          customerType: order.customerType,
          orderDays: 0,
          totalQuantity: 0,
          doneQuantity: 0,
        })
      }
      const cStat = customerMap.get(order.customerId)!
      cStat.orderDays++

      for (const item of order.items) {
        cStat.totalQuantity += item.quantity
        if (item.done) cStat.doneQuantity += item.quantity

        const product = productMap.get(item.productId)
        if (!productStatMap.has(item.productId)) {
          productStatMap.set(item.productId, {
            productId: item.productId,
            productName: product?.name ?? item.productId,
            section: product?.section ?? '',
            unit: item.unit,
            totalQuantity: 0,
            doneQuantity: 0,
          })
        }
        const pStat = productStatMap.get(item.productId)!
        pStat.totalQuantity += item.quantity
        if (item.done) pStat.doneQuantity += item.quantity

        const cpKey = `${order.customerId}::${item.productId}`
        if (!cpMap.has(cpKey)) {
          cpMap.set(cpKey, {
            customerId: order.customerId,
            customerName: order.customerName,
            productId: item.productId,
            productName: product?.name ?? item.productId,
            unit: item.unit,
            totalQuantity: 0,
            doneQuantity: 0,
          })
        }
        const cpStat = cpMap.get(cpKey)!
        cpStat.totalQuantity += item.quantity
        if (item.done) cpStat.doneQuantity += item.quantity
      }
    }
  }

  const totalQuantityOrdered = [...customerMap.values()].reduce((s, c) => s + c.totalQuantity, 0)
  const totalQuantityDone = [...customerMap.values()].reduce((s, c) => s + c.doneQuantity, 0)

  return {
    activeDays,
    uniqueCustomers: customerMap.size,
    totalQuantityOrdered,
    totalQuantityDone,
    perCustomer: [...customerMap.values()].sort((a, b) => b.totalQuantity - a.totalQuantity),
    perProduct: [...productStatMap.values()].sort((a, b) => b.totalQuantity - a.totalQuantity),
    perCustomerProduct: [...cpMap.values()].sort((a, b) =>
      a.customerName.localeCompare(b.customerName) || b.totalQuantity - a.totalQuantity
    ),
  }
}

// Products hook
export function useProducts() {
  const { data, error, isLoading, mutate } = useSWR<Product[]>(
    'products',
    () => productsApi.list(),
    { dedupingInterval: 30_000 }
  )

  return {
    products: data ?? [],
    isLoading,
    error,
    mutate,
    create: async (product: Omit<Product, 'id'>) => {
      const newProduct = await productsApi.create(product)
      await mutate()
      return newProduct
    },
    update: async (id: string, updates: Partial<Product>) => {
      const updated = await productsApi.update(id, updates)
      await mutate()
      return updated
    },
    remove: async (id: string) => {
      await productsApi.delete(id)
      await mutate()
    },
  }
}

// Customers hook
export function useCustomers() {
  const { mutate: globalMutate } = useSWRConfig()
  const { data, error, isLoading, mutate } = useSWR<Customer[]>(
    'customers',
    () => customersApi.list(),
    { dedupingInterval: 30_000 }
  )

  return {
    customers: data ?? [],
    isLoading,
    error,
    mutate,
    create: async (customer: Omit<Customer, 'id' | 'active'>) => {
      const newCustomer = await customersApi.create(customer)
      await mutate()
      return newCustomer
    },
    update: async (id: string, updates: Partial<Customer>) => {
      const updated = await customersApi.update(id, updates)
      await mutate()
      // name/type/active feed the computed orders view + statistics.
      await globalMutate(isOrdersOrStatsKey)
      return updated
    },
    remove: async (id: string) => {
      await customersApi.delete(id)
      await mutate()
      await globalMutate(isOrdersOrStatsKey)
    },
  }
}

// Orders hook (for a specific date)
export function useOrders(date: string) {
  const { mutate: globalMutate } = useSWRConfig()
  const { data, error, isLoading, mutate } = useSWR<ComputedDayOrder[]>(
    date ? ['orders', date] : null,
    () => ordersApi.getForDate(date),
    { dedupingInterval: 5_000, refreshInterval: 30_000, keepPreviousData: true }
  )

  // Any order change feeds the statistics aggregates for loaded ranges.
  const revalidateStats = () => globalMutate(isStatsKey)

  return {
    orders: data ?? [],
    isLoading,
    error,
    mutate,
    createOrder: async (customerId: string, items: OrderItem[]) => {
      await createDailyOrder(date, customerId, items)
      await mutate()
      await revalidateStats()
    },
    addItem: async (customerId: string, item: OrderItem) => {
      await addOrderItem(date, customerId, item)
      await mutate()
      await revalidateStats()
    },
    toggleItem: async (customerId: string, productId: string, done: boolean) => {
      // Optimistic update
      mutate(
        (current) =>
          current?.map((order) =>
            order.customerId === customerId
              ? {
                  ...order,
                  items: order.items.map((item) =>
                    item.productId === productId ? { ...item, done } : item
                  ),
                }
              : order
          ),
        false
      )
      await ordersApi.toggleItem(date, customerId, productId, done)
      await mutate()
      await revalidateStats()
    },
    updateItem: async (customerId: string, productId: string, updates: Partial<OrderItem>) => {
      // Optimistic update
      mutate(
        (current) =>
          current?.map((order) =>
            order.customerId === customerId
              ? {
                  ...order,
                  items: order.items.map((item) =>
                    item.productId === productId ? { ...item, ...updates } : item
                  ),
                }
              : order
          ),
        false
      )
      await ordersApi.updateItem(date, customerId, productId, updates)
      await mutate()
      await revalidateStats()
    },
    removeItem: async (customerId: string, productId: string) => {
      mutate(
        (current) =>
          current?.map((order) =>
            order.customerId === customerId
              ? { ...order, items: order.items.filter((item) => item.productId !== productId) }
              : order,
          ),
        false,
      )
      await ordersApi.removeItem(date, customerId, productId)
      await mutate()
      await revalidateStats()
    },
    clearOrder: async (customerId: string) => {
      // Optimistically empty the order; the CustomerList hides 0-item orders so the
      // customer disappears from the day. A single customer is removed server-side.
      mutate(
        (current) =>
          current?.map((order) =>
            order.customerId === customerId ? { ...order, items: [] } : order,
          ),
        false,
      )
      await clearDailyOrder(date, customerId)
      await mutate()
      await revalidateStats()
    },
  }
}

// Recurring baseline hook (for the Totals "Aggiunte" board).
// Mirrors useOrders' refresh cadence so the board stays in step with the day view.
export function useRecurringBase(date: string) {
  const { data, isLoading, mutate } = useSWR<RecurringBaseTotal[]>(
    date ? ['recurring-base', date] : null,
    () => getRecurringBase(date),
    { dedupingInterval: 5_000, refreshInterval: 30_000, keepPreviousData: true },
  )
  return { base: data ?? [], isLoading, mutate }
}

// Divisors hook
export function useDivisors() {
  const { data, error, isLoading, mutate } = useSWR<Divisor[]>(
    'divisors',
    () => divisorsApi.list(),
    { dedupingInterval: 30_000 }
  )

  return {
    divisors: data ?? [],
    isLoading,
    error,
    mutate,
    update: async (productId: string, value: number) => {
      // Optimistic update
      mutate(
        (current) => {
          const existing = current?.find((d) => d.productId === productId)
          if (existing) {
            return current?.map((d) =>
              d.productId === productId ? { ...d, value } : d
            )
          }
          return [...(current ?? []), { productId, value }]
        },
        false
      )
      await divisorsApi.update(productId, value)
      await mutate()
    },
  }
}

// Bakery hook
export function useBakery() {
  const { data, error, isLoading, mutate } = useSWR<Bakery>(
    'bakery',
    () => bakeryApi.get(),
    { dedupingInterval: 60_000 }
  )

  return {
    bakery: data ?? null,
    isLoading,
    error,
    update: async (name: string) => {
      await bakeryApi.update({ name })
      await mutate()
    },
    updateSettings: async (updates: { name?: string; orderCutoffHour?: number | null }) => {
      await bakeryApi.update(updates)
      await mutate()
    },
  }
}

// Users hook
export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR<User[]>(
    'users',
    () => usersApi.list(),
    { dedupingInterval: 30_000 }
  )

  return {
    users: data ?? [],
    isLoading,
    error,
    create: async (email: string, role: Role, password: string) => {
      const user = await usersApi.create(email, role, password)
      await mutate()
      return user
    },
    update: async (id: string, role: Role) => {
      await usersApi.update(id, role)
      await mutate()
    },
    remove: async (id: string) => {
      await usersApi.delete(id)
      await mutate()
    },
  }
}

// Statistics hook
export function useStatistics(from: string, to: string) {
  const { data: rangeData, isLoading: rangeLoading } = useSWR<{ date: string; orders: ComputedDayOrder[] }[]>(
    from && to ? ['statistics', from, to] : null,
    () => getOrdersForRange(from, to),
    { dedupingInterval: 60_000 }
  )
  const { products, isLoading: productsLoading } = useProducts()

  const stats = useMemo(() => {
    if (!rangeData || !products.length) return null
    return computeStats(rangeData, products)
  }, [rangeData, products])

  return { stats, isLoading: rangeLoading || productsLoading }
}

// Sections hook
export function useSections() {
  const { mutate: globalMutate } = useSWRConfig()
  const { data, isLoading, mutate } = useSWR<SectionDef[]>(
    'sections',
    () => sectionsApi.list(),
    { dedupingInterval: 30_000 }
  )

  return {
    sections: data ?? [],
    isLoading,
    mutate,
    create: async (name: string) => {
      await sectionsApi.create(name)
      await mutate()
    },
    rename: async (id: string, name: string) => {
      await sectionsApi.rename(id, name)
      await mutate()
      // The products list shows each product's section name.
      await globalMutate('products')
    },
    remove: async (id: string) => {
      await sectionsApi.delete(id)
      await mutate()
      await globalMutate('products')
    },
    reorder: async (orderedIds: string[]) => {
      await sectionsApi.reorder(orderedIds)
      await mutate()
    },
  }
}

// Production groups hook
export function useProductionGroups() {
  const { data, isLoading, mutate } = useSWR<ProductionGroup[]>(
    'production-groups',
    () => productionGroupsApi.list(),
    { dedupingInterval: 30_000 }
  )

  return {
    groups: data ?? [],
    isLoading,
    mutate,
    create: async (name: string, sectionIds: string[] = []) => {
      await productionGroupsApi.create(name, sectionIds)
      await mutate()
    },
    update: async (id: string, updates: Partial<Pick<ProductionGroup, 'name' | 'sectionIds' | 'displayMode'>>) => {
      await productionGroupsApi.update(id, updates)
      await mutate()
    },
    remove: async (id: string) => {
      await productionGroupsApi.delete(id)
      await mutate()
    },
    reorder: async (orderedIds: string[]) => {
      await productionGroupsApi.reorder(orderedIds)
      await mutate()
    },
  }
}
