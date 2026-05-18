import dotenv from 'dotenv'
import path from 'node:path'

// Match Next.js precedence: .env.local overrides .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true })
