-- =====================================================================
-- Panettoni — stato per singolo gusto: da fare / in magazzino / consegnato
-- Da eseguire DOPO docs/sql/panettoni.sql.
--
-- Comprende anche docs/sql/panettoni-0007-consegna-per-gusto.sql: va bene
-- sia se lo 0007 è già stato applicato sia se no. È IDEMPOTENTE: si può
-- rieseguire senza errori.
--
-- Equivale alle migrazioni Drizzle 0007_icy_wallflower, 0008_magical_satana,
-- 0009_unusual_patriot (lib/db/migrations/), che registra in fondo.
--
-- Cosa fa:
--  1. aggiunge a panettone_order_items la colonna "state"
--     ('todo' | 'stock' | 'delivered');
--  2. la riempie dai dati esistenti: gusti consegnati → 'delivered';
--     ordini già in archivio → tutto 'delivered'; gusti non ancora consegnati
--     di ordini "in magazzino" → 'stock';
--  3. elimina la vecchia colonna "delivered".
-- =====================================================================

BEGIN;

DO $$ BEGIN
  CREATE TYPE "public"."panettone_item_state" AS ENUM('todo', 'stock', 'delivered');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "panettone_order_items"
  ADD COLUMN IF NOT EXISTS "state" "panettone_item_state" DEFAULT 'todo' NOT NULL;

-- Conversione dai dati esistenti (solo finché c'è ancora la vecchia colonna).
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panettone_order_items' AND column_name = 'delivered'
  ) THEN
    UPDATE "panettone_order_items" SET "state" = 'delivered' WHERE "delivered" = true;
    ALTER TABLE "panettone_order_items" DROP COLUMN "delivered";
  END IF;
END $$;

-- Lo stato della riga passa ai gusti (vale anche se lo 0007 non era stato applicato).
-- Rieseguire è sicuro: da qui in poi lo stato della riga deriva dai gusti, quindi
-- queste righe non trovano più niente da cambiare.
-- Ordini in archivio → tutti i gusti consegnati.
UPDATE "panettone_order_items" i SET "state" = 'delivered'
FROM "panettone_orders" o
WHERE o.id = i.order_id AND o.status = 'done' AND i.state <> 'delivered';
-- Ordini in magazzino → i gusti non ancora consegnati vanno in magazzino.
UPDATE "panettone_order_items" i SET "state" = 'stock'
FROM "panettone_orders" o
WHERE o.id = i.order_id AND o.status = 'stock' AND i.state = 'todo';

-- ---------- Registro migrazioni Drizzle (0007, 0008, 0009) ----------
-- hash = sha256 del file della migrazione; created_at = "when" in meta/_journal.json
DO $$
DECLARE
  m record;
BEGIN
  IF to_regclass('drizzle.__drizzle_migrations') IS NULL THEN
    RETURN;
  END IF;
  FOR m IN
    SELECT * FROM (VALUES
      ('1d672aded71a60853e187b80f60f9927bf15a3fa4d0c29d74ee239b3d50ea233', 1793357602543::bigint), -- 0007_icy_wallflower
      ('9e43bc98202fdb510ed83d3b38a23a7f4be8ff91618727c6a1b64c14590ed1cd', 1793651385717::bigint), -- 0008_magical_satana
      ('c0a682316a8949dc089c7fd81d0d5adf0b115e45cdad7b5edd824d8438ab445b', 1793651394479::bigint)  -- 0009_unusual_patriot
    ) AS t(hash, created_at)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = m.hash) THEN
      INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at") VALUES (m.hash, m.created_at);
    END IF;
  END LOOP;
END $$;

COMMIT;
