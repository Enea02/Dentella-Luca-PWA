-- =====================================================================
-- Panettoni — consegna per singolo gusto
-- Da eseguire DOPO docs/sql/panettoni.sql (già applicato).
-- Equivale alla migrazione Drizzle lib/db/migrations/0007_icy_wallflower.sql,
-- ma è IDEMPOTENTE: si può rieseguire senza errori.
--
-- Aggiunge solo una colonna (default false): nessun dato esistente cambia.
-- =====================================================================

BEGIN;

ALTER TABLE "panettone_order_items"
  ADD COLUMN IF NOT EXISTS "delivered" boolean DEFAULT false NOT NULL;

-- Ordini già archiviati prima di questa modifica: risultano consegnati per intero.
UPDATE "panettone_order_items" i
SET "delivered" = true
FROM "panettone_orders" o
WHERE o.id = i.order_id AND o.status = 'done' AND i.delivered = false;

-- ---------- Registro migrazioni Drizzle ----------
-- hash = sha256 di lib/db/migrations/0007_icy_wallflower.sql
-- created_at = "when" della voce 0007 in lib/db/migrations/meta/_journal.json
DO $$ BEGIN
  IF to_regclass('drizzle.__drizzle_migrations') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM drizzle.__drizzle_migrations
       WHERE hash = '1d672aded71a60853e187b80f60f9927bf15a3fa4d0c29d74ee239b3d50ea233'
     ) THEN
    INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at")
    VALUES ('1d672aded71a60853e187b80f60f9927bf15a3fa4d0c29d74ee239b3d50ea233', 1793357602543);
  END IF;
END $$;

COMMIT;
