CREATE TYPE "public"."customer_type" AS ENUM('fixed', 'single');--> statement-breakpoint
CREATE TYPE "public"."display_mode" AS ENUM('by-article', 'by-section');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'staff');--> statement-breakpoint
CREATE TYPE "public"."unit" AS ENUM('pieces', 'kg');--> statement-breakpoint
CREATE TABLE "bakeries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bakeries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bakery_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "customer_type" DEFAULT 'single' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_item_status" (
	"bakery_id" uuid NOT NULL,
	"date" date NOT NULL,
	"customer_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"variant" text,
	CONSTRAINT "daily_item_status_bakery_id_date_customer_id_product_id_pk" PRIMARY KEY("bakery_id","date","customer_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "daily_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"daily_order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" "unit" NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"variant" text
);
--> statement-breakpoint
CREATE TABLE "daily_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bakery_id" uuid NOT NULL,
	"date" date NOT NULL,
	"customer_id" uuid NOT NULL,
	CONSTRAINT "daily_orders_unique" UNIQUE("bakery_id","date","customer_id")
);
--> statement-breakpoint
CREATE TABLE "divisors" (
	"bakery_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"value" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "divisors_bakery_id_product_id_pk" PRIMARY KEY("bakery_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "production_group_sections" (
	"group_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	CONSTRAINT "production_group_sections_group_id_section_id_pk" PRIMARY KEY("group_id","section_id")
);
--> statement-breakpoint
CREATE TABLE "production_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bakery_id" uuid NOT NULL,
	"name" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"display_mode" "display_mode" DEFAULT 'by-article'
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bakery_id" uuid NOT NULL,
	"name" text NOT NULL,
	"section_id" uuid NOT NULL,
	"unit" "unit" DEFAULT 'pieces' NOT NULL,
	"pieces_per_kg" integer
);
--> statement-breakpoint
CREATE TABLE "recurring_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recurring_order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" "unit" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bakery_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"weekdays" smallint[] DEFAULT '{}'::smallint[] NOT NULL,
	CONSTRAINT "recurring_orders_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bakery_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "sections_bakery_name_key" UNIQUE("bakery_id","name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bakery_id" uuid NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'staff' NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_bakery_id_bakeries_id_fk" FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_item_status" ADD CONSTRAINT "daily_item_status_bakery_id_bakeries_id_fk" FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_item_status" ADD CONSTRAINT "daily_item_status_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_item_status" ADD CONSTRAINT "daily_item_status_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_order_items" ADD CONSTRAINT "daily_order_items_daily_order_id_daily_orders_id_fk" FOREIGN KEY ("daily_order_id") REFERENCES "public"."daily_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_order_items" ADD CONSTRAINT "daily_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_orders" ADD CONSTRAINT "daily_orders_bakery_id_bakeries_id_fk" FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_orders" ADD CONSTRAINT "daily_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "divisors" ADD CONSTRAINT "divisors_bakery_id_bakeries_id_fk" FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "divisors" ADD CONSTRAINT "divisors_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_group_sections" ADD CONSTRAINT "production_group_sections_group_id_production_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."production_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_group_sections" ADD CONSTRAINT "production_group_sections_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_groups" ADD CONSTRAINT "production_groups_bakery_id_bakeries_id_fk" FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_bakery_id_bakeries_id_fk" FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_order_items" ADD CONSTRAINT "recurring_order_items_recurring_order_id_recurring_orders_id_fk" FOREIGN KEY ("recurring_order_id") REFERENCES "public"."recurring_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_order_items" ADD CONSTRAINT "recurring_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_orders" ADD CONSTRAINT "recurring_orders_bakery_id_bakeries_id_fk" FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_orders" ADD CONSTRAINT "recurring_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_bakery_id_bakeries_id_fk" FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_bakery_id_bakeries_id_fk" FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customers_bakery_idx" ON "customers" USING btree ("bakery_id");--> statement-breakpoint
CREATE INDEX "daily_item_status_date_idx" ON "daily_item_status" USING btree ("bakery_id","date");--> statement-breakpoint
CREATE INDEX "daily_items_order_idx" ON "daily_order_items" USING btree ("daily_order_id");--> statement-breakpoint
CREATE INDEX "daily_orders_date_idx" ON "daily_orders" USING btree ("bakery_id","date");--> statement-breakpoint
CREATE INDEX "production_groups_bakery_idx" ON "production_groups" USING btree ("bakery_id");--> statement-breakpoint
CREATE INDEX "products_bakery_idx" ON "products" USING btree ("bakery_id");--> statement-breakpoint
CREATE INDEX "products_section_idx" ON "products" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "recurring_items_order_idx" ON "recurring_order_items" USING btree ("recurring_order_id");--> statement-breakpoint
CREATE INDEX "recurring_orders_bakery_idx" ON "recurring_orders" USING btree ("bakery_id");--> statement-breakpoint
CREATE INDEX "sections_bakery_idx" ON "sections" USING btree ("bakery_id");--> statement-breakpoint
CREATE INDEX "users_bakery_idx" ON "users" USING btree ("bakery_id");