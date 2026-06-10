import type {
  Bakery,
  ComputedDayOrder,
  Customer,
  Divisor,
  OrderItem,
  Product,
  ProductionGroup,
  RecurringOrder,
  SectionDef,
  User,
  Weekday,
  Role,
} from './types'

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  const res = await fetch(`/api${endpoint}`, {
    ...options,
    // SWR (in-memory + localStorage) is our cache layer. Always hit the network
    // for the SPA's own requests, otherwise the reference-data Cache-Control
    // headers serve a stale list after an in-app edit (e.g. toggling a customer
    // active/suspended) for up to 60s.
    cache: 'no-store',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }

  if (res.status === 204) return null
  return res.json() as Promise<T>
}

async function fetchRequired<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const data = await fetchApi<T>(endpoint, options)
  if (data === null) throw new Error('Unexpected empty response')
  return data
}

// ---- Products ----
export const productsApi = {
  list: () => fetchRequired<Product[]>('/products'),
  create: (product: Omit<Product, 'id'>) =>
    fetchRequired<Product>('/products', { method: 'POST', body: JSON.stringify(product) }),
  update: (id: string, product: Partial<Product>) =>
    fetchRequired<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(product) }),
  delete: (id: string) => fetchApi<void>(`/products/${id}`, { method: 'DELETE' }).then(() => undefined),
}

// ---- Customers ----
export const customersApi = {
  list: () => fetchRequired<Customer[]>('/customers'),
  create: (customer: Omit<Customer, 'id' | 'active'>) =>
    fetchRequired<Customer>('/customers', { method: 'POST', body: JSON.stringify(customer) }),
  update: (id: string, customer: Partial<Customer>) =>
    fetchRequired<Customer>(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(customer) }),
  delete: (id: string) => fetchApi<void>(`/customers/${id}`, { method: 'DELETE' }).then(() => undefined),
}

// ---- Orders ----
export const ordersApi = {
  getForDate: (date: string) => fetchRequired<ComputedDayOrder[]>(`/orders?date=${date}`),
  toggleItem: (date: string, customerId: string, productId: string, done: boolean) =>
    fetchApi<void>('/orders/toggle', {
      method: 'POST',
      body: JSON.stringify({ date, customerId, productId, done }),
    }).then(() => undefined),
  updateItem: (date: string, customerId: string, productId: string, updates: Partial<OrderItem>) =>
    fetchApi<void>('/orders/items', {
      method: 'PATCH',
      body: JSON.stringify({ date, customerId, productId, updates }),
    }).then(() => undefined),
  removeItem: (date: string, customerId: string, productId: string) =>
    fetchApi<void>('/orders/items', {
      method: 'DELETE',
      body: JSON.stringify({ date, customerId, productId }),
    }).then(() => undefined),
  reorderItems: (date: string, customerId: string, orderedProductIds: string[]) =>
    fetchApi<void>('/orders/reorder', {
      method: 'POST',
      body: JSON.stringify({ date, customerId, orderedProductIds }),
    }).then(() => undefined),
}

export async function getCustomerRecurringOrder(customerId: string): Promise<RecurringOrder | null> {
  return fetchApi<RecurringOrder | null>(`/orders/recurring/${customerId}`)
}

export async function upsertRecurringOrder(
  customerId: string,
  weekdays: Weekday[],
  items: OrderItem[],
): Promise<void> {
  await fetchApi(`/orders/recurring/${customerId}`, {
    method: 'PUT',
    body: JSON.stringify({
      weekdays,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, unit: i.unit })),
    }),
  })
}

export async function createDailyOrder(
  date: string,
  customerId: string,
  items: OrderItem[],
): Promise<void> {
  await fetchApi('/orders/daily', {
    method: 'POST',
    body: JSON.stringify({ date, customerId, items }),
  })
}

export async function addOrderItem(date: string, customerId: string, item: OrderItem): Promise<void> {
  await fetchApi('/orders/items', {
    method: 'POST',
    body: JSON.stringify({ date, customerId, item }),
  })
}

// ---- Bakery ----
export const bakeryApi = {
  get: () => fetchRequired<Bakery>('/bakery'),
  update: (updates: { name?: string; orderCutoffHour?: number | null }) =>
    fetchRequired<Bakery>('/bakery', { method: 'PATCH', body: JSON.stringify(updates) }),
}

// ---- Users ----
export const usersApi = {
  list: () => fetchRequired<User[]>('/users'),
  create: (email: string, role: Role, password: string) =>
    fetchRequired<User>('/users', { method: 'POST', body: JSON.stringify({ email, role, password }) }),
  update: (id: string, role: Role) =>
    fetchRequired<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  delete: (id: string) => fetchApi<void>(`/users/${id}`, { method: 'DELETE' }).then(() => undefined),
}

// ---- Divisors ----
export const divisorsApi = {
  list: () => fetchRequired<Divisor[]>('/divisors'),
  update: (productId: string, value: number) =>
    fetchRequired<Divisor>(`/divisors/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    }),
}

// ---- Statistics (date range, batched server-side) ----
// Single request to the batch endpoint — the server assembles every date in
// the range with a handful of queries instead of one request per day.
export async function getOrdersForRange(
  from: string,
  to: string,
): Promise<{ date: string; orders: ComputedDayOrder[] }[]> {
  return fetchRequired<{ date: string; orders: ComputedDayOrder[] }[]>(
    `/orders/range?from=${from}&to=${to}`,
  )
}

// ---- Sections ----
export const sectionsApi = {
  list: () => fetchRequired<SectionDef[]>('/sections'),
  create: (name: string) =>
    fetchRequired<SectionDef>('/sections', { method: 'POST', body: JSON.stringify({ name }) }),
  rename: (id: string, name: string) =>
    fetchRequired<SectionDef>(`/sections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
  delete: (id: string) => fetchApi<void>(`/sections/${id}`, { method: 'DELETE' }).then(() => undefined),
  reorder: (orderedIds: string[]) =>
    fetchApi<void>('/sections/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    }).then(() => undefined),
}

// ---- Production groups ----
export const productionGroupsApi = {
  list: () => fetchRequired<ProductionGroup[]>('/production-groups'),
  create: (name: string, sectionIds: string[] = []) =>
    fetchRequired<ProductionGroup>('/production-groups', {
      method: 'POST',
      body: JSON.stringify({ name, sectionIds }),
    }),
  update: (
    id: string,
    updates: Partial<Pick<ProductionGroup, 'name' | 'sectionIds' | 'displayMode'>>,
  ) =>
    fetchRequired<ProductionGroup>(`/production-groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  delete: (id: string) =>
    fetchApi<void>(`/production-groups/${id}`, { method: 'DELETE' }).then(() => undefined),
  reorder: (orderedIds: string[]) =>
    fetchApi<void>('/production-groups/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    }).then(() => undefined),
}
