'use client'

import useSWR from 'swr'
import { productsApi, customersApi, ordersApi, divisorsApi, createDailyOrder, addOrderItem } from '@/lib/api'
import type { ComputedDayOrder, Customer, Divisor, OrderItem, Product } from '@/lib/types'

// Products hook
export function useProducts() {
  const { data, error, isLoading, mutate } = useSWR<Product[]>(
    'products',
    () => productsApi.list(),
    { revalidateOnFocus: false }
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
  const { data, error, isLoading, mutate } = useSWR<Customer[]>(
    'customers',
    () => customersApi.list(),
    { revalidateOnFocus: false }
  )

  return {
    customers: data ?? [],
    isLoading,
    error,
    mutate,
    create: async (customer: Omit<Customer, 'id'>) => {
      const newCustomer = await customersApi.create(customer)
      await mutate()
      return newCustomer
    },
    update: async (id: string, updates: Partial<Customer>) => {
      const updated = await customersApi.update(id, updates)
      await mutate()
      return updated
    },
    remove: async (id: string) => {
      await customersApi.delete(id)
      await mutate()
    },
  }
}

// Orders hook (for a specific date)
export function useOrders(date: string) {
  const { data, error, isLoading, mutate } = useSWR<ComputedDayOrder[]>(
    date ? ['orders', date] : null,
    () => ordersApi.getForDate(date),
    { revalidateOnFocus: false }
  )

  return {
    orders: data ?? [],
    isLoading,
    error,
    mutate,
    createOrder: async (customerId: string, items: OrderItem[]) => {
      await createDailyOrder(date, customerId, items)
      await mutate()
    },
    addItem: async (customerId: string, item: OrderItem) => {
      await addOrderItem(date, customerId, item)
      await mutate()
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
    },
  }
}

// Divisors hook
export function useDivisors() {
  const { data, error, isLoading, mutate } = useSWR<Divisor[]>(
    'divisors',
    () => divisorsApi.list(),
    { revalidateOnFocus: false }
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
