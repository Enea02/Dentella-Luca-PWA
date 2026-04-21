// Role types
export type Role = "owner" | "staff";
export type Unit = "pieces" | "kg";
export type CustomerType = "fixed" | "single";
export type CustomerStatus = "pending" | "partial" | "done";

// Weekday (1 = Monday, 7 = Sunday)
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Product sections
export type ProductSection = 
  | "Dolci"
  | "Pane comune"
  | "Salati"
  | "Pizze farcite"
  | "Focacce farcite"
  | "Specialità";

// Core entities
export interface Product {
  id: string;
  name: string;
  section: ProductSection;
  unit: Unit;
  piecesPerKg?: number; // Only for kg products
}

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unit: Unit;
  done: boolean;
}

export interface RecurringOrder {
  id: string;
  customerId: string;
  weekdays: Weekday[];
  items: OrderItem[];
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

// User/Auth
export interface User {
  id: string;
  email: string;
  role: Role;
  bakeryId: string;
  bakeryName: string;
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
