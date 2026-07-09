'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { readConsent, writeConsent } from '@/lib/cookie-consent'

// Banner informativo leggero (docs/cookie-banner-plan.md, Opzione A).
// L'app usa solo cookie tecnici/funzionali + analytics cookieless: nessun consenso
// preventivo è dovuto, basta l'informativa + un avviso una tantum.
export function CookieBanner() {
  // Parte chiuso: evita il flash del banner durante l'hydration su chi ha già
  // preso atto. Il primo effect lo apre solo se manca un consenso valido.
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!readConsent()) setVisible(true)
  }, [])

  function acknowledge() {
    writeConsent('info-ack')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Informativa cookie"
      // z-40: sopra il contenuto, sotto i dialog/sheet Radix (z-50).
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 sm:p-4"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Usiamo solo <strong className="font-medium text-slate-800">cookie tecnici</strong> e
            statistiche anonime, necessari al funzionamento del gestionale. Nessun cookie di
            profilazione.{' '}
            <Link
              href="/cookie-policy"
              className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
            >
              Cookie Policy
            </Link>
          </p>
          <Button
            type="button"
            onClick={acknowledge}
            className="w-full shrink-0 rounded-xl bg-slate-900 text-white hover:bg-slate-800 sm:w-auto"
          >
            Ho capito
          </Button>
        </div>
      </div>
    </div>
  )
}
