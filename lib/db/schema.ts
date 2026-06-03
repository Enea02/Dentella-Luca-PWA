import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  numeric,
  date,
  timestamp,
  primaryKey,
  unique,
  index,
  pgEnum,
  smallint,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// ---------- Enums ----------
export const roleEnum = pgEnum('role', ['admin', 'owner', 'staff'])
export const unitEnum = pgEnum('unit', ['pieces', 'kg'])
export const customerTypeEnum = pgEnum('customer_type', ['fixed', 'single'])
export const displayModeEnum = pgEnum('display_mode', ['by-article', 'by-section'])

// ---------- Bakeries ----------
export const bakeries = pgTable('bakeries', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ---------- Users ----------
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bakeryId: uuid('bakery_id')
      .notNull()
      .references(() => bakeries.id, { onDelete: 'cascade' }),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: roleEnum('role').notNull().default('staff'),
    name: text('name'),
    mustChangePassword: boolean('must_change_password').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('users_bakery_idx').on(t.bakeryId)],
)

// ---------- Sections ----------
export const sections = pgTable(
  'sections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bakeryId: uuid('bakery_id')
      .notNull()
      .references(() => bakeries.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').notNull(),
    order: integer('order').notNull().default(0),
  },
  (t) => [
    unique('sections_bakery_name_key').on(t.bakeryId, t.name),
    index('sections_bakery_idx').on(t.bakeryId),
  ],
)

// ---------- Products ----------
export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bakeryId: uuid('bakery_id')
      .notNull()
      .references(() => bakeries.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'restrict' }),
    unit: unitEnum('unit').notNull().default('pieces'),
    piecesPerKg: integer('pieces_per_kg'),
  },
  (t) => [index('products_bakery_idx').on(t.bakeryId), index('products_section_idx').on(t.sectionId)],
)

// ---------- Customers ----------
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bakeryId: uuid('bakery_id')
      .notNull()
      .references(() => bakeries.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: customerTypeEnum('type').notNull().default('single'),
  },
  (t) => [index('customers_bakery_idx').on(t.bakeryId)],
)

// ---------- Recurring orders (template for fixed customers) ----------
export const recurringOrders = pgTable(
  'recurring_orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bakeryId: uuid('bakery_id')
      .notNull()
      .references(() => bakeries.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .unique()
      .references(() => customers.id, { onDelete: 'cascade' }),
    // weekdays stored as text[] of '1'..'7' for simplicity
    weekdays: smallint('weekdays').array().notNull().default(sql`'{}'::smallint[]`),
  },
  (t) => [index('recurring_orders_bakery_idx').on(t.bakeryId)],
)

export const recurringOrderItems = pgTable(
  'recurring_order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    recurringOrderId: uuid('recurring_order_id')
      .notNull()
      .references(() => recurringOrders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
    unit: unitEnum('unit').notNull(),
  },
  (t) => [index('recurring_items_order_idx').on(t.recurringOrderId)],
)

// ---------- Daily orders (per-date) ----------
export const dailyOrders = pgTable(
  'daily_orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bakeryId: uuid('bakery_id')
      .notNull()
      .references(() => bakeries.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
  },
  (t) => [
    unique('daily_orders_unique').on(t.bakeryId, t.date, t.customerId),
    index('daily_orders_date_idx').on(t.bakeryId, t.date),
  ],
)

export const dailyOrderItems = pgTable(
  'daily_order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    dailyOrderId: uuid('daily_order_id')
      .notNull()
      .references(() => dailyOrders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
    unit: unitEnum('unit').notNull(),
    done: boolean('done').notNull().default(false),
    variant: text('variant'),
  },
  (t) => [index('daily_items_order_idx').on(t.dailyOrderId)],
)

// Per-date overrides for recurring items (done state + variant), keyed by
// (bakery, date, customer, product). Lets us mark a recurring item "done"
// on a single day without mutating the recurring template.
export const dailyItemStatus = pgTable(
  'daily_item_status',
  {
    bakeryId: uuid('bakery_id')
      .notNull()
      .references(() => bakeries.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    done: boolean('done').notNull().default(false),
    variant: text('variant'),
  },
  (t) => [
    primaryKey({ columns: [t.bakeryId, t.date, t.customerId, t.productId] }),
    index('daily_item_status_date_idx').on(t.bakeryId, t.date),
  ],
)

// ---------- Divisors ----------
export const divisors = pgTable(
  'divisors',
  {
    bakeryId: uuid('bakery_id')
      .notNull()
      .references(() => bakeries.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    value: integer('value').notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.bakeryId, t.productId] })],
)

