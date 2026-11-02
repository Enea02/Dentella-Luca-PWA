-- =====================================================================
-- Panettoni — collegamento facoltativo ai clienti del gestionale
-- Ordine di esecuzione: panettoni.sql → panettoni-0007-consegna-per-gusto.sql
--   → panettoni-0008-magazzino-per-gusto.sql → QUESTO file.
--
-- Equivale alla migrazione Drizzle lib/db/migrations/0010_past_outlaw_kid.sql,
-- ma è IDEMPOTENTE: si può rieseguire senza errori.
--
-- Aggiunge solo una colonna facoltativa (vuota per gli ordini esistenti) e un
-- indice: nessun dato esistente cambia. Se un cliente del gestionale viene
-- eliminato, i suoi ordini panettoni restano e perdono solo il collegamento.
-- =====================================================================

BEGIN;

ALTER TABLE "panettone_orders" ADD COLUMN IF NOT EXISTS "customer_id" uuid;

DO $$ BEGIN
  ALTER TABLE "panettone_orders"
    ADD CONSTRAINT "panettone_orders_customer_id_customers_id_fk"
    FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "panettone_orders_customer_date_idx"
  ON "panettone_orders" USING btree ("bakery_id", "customer_id", "delivery_date");

-- ---------- Registro migrazioni Drizzle (0010) ----------
-- hash = sha256 di lib/db/migrations/0010_past_outlaw_kid.sql
-- created_at = "when" della voce 0010 in lib/db/migrations/meta/_journal.json
DO $$ BEGIN
  IF to_regclass('drizzle.__drizzle_migrations') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM drizzle.__drizzle_migrations
       WHERE hash = '27812360240cf0de48f4708df0a6a7dd921767eab6bcb003a545d0d150d800f3'
     ) THEN
    INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at")
    VALUES ('27812360240cf0de48f4708df0a6a7dd921767eab6bcb003a545d0d150d800f3', 1793653941728);
  END IF;
END $$;

COMMIT;
