import Link from 'next/link'

// Guscio condiviso per le pagine legali pubbliche (privacy, cookie, termini).
// Stile coerente con la card di login (palette slate, angoli arrotondati).
export function LegalLayout({
  title,
  subtitle,
  meta,
  children,
}: {
  title: string
  subtitle?: string
  meta?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-2 text-sm italic text-slate-500">{subtitle}</p>}
        {meta && <div className="mt-4 text-sm text-slate-600">{meta}</div>}

        <div className="mt-2">{children}</div>

        <nav className="mt-10 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-200 pt-6 text-sm">
          <Link href="/login" className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700">
            ← Login
          </Link>
          <Link href="/privacy" className="text-slate-500 underline underline-offset-2 hover:text-slate-700">
            Privacy
          </Link>
          <Link href="/cookie-policy" className="text-slate-500 underline underline-offset-2 hover:text-slate-700">
            Cookie Policy
          </Link>
          <Link href="/termini" className="text-slate-500 underline underline-offset-2 hover:text-slate-700">
            Termini e Condizioni
          </Link>
        </nav>
      </article>
    </main>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  )
}

export function Subheading({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-5 text-base font-semibold text-slate-800">{children}</h3>
}

export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-600">
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-slate-200 align-top">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Box informativo/avviso (es. nota "bozza", richiami normativi).
export function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{children}</p>
  )
}
