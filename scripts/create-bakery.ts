import './load-env'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import bcrypt from 'bcryptjs'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { bakeries, sections, users } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

const DEFAULT_SECTIONS = [
  { name: 'Dolci', color: 'bg-amber-100 text-amber-800' },
  { name: 'Pane comune', color: 'bg-orange-100 text-orange-800' },
  { name: 'Salati', color: 'bg-red-100 text-red-800' },
  { name: 'Pizze farcite', color: 'bg-rose-100 text-rose-800' },
  { name: 'Focacce farcite', color: 'bg-pink-100 text-pink-800' },
  { name: 'Specialità', color: 'bg-emerald-100 text-emerald-800' },
]

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const rl = readline.createInterface({ input, output })

  const bakeryName = (await rl.question('Nome panificio: ')).trim()
  if (!bakeryName) throw new Error('Nome panificio richiesto')

  const ownerEmail = (await rl.question('Email owner: ')).trim().toLowerCase()
  if (!ownerEmail || !ownerEmail.includes('@')) throw new Error('Email non valida')

  const password = (await rl.question('Password owner (min 8 caratteri): ')).trim()
  if (password.length < 8) throw new Error('Password troppo corta (min 8 caratteri)')

  const ownerName = (await rl.question('Nome utente (opzionale): ')).trim() || null

  const roleAns = (await rl.question('Ruolo del primo utente [admin/owner] (default admin): ')).trim().toLowerCase()
  const firstUserRole: 'admin' | 'owner' = roleAns === 'owner' ? 'owner' : 'admin'

  rl.close()

  const client = postgres(url, { max: 1, prepare: false })
  const db = drizzle(client)

  const slug = slugify(bakeryName)

  try {
    // Check if email already exists
    const existing = await db.select().from(users).where(eq(users.email, ownerEmail)).limit(1)
    if (existing.length > 0) {
      console.error(`\nEmail "${ownerEmail}" già registrata. Annullo.`)
      await client.end()
      process.exit(1)
    }

    // Check slug uniqueness
    const existingBakery = await db.select().from(bakeries).where(eq(bakeries.slug, slug)).limit(1)
    if (existingBakery.length > 0) {
      console.error(`\nSlug "${slug}" già esistente. Cambia il nome del panificio.`)
      await client.end()
      process.exit(1)
    }

    await db.transaction(async (tx) => {
      const [bakery] = await tx.insert(bakeries).values({ name: bakeryName, slug }).returning()

      const passwordHash = await bcrypt.hash(password, 12)
      await tx.insert(users).values({
        bakeryId: bakery.id,
        email: ownerEmail,
        passwordHash,
        role: firstUserRole,
        name: ownerName,
      })

      await tx.insert(sections).values(
        DEFAULT_SECTIONS.map((s, i) => ({
          bakeryId: bakery.id,
          name: s.name,
          color: s.color,
          order: i,
        })),
      )

      console.log(`\n✅ Panificio "${bakeryName}" creato (id: ${bakery.id})`)
      console.log(`   Primo utente: ${ownerEmail} (ruolo: ${firstUserRole})`)
      console.log(`   Sezioni default: ${DEFAULT_SECTIONS.map((s) => s.name).join(', ')}`)
    })
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('\nErrore:', err.message ?? err)
  process.exit(1)
})
