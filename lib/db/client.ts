import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

// In Next.js dev, hot reload can create multiple connections — cache the client on globalThis.
const globalForDb = globalThis as unknown as { _pg?: ReturnType<typeof postgres> }

const client =
  globalForDb._pg ??
  postgres(connectionString, {
    max: 10,
    prepare: false,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb._pg = client
}

export const db = drizzle(client, { schema })
export const sql = client
export { schema }
