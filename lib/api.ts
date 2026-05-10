import type { Bakery, ComputedDayOrder, Customer, Divisor, OrderItem, Product, ProductionGroup, SectionDef, User } from './types'
import { mockBakery, mockCustomers, mockDailyOrders, mockDivisors, mockProductionGroups, mockProducts, mockRecurringOrders, mockSections, mockUser, mockUsers } from './mockData'
import { clone, dayOfWeek, getOrderStatus } from './utils'
import { SECTION_COLOR_PALETTE } from './constants'

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
        const matched = mockUsers.find(u => u.email === email)
        return clone(matched ?? mockUser)
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

  async updateItem(
    date: string,
    customerId: string,
    productId: string,
    updates: Partial<OrderItem>
  ): Promise<void> {
    if (USE_MOCK) {
      for (const recurring of mockRecurringOrders) {
        if (recurring.customerId === customerId) {
          const item = recurring.items.find(i => i.productId === productId)
          if (item) {
            Object.assign(item, updates)
            return
          }
        }
      }
      for (const daily of mockDailyOrders) {
        if (daily.date === date && daily.customerId === customerId) {
          const item = daily.items.find(i => i.productId === productId)
          if (item) {
            Object.assign(item, updates)
            return
          }
        }
      }
      return
    }
    await fetchApi(`/orders/items`, {
      method: 'PATCH',
      body: JSON.stringify({ date, customerId, productId, updates }),
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

// Bakery API
export const bakeryApi = {
  async get(): Promise<Bakery> {
    if (USE_MOCK) return clone(mockBakery)
    return fetchApi<Bakery>('/bakery')
  },

  async update(name: string): Promise<Bakery> {
    if (USE_MOCK) {
      mockBakery.name = name
      return clone(mockBakery)
    }
    return fetchApi<Bakery>('/bakery', { method: 'PATCH', body: JSON.stringify({ name }) })
  },
}

// Users API
export const usersApi = {
  async list(): Promise<User[]> {
    if (USE_MOCK) return clone(mockUsers)
    return fetchApi<User[]>('/users')
  },

  async create(email: string, role: import('./types').Role): Promise<User> {
    if (USE_MOCK) {
      const newUser: User = {
        id: `user-${Date.now()}`,
        email,
        role,
        bakeryId: mockBakery.id,
        bakeryName: mockBakery.name,
      }
      mockUsers.push(newUser)
      return clone(newUser)
    }
    return fetchApi<User>('/users', { method: 'POST', body: JSON.stringify({ email, role }) })
  },

  async update(id: string, role: import('./types').Role): Promise<User> {
    if (USE_MOCK) {
      const user = mockUsers.find(u => u.id === id)
      if (user) user.role = role
      return clone(user!)
    }
    return fetchApi<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) })
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      const index = mockUsers.findIndex(u => u.id === id)
      if (index !== -1) mockUsers.splice(index, 1)
      return
    }
    await fetchApi(`/users/${id}`, { method: 'DELETE' })
  },
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

// Statistics API
function datesInRange(from: string, to: string): string[] {
  const dates: string[] = []
  const cur = new Date(from + 'T00:00:00')
  const end = new Date(to + 'T00:00:00')
  while (cur <= end) {
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, '0')
    const d = String(cur.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export async function getOrdersForDateRange(
  from: string,
  to: string
): Promise<{ date: string; orders: ComputedDayOrder[] }[]> {
  const dates = datesInRange(from, to).slice(0, 90)
  const results = await Promise.all(dates.map(d => ordersApi.getForDate(d)))
  return dates.map((d, i) => ({ date: d, orders: results[i] }))
}

// Sections API
export const sectionsApi = {
  async list(): Promise<SectionDef[]> {
    if (USE_MOCK) return clone(mockSections).sort((a, b) => a.order - b.order)
    return fetchApi<SectionDef[]>('/sections')
  },

  async create(name: string): Promise<SectionDef> {
    if (USE_MOCK) {
      const usedColors = mockSections.map(s => s.color)
      const color = SECTION_COLOR_PALETTE.find(c => !usedColors.includes(c)) ?? SECTION_COLOR_PALETTE[mockSections.length % SECTION_COLOR_PALETTE.length]
      const newSection: SectionDef = {
        id: `s${Date.now()}`,
        name,
        color,
        order: mockSections.length,
      }
      mockSections.push(newSection)
      return clone(newSection)
    }
    return fetchApi<SectionDef>('/sections', { method: 'POST', body: JSON.stringify({ name }) })
  },

  async rename(id: string, name: string): Promise<SectionDef> {
    if (USE_MOCK) {
      const idx = mockSections.findIndex(s => s.id === id)
      if (idx === -1) throw new Error('Section not found')
      const oldName = mockSections[idx].name
      mockSections[idx] = { ...mockSections[idx], name }
      // Rename section on all products
      mockProducts.forEach(p => { if (p.section === oldName) p.section = name })
      return clone(mockSections[idx])
    }
    return fetchApi<SectionDef>(`/sections/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) })
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      const idx = mockSections.findIndex(s => s.id === id)
      if (idx !== -1) mockSections.splice(idx, 1)
      return
    }
    await fetchApi(`/sections/${id}`, { method: 'DELETE' })
  },

  async reorder(orderedIds: string[]): Promise<void> {
    if (USE_MOCK) {
      orderedIds.forEach((id, order) => {
        const s = mockSections.find(s => s.id === id)
        if (s) s.order = order
      })
      return
    }
    await fetchApi('/sections/reorder', { method: 'POST', body: JSON.stringify({ orderedIds }) })
  },
}

// Production groups API
export const productionGroupsApi = {
  async list(): Promise<ProductionGroup[]> {
    if (USE_MOCK) return clone(mockProductionGroups).sort((a, b) => a.order - b.order)
    return fetchApi<ProductionGroup[]>('/production-groups')
  },

  async create(name: string, sectionIds: string[] = []): Promise<ProductionGroup> {
    if (USE_MOCK) {
      const newGroup: ProductionGroup = {
        id: `pg${Date.now()}`,
        name,
        sectionIds,
        order: mockProductionGroups.length,
      }
      mockProductionGroups.push(newGroup)
      return clone(newGroup)
    }
    return fetchApi<ProductionGroup>('/production-groups', {
      method: 'POST',
      body: JSON.stringify({ name, sectionIds }),
    })
  },

  async update(id: string, updates: Partial<Pick<ProductionGroup, 'name' | 'sectionIds'>>): Promise<ProductionGroup> {
    if (USE_MOCK) {
      const idx = mockProductionGroups.findIndex(g => g.id === id)
      if (idx === -1) throw new Error('Production group not found')
      mockProductionGroups[idx] = { ...mockProductionGroups[idx], ...updates }
      return clone(mockProductionGroups[idx])
    }
    return fetchApi<ProductionGroup>(`/production-groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      const idx = mockProductionGroups.findIndex(g => g.id === id)
      if (idx !== -1) mockProductionGroups.splice(idx, 1)
      return
    }
    await fetchApi(`/production-groups/${id}`, { method: 'DELETE' })
  },

  async reorder(orderedIds: string[]): Promise<void> {
    if (USE_MOCK) {
      orderedIds.forEach((id, order) => {
        const g = mockProductionGroups.find(g => g.id === id)
        if (g) g.order = order
      })
      return
    }
    await fetchApi('/production-groups/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    })
  },
}
