import './load-env'
import postgres from 'postgres'

/**
 * One-off, IDEMPOTENT migration for the 0004 changes, for DBs provisioned with
 * `db:push` (where drizzle's migration tracking is empty and `db:migrate` can't run).
 *
 * Applies exactly:
 *   - products.additions_watch            (A1 — Totals "Aggiunte" star)
 *   - recurring_order_items.weekday/removed (D1 — per-weekday template)
 *   - dedup of daily_order_items + unique (dailyOrderId, productId)  (F1)
 *
 * Safe to run multiple times. See docs/development-plan.md.
 */
async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL non impostato')
    process.exit(1)
  }

  const client = postgres(url, { max: 1, prepare: false })

  try {
    console.log('→ A1: colonna products.additions_watch...')
    await client.unsafe(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "additions_watch" boolean DEFAULT false NOT NULL;`,
    )
    console.log('  ✅ ok')

    console.log('→ D1: colonne recurring_order_items.weekday / removed...')
    await client.unsafe(
      `ALTER TABLE "recurring_order_items" ADD COLUMN IF NOT EXISTS "weekday" smallint;`,
    )
    await client.unsafe(
      `ALTER TABLE "recurring_order_items" ADD COLUMN IF NOT EXISTS "removed" boolean DEFAULT false NOT NULL;`,
    )
    console.log('  ✅ ok')

    console.log('→ F1: deduplica righe doppie in daily_order_items...')
    const deleted = await client.unsafe(`
      DELETE FROM "daily_order_items" a
      USING "daily_order_items" b
      WHERE a."daily_order_id" = b."daily_order_id"
        AND a."product_id" = b."product_id"
        AND (a."position" > b."position" OR (a."position" = b."position" AND a."id" > b."id"));
    `)
    console.log(`  ✅ rimosse ${deleted.count} righe duplicate`)

    console.log('→ F1: vincolo univoco (daily_order_id, product_id)...')
    await client.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'daily_order_items_order_product_key'
        ) THEN
          ALTER TABLE "daily_order_items"
            ADD CONSTRAINT "daily_order_items_order_product_key" UNIQUE ("daily_order_id", "product_id");
        END IF;
      END
      $$;
    `)
    console.log('  ✅ ok')

    console.log('\n✅ Migrazione 0004 applicata. Puoi avviare l\'app.')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('\nErrore:', err?.message ?? err)
  process.exit(1)
})
