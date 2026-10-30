CREATE TYPE "public"."panettone_delivery_kind" AS ENUM('preciso', 'entro');--> statement-breakpoint
CREATE TYPE "public"."panettone_status" AS ENUM('todo', 'stock', 'done');--> statement-breakpoint
CREATE TABLE "panettone_flavors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bakery_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "panettone_flavors_bakery_key" UNIQUE("bakery_id","key")
);
--> statement-breakpoint
CREATE TABLE "panettone_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"flavor_id" uuid NOT NULL,
	"qty" integer NOT NULL,
	"produced_qty" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "panettone_order_items_order_flavor_key" UNIQUE("order_id","flavor_id")
);
--> statement-breakpoint
CREATE TABLE "panettone_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bakery_id" uuid NOT NULL,
	"season" smallint NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text,
	"delivery_kind" "panettone_delivery_kind" NOT NULL,
	"delivery_date" date NOT NULL,
	"pickup_time" text,
	"deposit" numeric(10, 2),
	"notes" text,
	"status" "panettone_status" DEFAULT 'todo' NOT NULL,
	"done_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "panettone_plan_settings" (
	"bakery_id" uuid NOT NULL,
	"season" smallint NOT NULL,
	"start_date" date,
	"cap" integer DEFAULT 20 NOT NULL,
	"lead" integer DEFAULT 1 NOT NULL,
	"max_g" integer DEFAULT 4 NOT NULL,
	"sun_closed" boolean DEFAULT true NOT NULL,
	"strategy" text DEFAULT 'tardi' NOT NULL,
	"prio" text DEFAULT 'preciso' NOT NULL,
	"group_flavors" boolean DEFAULT true NOT NULL,
	"confirmed_at" timestamp with time zone,
	"confirmed_plan" jsonb,
	CONSTRAINT "panettone_plan_settings_bakery_id_season_pk" PRIMARY KEY("bakery_id","season")
);
--> statement-breakpoint
ALTER TABLE "panettone_flavors" ADD CONSTRAINT "panettone_flavors_bakery_id_bakeries_id_fk" FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panettone_order_items" ADD CONSTRAINT "panettone_order_items_order_id_panettone_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."panettone_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panettone_order_items" ADD CONSTRAINT "panettone_order_items_flavor_id_panettone_flavors_id_fk" FOREIGN KEY ("flavor_id") REFERENCES "public"."panettone_flavors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panettone_orders" ADD CONSTRAINT "panettone_orders_bakery_id_bakeries_id_fk" FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panettone_plan_settings" ADD CONSTRAINT "panettone_plan_settings_bakery_id_bakeries_id_fk" FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "panettone_orders_season_idx" ON "panettone_orders" USING btree ("bakery_id","season");