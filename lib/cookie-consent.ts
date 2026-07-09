// Gestione del consenso cookie (Opzione A — banner informativo leggero).
// Vedi docs/cookie-banner-plan.md §5. La scelta è salvata in localStorage come
// oggetto versionato così che il passaggio futuro all'Opzione B (categorie + gate
// analytics) sia incrementale e non una riscrittura.

export const CONSENT_STORAGE_KEY = 'cookie-consent'

// Incrementa quando cambiano i cookie/tecnologie usati: il banner ricomparirà
// a tutti gli utenti per ri-informarli.
export const CONSENT_VERSION = 1

// 'info-ack' = preso atto (Opzione A). 'accepted'/'rejected' sono predisposti
// per l'Opzione B (consenso analitico granulare) ma non ancora usati.
export type ConsentChoice = 'info-ack' | 'accepted' | 'rejected'

export interface CookieConsent {
  version: number
  choice: ConsentChoice
  ts: number
}

// SSR-safe: ritorna null sul server o se non c'è un consenso con la versione corrente.
export function readConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CookieConsent>
    if (parsed?.version !== CONSENT_VERSION || !parsed.choice) return null
    return parsed as CookieConsent
  } catch {
    return null
  }
}

export function writeConsent(choice: ConsentChoice): CookieConsent {
  const consent: CookieConsent = { version: CONSENT_VERSION, choice, ts: Date.now() }
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent))
  } catch {
    // localStorage non disponibile (es. modalità privata) — il banner ricomparirà,
    // accettabile per un avviso puramente informativo.
  }
  return consent
}
