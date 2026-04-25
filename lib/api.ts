import type { ComputedDayOrder, Customer, Divisor, OrderItem, Product, User } from './types'
import { mockCustomers, mockDailyOrders, mockDivisors, mockProducts, mockRecurringOrders, mockUser } from './mockData'
import { clone, dayOfWeek, getOrderStatus } from './utils'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

// Generic fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`/api${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Request failed')
  }

  return res.json()
}

// Auth API
export const authApi = {
  async me(): Promise<User> {
    if (USE_MOCK) {
      return clone(mockUser)
    }
    return fetchApi<User>('/auth/me')
  },

  async login(email: string, password: string): Promise<User> {
    if (USE_MOCK) {
      // Simulate login delay
      await new Promise(r => setTimeout(r, 500))
      if (email && password) {
        return clone(mockUser)
      }
      throw new Error('Invalid credentials')
    }
    return fetchApi<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  async logout(): Promise<void> {
    if (USE_MOCK) {
      return
    }
    await fetchApi('/auth/logout', { method: 'POST' })
  },
}

// Products API
export const productsApi = {
  async list(): Promise<Product[]> {
    if (USE_MOCK) {
      return clone(mockProducts)
    }
    return fetchApi<Product[]>('/products')
  },

  async create(product: Omit<Product, 'id'>): Promise<Product> {
    if (USE_MOCK) {
      const newProduct = { ...product, id: `p${Date.now()}` }
      mockProducts.push(newProduct)
      return clone(newProduct)
    }
    return fetchApi<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    })
  },

  async update(id: string, product: Partial<Product>): Promise<Product> {
    if (USE_MOCK) {
      const index = mockProducts.findIndex(p => p.id === id)
      if (index !== -1) {
        mockProducts[index] = { ...mockProducts[index], ...product }
        return clone(mockProducts[index])
      }
      throw new Error('Product not found')
    }
    return fetchApi<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(product),
    })
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      const index = mockProducts.findIndex(p => p.id === id)
      if (index !== -1) {
        mockProducts.splice(index, 1)
      }
      return
    }
    await fetchApi(`/products/${id}`, { method: 'DELETE' })
  },
}

// Customers API
export const customersApi = {
  async list(): Promise<Customer[]> {
    if (USE_MOCK) {
      return clone(mockCustomers)
    }
    return fetchApi<Customer[]>('/customers')
  },

  async create(customer: Omit<Customer, 'id'>): Promise<Customer> {
    if (USE_MOCK) {
      const newCustomer = { ...customer, id: `c${Date.now()}` }
      mockCustomers.push(newCustomer)
      return clone(newCustomer)
    }
    return fetchApi<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    })
  },

  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    if (USE_MOCK) {
      const index = mockCustomers.findIndex(c => c.id === id)
      if (index !== -1) {
        mockCustomers[index] = { ...mockCustomers[index], ...customer }
        return clone(mockCustomers[index])
      }
      throw new Error('Customer not found')
    }
    return fetchApi<Customer>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(customer),
    })
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      const index = mockCustomers.findIndex(c => c.id === id)
      if (index !== -1) {
        mockCustomers.splice(index, 1)
      }
      return
    }
    await fetchApi(`/customers/${id}`, { method: 'DELETE' })
  },
}