// ---------- Production groups ----------
export const productionGroups = pgTable(
  'production_groups',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bakeryId: uuid('bakery_id')
      .notNull()
      .references(() => bakeries.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    order: integer('order').notNull().default(0),
    displayMode: displayModeEnum('display_mode').default('by-article'),
  },
  (t) => [index('production_groups_bakery_idx').on(t.bakeryId)],
)

export const productionGroupSections = pgTable(
  'production_group_sections',
  {
    groupId: uuid('group_id')
      .notNull()
      .references(() => productionGroups.id, { onDelete: 'cascade' }),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.sectionId] })],
)

// ---------- Permission overrides ----------
// Override base permissions for a role within a bakery
export const rolePermissionOverrides = pgTable(
  'role_permission_overrides',
  {
    bakeryId: uuid('bakery_id')
      .notNull()
      .references(() => bakeries.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull(),
    permission: text('permission').notNull(),
    allowed: boolean('allowed').notNull(),
  },
  (t) => [primaryKey({ columns: [t.bakeryId, t.role, t.permission] })],
)

// Override permissions for a single user (most specific)
export const userPermissionOverrides = pgTable(
  'user_permission_overrides',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    permission: text('permission').notNull(),
    allowed: boolean('allowed').notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.permission] })],
)

// ---------- Relations ----------
export const bakeriesRelations = relations(bakeries, ({ many }) => ({
  users: many(users),
  sections: many(sections),
  products: many(products),
  customers: many(customers),
}))

export const usersRelations = relations(users, ({ one }) => ({
  bakery: one(bakeries, { fields: [users.bakeryId], references: [bakeries.id] }),
}))

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  bakery: one(bakeries, { fields: [sections.bakeryId], references: [bakeries.id] }),
  products: many(products),
}))

export const productsRelations = relations(products, ({ one }) => ({
  bakery: one(bakeries, { fields: [products.bakeryId], references: [bakeries.id] }),
  section: one(sections, { fields: [products.sectionId], references: [sections.id] }),
}))

export const customersRelations = relations(customers, ({ one, many }) => ({
  bakery: one(bakeries, { fields: [customers.bakeryId], references: [bakeries.id] }),
  recurringOrder: many(recurringOrders),
  dailyOrders: many(dailyOrders),
}))

export const recurringOrdersRelations = relations(recurringOrders, ({ one, many }) => ({
  customer: one(customers, { fields: [recurringOrders.customerId], references: [customers.id] }),
  items: many(recurringOrderItems),
}))

export const recurringOrderItemsRelations = relations(recurringOrderItems, ({ one }) => ({
  recurringOrder: one(recurringOrders, {
    fields: [recurringOrderItems.recurringOrderId],
    references: [recurringOrders.id],
  }),
  product: one(products, { fields: [recurringOrderItems.productId], references: [products.id] }),
}))

export const dailyOrdersRelations = relations(dailyOrders, ({ one, many }) => ({
  customer: one(customers, { fields: [dailyOrders.customerId], references: [customers.id] }),
  items: many(dailyOrderItems),
}))

export const dailyOrderItemsRelations = relations(dailyOrderItems, ({ one }) => ({
  dailyOrder: one(dailyOrders, { fields: [dailyOrderItems.dailyOrderId], references: [dailyOrders.id] }),
  product: one(products, { fields: [dailyOrderItems.productId], references: [products.id] }),
}))

export const productionGroupsRelations = relations(productionGroups, ({ one, many }) => ({
  bakery: one(bakeries, { fields: [productionGroups.bakeryId], references: [bakeries.id] }),
  sections: many(productionGroupSections),
}))

export const productionGroupSectionsRelations = relations(productionGroupSections, ({ one }) => ({
  group: one(productionGroups, {
    fields: [productionGroupSections.groupId],
    references: [productionGroups.id],
  }),
  section: one(sections, {
    fields: [productionGroupSections.sectionId],
    references: [sections.id],
  }),
}))
