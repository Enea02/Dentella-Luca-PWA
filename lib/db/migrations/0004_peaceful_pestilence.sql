ALTER TABLE "products" ADD COLUMN "additions_watch" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_order_items" ADD COLUMN "weekday" smallint;--> statement-breakpoint
ALTER TABLE "recurring_order_items" ADD COLUMN "removed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Collapse pre-existing duplicate rows (same product twice in one daily order) before
-- enforcing the unique constraint. Keep one row per (daily_order_id, product_id) — the
-- lowest position, then lowest id — and drop the redundant copies (they are an artifact
-- of the append-without-dedup bug, not real orders). See docs/order-item-duplication-bug.md.
DELETE FROM "daily_order_items" a
USING "daily_order_items" b
WHERE a."daily_order_id" = b."daily_order_id"
  AND a."product_id" = b."product_id"
  AND (a."position" > b."position" OR (a."position" = b."position" AND a."id" > b."id"));--> statement-breakpoint
ALTER TABLE "daily_order_items" ADD CONSTRAINT "daily_order_items_order_product_key" UNIQUE("daily_order_id","product_id");