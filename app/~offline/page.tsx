'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Sei offline</h1>
        <p className="text-slate-500 text-sm mb-6">
          Controlla la connessione Wi-Fi e riprova.
          Le pagine visitate di recente sono disponibili anche offline.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Riprova
        </button>
      </div>
    </div>
  )
}
