CREATE TYPE "public"."panettone_item_state" AS ENUM('todo', 'stock', 'delivered');--> statement-breakpoint
ALTER TABLE "panettone_order_items" ADD COLUMN "state" "panettone_item_state" DEFAULT 'todo' NOT NULL;--> statement-breakpoint
-- Carry over the per-flavor deliveries and the row-level "in magazzino".
UPDATE "panettone_order_items" SET "state" = 'delivered' WHERE "delivered" = true;--> statement-breakpoint
UPDATE "panettone_order_items" i SET "state" = 'stock'
FROM "panettone_orders" o
WHERE o.id = i.order_id AND o.status = 'stock' AND i.delivered = false;
