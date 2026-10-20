ALTER TABLE "bakeries" ADD COLUMN "sheet_hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "suspended_from" date;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "suspended_to" date;--> statement-breakpoint
ALTER TABLE "daily_item_status" ADD COLUMN "production_done" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_order_items" ADD COLUMN "production_done" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_orders" ADD COLUMN "day_orders" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "pin_bottom" boolean DEFAULT false NOT NULL;