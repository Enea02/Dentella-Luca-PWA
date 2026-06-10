ALTER TABLE "bakeries" ADD COLUMN "order_cutoff_hour" integer;--> statement-breakpoint
ALTER TABLE "daily_order_items" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_order_items" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;