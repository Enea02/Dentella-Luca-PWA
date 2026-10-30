// Shared zod schemas + tenant checks for the Panettoni API routes (server-only).
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { panettoneFlavors } from '@/lib/db/schema'
import { currentSeason } from './types'

export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null))

export const OrderFieldsSchema = z.object({
  customerName: z.string().trim().min(1).max(120),
  phone: optionalText(40),
  deliveryKind: z.enum(['preciso', 'entro']),
  deliveryDate: IsoDate,
  pickupTime: optionalText(40),
  deposit: z.number().min(0).max(100_000).nullish().transform((v) => v ?? null),
  notes: optionalText(1000),
})

/** `?season=` query param, defaulting to the current campaign. */
export function seasonParam(url: string): number {
  const raw = new URL(url).searchParams.get('season')
  return raw === null ? currentSeason() : z.coerce.number().int().min(2000).max(2100).parse(raw)
}

/** True when every id is a flavor of this bakery (blocks cross-tenant ids). */
export async function flavorsBelongTo(bakeryId: string, flavorIds: string[]): Promise<boolean> {
  const unique = [...new Set(flavorIds)]
  if (unique.length === 0) return true
  const rows = await db
    .select({ id: panettoneFlavors.id })
    .from(panettoneFlavors)
    .where(and(eq(panettoneFlavors.bakeryId, bakeryId), inArray(panettoneFlavors.id, unique)))
  return rows.length === unique.length
}
