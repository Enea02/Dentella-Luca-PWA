import type { Bakery, Customer, DailyOrder, Divisor, Product, RecurringOrder, SectionDef, User } from './types'

// Mock sections
export const mockSections: SectionDef[] = [
  { id: 's1', name: 'Dolci', color: 'bg-amber-100 text-amber-800', order: 0 },
  { id: 's2', name: 'Pane comune', color: 'bg-orange-100 text-orange-800', order: 1 },
  { id: 's3', name: 'Salati', color: 'bg-red-100 text-red-800', order: 2 },
  { id: 's4', name: 'Pizze farcite', color: 'bg-rose-100 text-rose-800', order: 3 },
  { id: 's5', name: 'Focacce farcite', color: 'bg-pink-100 text-pink-800', order: 4 },
  { id: 's6', name: 'Specialità', color: 'bg-emerald-100 text-emerald-800', order: 5 },
]

// Mock bakery
export const mockBakery: Bakery = {
  id: 'bakery-1',
  name: 'Panificio Da Mario',
}

// Mock user
export const mockUser: User = {
  id: 'user-1',
  email: 'owner@panificio.it',
  role: 'owner',
  bakeryId: 'bakery-1',
  bakeryName: 'Panificio Da Mario',
}

// Mock users list (all users of the bakery)
export const mockUsers: User[] = [
  mockUser,
  {
    id: 'user-2',
    email: 'mario.rossi@panificio.it',
    role: 'staff',
    bakeryId: 'bakery-1',
    bakeryName: 'Panificio Da Mario',
  },
]

// Mock products
export const mockProducts: Product[] = [
  // Dolci
  { id: 'p1', name: 'Cornetto vuoto', section: 'Dolci', unit: 'pieces' },
  { id: 'p2', name: 'Cornetto cioccolato', section: 'Dolci', unit: 'pieces' },
  { id: 'p3', name: 'Cornetto crema', section: 'Dolci', unit: 'pieces' },
  { id: 'p4', name: 'Cornetto albicocca', section: 'Dolci', unit: 'pieces' },
  { id: 'p5', name: 'Veneziana', section: 'Dolci', unit: 'pieces' },
  { id: 'p6', name: 'Bombolone', section: 'Dolci', unit: 'pieces' },
  { id: 'p7', name: 'Sfogliatella', section: 'Dolci', unit: 'pieces' },
  
  // Pane comune
  { id: 'p8', name: 'Filone', section: 'Pane comune', unit: 'pieces' },
  { id: 'p9', name: 'Pagnotta', section: 'Pane comune', unit: 'kg', piecesPerKg: 4 },
  { id: 'p10', name: 'Rosetta', section: 'Pane comune', unit: 'pieces' },
  { id: 'p11', name: 'Ciabatta', section: 'Pane comune', unit: 'pieces' },
  
  // Salati
  { id: 'p12', name: 'Pizza bianca', section: 'Salati', unit: 'pieces' },
  { id: 'p13', name: 'Pizza rossa', section: 'Salati', unit: 'pieces' },
  { id: 'p14', name: 'Focaccia semplice', section: 'Salati', unit: 'pieces' },
  { id: 'p15', name: 'Pala romana', section: 'Salati', unit: 'pieces' },
  
  // Pizze farcite
  { id: 'p16', name: 'Pizza prosciutto', section: 'Pizze farcite', unit: 'pieces' },
  { id: 'p17', name: 'Pizza tonno', section: 'Pizze farcite', unit: 'pieces' },
  { id: 'p18', name: 'Pizza vegetariana', section: 'Pizze farcite', unit: 'pieces' },
  
  // Focacce farcite
  { id: 'p19', name: 'Focaccia mortadella', section: 'Focacce farcite', unit: 'pieces' },
  { id: 'p20', name: 'Focaccia prosciutto crudo', section: 'Focacce farcite', unit: 'pieces' },
  { id: 'p21', name: 'Focaccia porchetta', section: 'Focacce farcite', unit: 'pieces' },
  
  // Specialità
  { id: 'p22', name: 'Torta della nonna', section: 'Specialità', unit: 'pieces' },
  { id: 'p23', name: 'Crostata frutta', section: 'Specialità', unit: 'pieces' },
  { id: 'p24', name: 'Tiramisù', section: 'Specialità', unit: 'kg', piecesPerKg: 8 },
]

