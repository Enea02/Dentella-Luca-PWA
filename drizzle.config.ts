import './scripts/load-env'
import { defineConfig } from 'drizzle-kit'

// DATABASE_URL is only required for commands that actually connect (push, migrate, studio).
// `generate` only reads the schema, so we leave the URL empty when missing.
export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
})
