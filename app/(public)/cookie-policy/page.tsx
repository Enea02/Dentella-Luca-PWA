import type { Metadata } from 'next'
import { LegalLayout, Section, Subheading, Table, Note } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Cookie Policy - Panificio',
  description: 'Informativa sull’uso di cookie e tecnologie di memorizzazione',
}

// Pagina pubblica (raggiungibile pre-login). Contenuto allineato a
// docs/legal/cookie-policy.md. I segnaposto «...» vanno compilati dal Titolare
// prima della pubblicazione definitiva (vedi docs/legal/README.md).
export default function CookiePolicyPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      subtitle="Informativa sull'uso di cookie e tecnologie di memorizzazione, ai sensi dell'art. 122 del D.lgs. 196/2003, della Direttiva ePrivacy 2002/58/CE e delle Linee guida del Garante sui cookie del 10 giugno 2021."
      meta={
        <>
          <strong className="font-medium text-slate-800">Ultimo aggiornamento:</strong> «GG/MM/AAAA»
          <br />
          <strong className="font-medium text-slate-800">Titolare:</strong> «Ragione sociale del
          panificio» — «email@panificio.it»
        </>
      }
    >
      <Section title="1. Cosa sono i cookie e le tecnologie simili">
        <p>
          I <strong>cookie</strong> sono piccoli file di testo che i siti visitati inviano al
          dispositivo dell&apos;utente, dove vengono memorizzati per essere ritrasmessi agli stessi
          siti alla visita successiva. Tecnologie analoghe (es. <code>localStorage</code>,{' '}
          <code>Cache Storage</code> dei Service Worker) consentono di memorizzare informazioni sul
          dispositivo per finalità tecniche o funzionali.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            <strong>cookie tecnici / di sessione</strong> — necessari al funzionamento del servizio;
            non richiedono consenso, solo informativa;
          </li>
          <li>
            <strong>cookie funzionali</strong> — migliorano l&apos;esperienza d&apos;uso (es. cache,
            modalità offline); non richiedono consenso se strettamente legati a un servizio richiesto
            dall&apos;utente;
          </li>
          <li>
            <strong>cookie analitici</strong> — misurano l&apos;utilizzo del sito; non richiedono
            consenso solo se anonimizzati, di prima parte e senza incrocio con altri dati;
          </li>
          <li>
            <strong>cookie di profilazione / marketing / terze parti</strong> — richiedono consenso
            preventivo tramite banner.
          </li>
        </ul>
      </Section>

      <Section title="2. Cookie e tecnologie utilizzati da questa applicazione">
        <p>
          L&apos;applicazione è un gestionale <strong>accessibile solo previo login</strong> e{' '}
          <strong>non utilizza cookie di profilazione né tracker pubblicitari di terze parti</strong>.
          Di seguito l&apos;inventario completo:
        </p>

        <Subheading>Cookie tecnici (necessari) — nessun consenso richiesto</Subheading>
        <Table
          head={['Nome', 'Titolare', 'Finalità', 'Durata']}
          rows={[
            ['authjs.session-token (__Secure-… in produzione)', 'Prima parte', 'Mantiene la sessione di login (token JWT)', 'Sessione / durata del login'],
            ['authjs.csrf-token (__Host-…)', 'Prima parte', 'Protezione contro attacchi CSRF', 'Sessione'],
            ['authjs.callback-url', 'Prima parte', 'Reindirizzamento corretto dopo il login', 'Sessione'],
          ]}
        />

        <Subheading>Storage funzionale (tecnologie simili ai cookie) — nessun consenso richiesto</Subheading>
        <Table
          head={['Tecnologia', 'Finalità', 'Durata']}
          rows={[
            ["localStorage['swr-cache']", 'Cache locale dei dati di riferimento (prodotti, clienti) per velocità e uso offline', 'Fino a cancellazione manuale / svuotamento browser'],
            ['Cache Storage del Service Worker (api-reference-data, api-orders, static-assets, precache)', 'Funzionalità PWA offline e prestazioni', 'Gestita dal Service Worker'],
          ]}
        />

        <Subheading>Statistiche anonime — Vercel Web Analytics (cookieless)</Subheading>
        <p>
          L&apos;applicazione utilizza <strong>Vercel Web Analytics</strong>, uno strumento di
          statistica <strong>senza cookie</strong> (cookieless), che raccoglie dati aggregati e
          anonimi sul numero di visite, senza tracciamento cross-site e senza identificare i singoli
          utenti. Per sua natura non installa cookie sul dispositivo. Trattandosi di uno strumento
          anonimo, di prima parte e privo di profilazione, è utilizzato sulla base del{' '}
          <strong>legittimo interesse</strong> del Titolare. Maggiori informazioni:{' '}
          <a
            href="https://vercel.com/docs/analytics/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-900 underline underline-offset-2"
          >
            vercel.com/docs/analytics/privacy-policy
          </a>
        </p>

        <Subheading>Font</Subheading>
        <p>
          I caratteri tipografici (Geist) sono <strong>ospitati localmente</strong> all&apos;interno
          dell&apos;applicazione (self-hosting a tempo di build): non vengono effettuate richieste a
          server di terze parti né installati cookie di terzi a runtime.
        </p>
      </Section>

      <Section title="3. Cookie di profilazione e di terze parti">
        <p>
          L&apos;applicazione <strong>non utilizza</strong> cookie di profilazione, di marketing o di
          social network, né strumenti di analisi che incrociano i dati con altre fonti (es. Google
          Analytics, Meta Pixel). Per questo motivo <strong>non è richiesto un banner di
          consenso</strong>: è sufficiente la presente informativa.
        </p>
        <Note>
          ℹ️ Qualora in futuro venissero introdotti strumenti di profilazione o tracker di terze
          parti, la presente policy sarà aggiornata e verrà implementato un banner di consenso
          conforme alle Linee guida del Garante.
        </Note>
      </Section>

      <Section title="4. Gestione delle preferenze e disattivazione">
        <p>
          Poiché i cookie utilizzati sono esclusivamente <strong>tecnici e funzionali</strong>, la
          loro disattivazione può compromettere il funzionamento dell&apos;applicazione (in
          particolare il login e la modalità offline).
        </p>
        <p>
          L&apos;utente può comunque gestire o eliminare i cookie e lo storage locale tramite le
          impostazioni del proprio browser:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>Chrome:</strong> Impostazioni → Privacy e sicurezza → Cookie e altri dati dei siti</li>
          <li><strong>Firefox:</strong> Impostazioni → Privacy e sicurezza → Cookie e dati dei siti web</li>
          <li><strong>Safari:</strong> Preferenze → Privacy</li>
          <li><strong>Edge:</strong> Impostazioni → Cookie e autorizzazioni sito</li>
        </ul>
      </Section>

      <Section title="5. Riferimenti e ulteriori informazioni">
        <p>
          Per qualsiasi richiesta è possibile contattare il Titolare all&apos;indirizzo
          «email@panificio.it».
        </p>
      </Section>
    </LegalLayout>
  )
}