// Mock customers
export const mockCustomers: Customer[] = [
  { id: 'c1', name: 'Bar Roma', type: 'fixed' },
  { id: 'c2', name: 'Ristorante Da Luigi', type: 'fixed' },
  { id: 'c3', name: 'Hotel Centrale', type: 'fixed' },
  { id: 'c4', name: 'Caffè Italia', type: 'fixed' },
  { id: 'c5', name: 'Cliente Giornaliero 1', type: 'single' },
  { id: 'c6', name: 'Cliente Giornaliero 2', type: 'single' },
  { id: 'c7', name: 'Pasticceria Dolce Vita', type: 'fixed' },
]

// Mock recurring orders (for fixed customers)
export const mockRecurringOrders: RecurringOrder[] = [
  {
    id: 'ro1',
    customerId: 'c1',
    weekdays: [1, 2, 3, 4, 5, 6], // Lun-Sab
    items: [
      { productId: 'p1', quantity: 10, unit: 'pieces', done: false },
      { productId: 'p2', quantity: 8, unit: 'pieces', done: false },
      { productId: 'p5', quantity: 6, unit: 'pieces', done: false },
      { productId: 'p12', quantity: 4, unit: 'pieces', done: false },
    ],
  },
  {
    id: 'ro2',
    customerId: 'c2',
    weekdays: [1, 2, 3, 4, 5, 6, 7], // Tutti i giorni
    items: [
      { productId: 'p8', quantity: 5, unit: 'pieces', done: false },
      { productId: 'p9', quantity: 2, unit: 'kg', done: false },
      { productId: 'p14', quantity: 10, unit: 'pieces', done: false },
      { productId: 'p19', quantity: 6, unit: 'pieces', done: false },
    ],
  },
  {
    id: 'ro3',
    customerId: 'c3',
    weekdays: [1, 2, 3, 4, 5], // Lun-Ven
    items: [
      { productId: 'p1', quantity: 20, unit: 'pieces', done: false },
      { productId: 'p3', quantity: 15, unit: 'pieces', done: false },
      { productId: 'p6', quantity: 12, unit: 'pieces', done: false },
      { productId: 'p22', quantity: 2, unit: 'pieces', done: false },
    ],
  },
  {
    id: 'ro4',
    customerId: 'c4',
    weekdays: [1, 2, 3, 4, 5, 6],
    items: [
      { productId: 'p1', quantity: 8, unit: 'pieces', done: false },
      { productId: 'p4', quantity: 6, unit: 'pieces', done: false },
      { productId: 'p7', quantity: 4, unit: 'pieces', done: false },
    ],
  },
  {
    id: 'ro5',
    customerId: 'c7',
    weekdays: [2, 4, 6], // Mar, Gio, Sab
    items: [
      { productId: 'p24', quantity: 1.5, unit: 'kg', done: false },
      { productId: 'p23', quantity: 3, unit: 'pieces', done: false },
    ],
  },
]

// Mock daily orders (for single customers on specific dates)
export const mockDailyOrders: DailyOrder[] = [
  {
    id: 'do1',
    date: new Date().toISOString().split('T')[0], // Today
    customerId: 'c5',
    items: [
      { productId: 'p12', quantity: 2, unit: 'pieces', done: false },
      { productId: 'p13', quantity: 2, unit: 'pieces', done: false },
    ],
  },
  {
    id: 'do2',
    date: new Date().toISOString().split('T')[0], // Today
    customerId: 'c6',
    items: [
      { productId: 'p16', quantity: 3, unit: 'pieces', done: false },
      { productId: 'p20', quantity: 2, unit: 'pieces', done: false },
    ],
  },
]

// Mock divisors (for totals calculation)
export const mockDivisors: Divisor[] = [
  { productId: 'p1', value: 6 },
  { productId: 'p2', value: 6 },
  { productId: 'p3', value: 6 },
  { productId: 'p4', value: 6 },
  { productId: 'p5', value: 4 },
  { productId: 'p6', value: 4 },
  { productId: 'p12', value: 1 },
  { productId: 'p13', value: 1 },
  { productId: 'p14', value: 1 },
]
