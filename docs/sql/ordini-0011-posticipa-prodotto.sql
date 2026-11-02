-- =====================================================================
-- Ordini — posticipare un prodotto a un altro giorno
-- Ordine di esecuzione: dopo docs/sql/panettoni-0010-collegamento-clienti.sql.
--
-- Equivale alla migrazione Drizzle lib/db/migrations/0011_pale_anthem.sql,
-- ma è IDEMPOTENTE: si può rieseguire senza errori.
--
-- Aggiunge solo una colonna facoltativa a daily_order_items (vuota per tutte
-- le righe esistenti): la data da cui un prodotto è stato rimandato, mostrata
-- come "rimandato dal …". Nessun dato esistente cambia.
-- =====================================================================

BEGIN;

ALTER TABLE "daily_order_items" ADD COLUMN IF NOT EXISTS "postponed_from" date;

-- ---------- Registro migrazioni Drizzle (0011) ----------
-- hash = sha256 di lib/db/migrations/0011_pale_anthem.sql
-- created_at = "when" della voce 0011 in lib/db/migrations/meta/_journal.json
DO $$ BEGIN
  IF to_regclass('drizzle.__drizzle_migrations') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM drizzle.__drizzle_migrations
       WHERE hash = '85fa1c3b2443eeef59689605f5b49fb99c03422dbb7781a84f1fcac4cb0a1013'
     ) THEN
    INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at")
    VALUES ('85fa1c3b2443eeef59689605f5b49fb99c03422dbb7781a84f1fcac4cb0a1013', 1793656458986);
  END IF;
END $$;

COMMIT;
