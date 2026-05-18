import './load-env'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { asc, eq } from 'drizzle-orm'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { bakeries, users } from '../lib/db/schema'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL non impostato')
    process.exit(1)
  }

  const client = postgres(url, { max: 1, prepare: false })
  const db = drizzle(client)

  try {
    // 1. Idempotent ALTER TYPE — postgres doesn't have IF NOT EXISTS for ADD VALUE on older versions,
    //    but does on 12+. Wrap in DO block for safety.
    console.log('→ Estensione enum role con "admin"...')
    await client.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'admin'
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'role')
        ) THEN
          ALTER TYPE role ADD VALUE 'admin';
        END IF;
      END
      $$;
    `)
    console.log('  ✅ Valore "admin" disponibile')

    // 2. List users with their role
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        bakeryName: bakeries.name,
      })
      .from(users)
      .innerJoin(bakeries, eq(bakeries.id, users.bakeryId))
      .orderBy(asc(users.email))

    if (allUsers.length === 0) {
      console.log('\nNessun utente nel DB. Crea prima un panificio con: npm run bakery:create')
      await client.end()
      return
    }

    console.log('\nUtenti attuali:')
    allUsers.forEach((u, i) => {
      console.log(`  [${i + 1}] ${u.email}  (ruolo: ${u.role}, panificio: ${u.bakeryName})`)
    })

    const rl = readline.createInterface({ input, output })
    const ans = (await rl.question('\nPromuovere uno a admin? Numero (o INVIO per saltare): ')).trim()
    rl.close()

    if (!ans) {
      console.log('  → Nessuna promozione effettuata.')
    } else {
      const idx = parseInt(ans, 10) - 1
      if (isNaN(idx) || idx < 0 || idx >= allUsers.length) {
        console.log('  → Scelta non valida, annullo.')
      } else {
        const target = allUsers[idx]
        await db.update(users).set({ role: 'admin' }).where(eq(users.id, target.id))
        console.log(`  ✅ ${target.email} promosso a admin`)
      }
    }

    console.log('\n→ Ora lancia `npm run db:push` per creare le tabelle override (role_permission_overrides, user_permission_overrides)')
    console.log('  Quindi logout/login dall\'app per ricevere il JWT aggiornato.')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('\nErrore:', err.message ?? err)
  process.exit(1)
})