// Orders API
export const ordersApi = {
  async getForDate(date: string): Promise<ComputedDayOrder[]> {
    if (USE_MOCK) {
      const weekday = dayOfWeek(date)
      const orderMap = new Map<string, ComputedDayOrder>()

      // Add recurring orders first
      for (const recurring of mockRecurringOrders) {
        if (recurring.weekdays.includes(weekday)) {
          const customer = mockCustomers.find(c => c.id === recurring.customerId)
          if (customer) {
            orderMap.set(recurring.customerId, {
              customerId: recurring.customerId,
              customerName: customer.name,
              customerType: customer.type,
              items: clone(recurring.items),
              status: getOrderStatus(recurring.items),
            })
          }
        }
      }

      // Daily orders override recurring for the same customer
      for (const daily of mockDailyOrders) {
        if (daily.date === date) {
          const customer = mockCustomers.find(c => c.id === daily.customerId)
          if (customer) {
            const hadRecurring = orderMap.has(daily.customerId)
            orderMap.set(daily.customerId, {
              customerId: daily.customerId,
              customerName: customer.name,
              customerType: hadRecurring ? customer.type : 'single',
              items: clone(daily.items),
              status: getOrderStatus(daily.items),
            })
          }
        }
      }

      return Array.from(orderMap.values())
    }
    return fetchApi<ComputedDayOrder[]>(`/orders?date=${date}`)
  },

  async toggleItem(date: string, customerId: string, productId: string, done: boolean): Promise<void> {
    if (USE_MOCK) {
      // Find and update in recurring orders
      for (const recurring of mockRecurringOrders) {
        if (recurring.customerId === customerId) {
          const item = recurring.items.find(i => i.productId === productId)
          if (item) {
            item.done = done
            return
          }
        }
      }
      // Find and update in daily orders
      for (const daily of mockDailyOrders) {
        if (daily.date === date && daily.customerId === customerId) {
          const item = daily.items.find(i => i.productId === productId)
          if (item) {
            item.done = done
            return
          }
        }
      }
      return
    }
    await fetchApi(`/orders/toggle`, {
      method: 'POST',
      body: JSON.stringify({ date, customerId, productId, done }),
    })
  },
}

export function getCustomerRecurringOrder(customerId: string): import('./types').RecurringOrder | null {
  return mockRecurringOrders.find(r => r.customerId === customerId) ?? null
}

export async function upsertRecurringOrder(
  customerId: string,
  weekdays: import('./types').Weekday[],
  items: OrderItem[]
): Promise<void> {
  if (USE_MOCK) {
    const index = mockRecurringOrders.findIndex(r => r.customerId === customerId)
    if (index !== -1) {
      mockRecurringOrders[index] = { ...mockRecurringOrders[index], weekdays, items }
    } else {
      mockRecurringOrders.push({ id: `ro${Date.now()}`, customerId, weekdays, items })
    }
    return
  }
  await fetchApi(`/orders/recurring/${customerId}`, {
    method: 'PUT',
    body: JSON.stringify({ weekdays, items }),
  })
}

export async function createDailyOrder(date: string, customerId: string, items: OrderItem[]): Promise<void> {
  if (USE_MOCK) {
    mockDailyOrders.push({ id: `do${Date.now()}`, date, customerId, items })
    return
  }
  await fetchApi('/orders/daily', {
    method: 'POST',
    body: JSON.stringify({ date, customerId, items }),
  })
}

export async function addOrderItem(date: string, customerId: string, item: OrderItem): Promise<void> {
  if (USE_MOCK) {
    const existing = mockDailyOrders.find(d => d.date === date && d.customerId === customerId)
    if (existing) {
      existing.items.push(item)
      return
    }
    // Customer has only a recurring order: create a daily override with recurring items + new item
    const weekday = dayOfWeek(date)
    const recurring = mockRecurringOrders.find(r => r.customerId === customerId && r.weekdays.includes(weekday))
    const baseItems = recurring ? clone(recurring.items) : []
    mockDailyOrders.push({ id: `do${Date.now()}`, date, customerId, items: [...baseItems, item] })
    return
  }
  await fetchApi('/orders/items', {
    method: 'POST',
    body: JSON.stringify({ date, customerId, item }),
  })
}

// Divisors API
export const divisorsApi = {
  async list(): Promise<Divisor[]> {
    if (USE_MOCK) {
      return clone(mockDivisors)
    }
    return fetchApi<Divisor[]>('/divisors')
  },

  async update(productId: string, value: number): Promise<Divisor> {
    if (USE_MOCK) {
      const index = mockDivisors.findIndex(d => d.productId === productId)
      if (index !== -1) {
        mockDivisors[index].value = value
      } else {
        mockDivisors.push({ productId, value })
      }
      return { productId, value }
    }
    return fetchApi<Divisor>(`/divisors/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    })
  },
}
