import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { CustomerStatus, OrderItem, Product, Weekday } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Deep clone via JSON
export function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// Get weekday from ISO date (1 = Monday, 7 = Sunday)
export function dayOfWeek(isoDate: string): Weekday {
  const date = new Date(isoDate)
  const day = date.getDay()
  return (day === 0 ? 7 : day) as Weekday
}

// Format date as Italian locale
export function formatDateIT(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

// Get today's date in ISO format
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// Group products by section
export function groupProductsBySection(products: Product[]): Record<string, Product[]> {
  return products.reduce((acc, product) => {
    if (!acc[product.section]) {
      acc[product.section] = []
    }
    acc[product.section].push(product)
    return acc
  }, {} as Record<string, Product[]>)
}

// Convert quantity to pieces
export function toPieces(quantity: number, unit: string, piecesPerKg?: number): number {
  if (unit === 'kg' && piecesPerKg) {
    return Math.round(quantity * piecesPerKg)
  }
  return quantity
}

// Calculate customer order status
export function getOrderStatus(items: OrderItem[]): CustomerStatus {
  if (items.length === 0) return 'pending'
  const doneCount = items.filter(item => item.done).length
  if (doneCount === 0) return 'pending'
  if (doneCount === items.length) return 'done'
  return 'partial'
}

// Sort customers by status (pending first, then partial, then done)
export function sortByStatus<T extends { status: CustomerStatus; customerName: string }>(items: T[]): T[] {
  const order: Record<CustomerStatus, number> = { pending: 0, partial: 1, done: 2 }
  return [...items].sort((a, b) => {
    const diff = order[a.status] - order[b.status]
    return diff !== 0 ? diff : a.customerName.localeCompare(b.customerName)
  })
}

// Generate a simple ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}
