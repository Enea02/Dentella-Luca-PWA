-- =====================================================================
-- Sezione Panettoni — modifiche al database
-- Equivale alla migrazione Drizzle lib/db/migrations/0006_red_shadowcat.sql,
-- ma è IDEMPOTENTE: si può rieseguire senza errori (es. SQL editor di Neon).
--
-- Solo aggiunte: 2 enum + 4 tabelle nuove. Nessuna tabella esistente
-- viene modificata.
--
-- In fondo registra la migrazione 0006 in drizzle.__drizzle_migrations
-- (se quella tabella esiste), così un futuro `npm run db:migrate` non
-- prova a rieseguirla.
-- =====================================================================

BEGIN;

-- ---------- Enum ----------
DO $$ BEGIN
  CREATE TYPE "public"."panettone_delivery_kind" AS ENUM('preciso', 'entro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."panettone_status" AS ENUM('todo', 'stock', 'done');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------- Gusti (per panificio; i 12 di default vengono creati dall'app al primo accesso) ----------
CREATE TABLE IF NOT EXISTS "panettone_flavors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "bakery_id" uuid NOT NULL,
  "key" text NOT NULL,
  "name" text NOT NULL,
  "color" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  CONSTRAINT "panettone_flavors_bakery_key" UNIQUE("bakery_id", "key"),
  CONSTRAINT "panettone_flavors_bakery_id_bakeries_id_fk"
    FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE cascade ON UPDATE no action
);

-- ---------- Ordini ----------
CREATE TABLE IF NOT EXISTS "panettone_orders" (
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
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "panettone_orders_bakery_id_bakeries_id_fk"
    FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "panettone_orders_season_idx"
  ON "panettone_orders" USING btree ("bakery_id", "season");

-- ---------- Righe ordine (una per gusto per ordine) ----------
CREATE TABLE IF NOT EXISTS "panettone_order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "flavor_id" uuid NOT NULL,
  "qty" integer NOT NULL,
  "produced_qty" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "panettone_order_items_order_flavor_key" UNIQUE("order_id", "flavor_id"),
  CONSTRAINT "panettone_order_items_order_id_panettone_orders_id_fk"
    FOREIGN KEY ("order_id") REFERENCES "public"."panettone_orders"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "panettone_order_items_flavor_id_panettone_flavors_id_fk"
    FOREIGN KEY ("flavor_id") REFERENCES "public"."panettone_flavors"("id") ON DELETE restrict ON UPDATE no action
);

-- ---------- Impostazioni pianificazione (una riga per panificio e stagione) ----------
CREATE TABLE IF NOT EXISTS "panettone_plan_settings" (
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
  CONSTRAINT "panettone_plan_settings_bakery_id_season_pk" PRIMARY KEY("bakery_id", "season"),
  CONSTRAINT "panettone_plan_settings_bakery_id_bakeries_id_fk"
    FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE cascade ON UPDATE no action
);

-- ---------- Registro migrazioni Drizzle ----------
-- hash = sha256 di lib/db/migrations/0006_red_shadowcat.sql
-- created_at = "when" della voce 0006 in lib/db/migrations/meta/_journal.json
DO $$ BEGIN
  IF to_regclass('drizzle.__drizzle_migrations') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM drizzle.__drizzle_migrations
       WHERE hash = 'bc57551b63f9676278ae73454c303e1e20ad986613bfc898e72b384deb6ecc93'
     ) THEN
    INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at")
    VALUES ('bc57551b63f9676278ae73454c303e1e20ad986613bfc898e72b384deb6ecc93', 1793012684514);
  END IF;
END $$;

COMMIT;
