// Role types
export type Role = "admin" | "owner" | "staff";
export type Unit = "pieces" | "kg";
export type CustomerType = "fixed" | "single";
export type CustomerStatus = "pending" | "partial" | "done";

// Weekday (1 = Monday, 7 = Sunday)
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Product sections — string to allow dynamic creation
export type ProductSection = string;

export interface SectionDef {
  id: string;
  name: string;
  color: string; // Tailwind badge classes
  order: number;
}

// Production group: a user-defined collection of sections rendered as one production table
export interface ProductionGroup {
  id: string;
  name: string;
  sectionIds: string[];
  order: number;
  displayMode?: 'by-article' | 'by-section';
}

// Section name that triggers the per-customer pizza variant input/display
export const PIZZA_VARIANT_SECTION = "Pizze farcite";

// Core entities
export interface Product {
  id: string;
  name: string;
  section: ProductSection;
  unit: Unit;
  piecesPerKg?: number; // Only for kg products
  additionsWatch?: boolean; // Shown in the Totals "Aggiunte" board when true
}

// One product's baseline for a day (recurring template total, in pieces)
export interface RecurringBaseTotal {
  productId: string;
  pieces: number;
}

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  active: boolean;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unit: Unit;
  done: boolean;
  variant?: string; // Free-text variant (used only for Pizze farcite items)
}

export interface RecurringBaseItem {
  productId: string;
  quantity: number;
  unit: Unit;
}

export interface RecurringOverrideItem extends RecurringBaseItem {
  removed: boolean;
}

export interface RecurringOrder {
  id: string;
  customerId: string;
  weekdays: Weekday[];
  // Base template (applies to every weekday the customer is present).
  base: RecurringBaseItem[];
  // Per-weekday variations, keyed by weekday (1..7). A `removed` item drops a base
  // product for that day; a non-base product adds one.
  overrides: Record<number, RecurringOverrideItem[]>;
}

export interface DailyOrder {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  customerId: string;
  items: OrderItem[];
}

export interface DailyOverride {
  id: string;
  date: string;
  customerId: string;
  items: OrderItem[];
}

// Computed order for a specific day (merged recurring + override)
export interface ComputedDayOrder {
  customerId: string;
  customerName: string;
  customerType: CustomerType;
  items: OrderItem[];
  status: CustomerStatus;
}

// Divisors for totals
export interface Divisor {
  productId: string;
  value: number;
}

// Bakery
export interface Bakery {
  id: string;
  name: string;
  orderCutoffHour: number | null;
}

// User/Auth
export interface User {
  id: string;
  email: string;
  role: Role;
  bakeryId: string;
  bakeryName: string;
  permissions?: Record<string, boolean>;
  mustChangePassword?: boolean;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Production cell
export interface ProductionCell {
  customerId: string;
  productId: string;
  quantity: number;
  done: boolean;
}

// Totals per product
export interface ProductTotal {
  productId: string;
  productName: string;
  section: ProductSection;
  totalPieces: number;
  divisor: number;
  result: number;
}
