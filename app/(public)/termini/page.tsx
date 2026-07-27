import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalLayout, Section, Note } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Termini e Condizioni - Panificio',
  description: 'Termini e condizioni d’uso dell’applicazione',
}

// Pagina pubblica (raggiungibile pre-login). Contenuto allineato a
// docs/legal/termini-e-condizioni.md. Il segnaposto «Città del Titolare» (foro
// competente) e la data vanno compilati prima della pubblicazione definitiva.
export default function TerminiPage() {
  return (
    <LegalLayout
      title="Termini e Condizioni d'uso"
      meta={
        <>
          <strong className="font-medium text-slate-800">Ultimo aggiornamento:</strong> «GG/MM/AAAA»
          <br />
          <strong className="font-medium text-slate-800">Applicazione:</strong> DENTELLA-LUCA-PWA —
          gestionale per panificio
        </>
      }
    >
      <Section title="1. Oggetto e ambito di applicazione">
        <p>
          I presenti Termini e Condizioni (“Termini”) disciplinano l&apos;accesso e l&apos;utilizzo
          dell&apos;applicazione web/PWA DENTELLA-LUCA-PWA (di seguito l&apos;“Applicazione”), un
          gestionale ad uso interno destinato alla gestione di pesatura, anagrafica clienti e
          statistiche di un panificio.
        </p>
        <p>
          L&apos;Applicazione è sviluppata e messa a disposizione a titolo gratuito da Enea Frontera,
          persona fisica (di seguito il “Fornitore”), ed è riservata agli utenti autorizzati
          (titolare, amministratore e personale del panificio, di seguito gli “Utenti”).
        </p>
        <Note>
          <strong>Ruoli distinti.</strong> Il <strong>Fornitore</strong> (Enea Frontera) sviluppa e
          fornisce il software. Il <strong>Titolare del trattamento</strong> dei dati inseriti
          (anagrafiche clienti, ordini) è il panificio che utilizza l&apos;Applicazione, come indicato
          nella{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-700">
            Privacy Policy
          </Link>
          .
        </Note>
        <p>
          L&apos;accesso e l&apos;uso dell&apos;Applicazione comportano l&apos;accettazione integrale
          dei presenti Termini. L&apos;Utente che non li accetti è tenuto a non utilizzare
          l&apos;Applicazione.
        </p>
      </Section>

      <Section title="2. Accesso e account">
        <ol className="list-decimal space-y-1 pl-5">
          <li>L&apos;accesso all&apos;Applicazione è consentito esclusivamente agli Utenti autorizzati, mediante credenziali individuali (e-mail e password).</li>
          <li>Le credenziali sono <strong>personali e non cedibili</strong>. L&apos;Utente è responsabile della loro custodia e di ogni attività compiuta tramite il proprio account.</li>
          <li>L&apos;Utente si impegna a comunicare tempestivamente al Titolare qualsiasi uso non autorizzato del proprio account o violazione della sicurezza.</li>
          <li>Gli account, i ruoli e i relativi permessi sono assegnati e revocati dall&apos;amministratore dell&apos;Applicazione.</li>
          <li>In caso di primo accesso o reset, può essere richiesta la modifica obbligatoria della password.</li>
        </ol>
      </Section>

      <Section title="3. Uso consentito">
        <p>L&apos;Utente si impegna a utilizzare l&apos;Applicazione:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>esclusivamente per le finalità gestionali interne del panificio;</li>
          <li>nel rispetto della legge, dei presenti Termini e delle istruzioni del Titolare;</li>
          <li>inserendo dati <strong>corretti, pertinenti e non eccedenti</strong>, evitando di immettere nei campi liberi categorie particolari di dati personali (art. 9 GDPR) o informazioni non necessarie.</li>
        </ul>
      </Section>

      <Section title="4. Usi vietati">
        <p>È in particolare vietato:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>accedere o tentare di accedere ad aree o dati per i quali non si dispone di autorizzazione;</li>
          <li>condividere le credenziali o consentire l&apos;uso dell&apos;account a terzi;</li>
          <li>alterare, decompilare, sottoporre a reverse engineering o tentare di compromettere la sicurezza e l&apos;integrità dell&apos;Applicazione;</li>
          <li>introdurre codice malevolo, sovraccaricare l&apos;infrastruttura o interferire con il normale funzionamento del servizio;</li>
          <li>estrarre, copiare o riutilizzare i dati per finalità diverse da quelle autorizzate;</li>
          <li>utilizzare l&apos;Applicazione in violazione di diritti di terzi o di norme di legge.</li>
        </ul>
      </Section>

      <Section title="5. Proprietà intellettuale">
        <p>
          L&apos;Applicazione, il relativo codice sorgente, la struttura, le interfacce, i marchi e i
          contenuti sono di titolarità di Enea Frontera e sono protetti dalle norme a tutela della
          proprietà intellettuale. Nessuna disposizione dei presenti Termini trasferisce
          all&apos;Utente diritti di proprietà intellettuale: all&apos;Utente è concesso un diritto
          d&apos;uso <strong>limitato, non esclusivo, non trasferibile e revocabile</strong>, per le
          sole finalità di cui sopra.
        </p>
        <p>
          I <strong>dati inseriti</strong> (anagrafiche, ordini, ecc.) restano di titolarità del
          panificio/Titolare del trattamento.
        </p>
      </Section>

      <Section title="6. Disponibilità del servizio">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Il Titolare si adopera per garantire la disponibilità e il corretto funzionamento dell&apos;Applicazione, <strong>senza tuttavia garantirne il funzionamento ininterrotto o privo di errori</strong>.</li>
          <li>Il servizio può essere sospeso, in tutto o in parte, per manutenzione, aggiornamenti, ragioni tecniche o di sicurezza, ovvero per cause non imputabili al Titolare (es. malfunzionamenti di fornitori terzi, connettività, forza maggiore).</li>
        </ol>
      </Section>

      <Section title="7. Responsabilità dell'Utente sui dati">
        <p>
          L&apos;Utente è responsabile della <strong>correttezza, dell&apos;aggiornamento e della
          liceità</strong> dei dati che inserisce nell&apos;Applicazione, nonché del rispetto della
          normativa sulla protezione dei dati personali nei confronti dei soggetti i cui dati vengono
          trattati (es. clienti).
        </p>
      </Section>

      <Section title="8. Limitazione di responsabilità">
        <p>Nei limiti consentiti dalla legge, il Titolare/Fornitore non è responsabile per:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>danni derivanti da un uso improprio o non autorizzato dell&apos;Applicazione;</li>
          <li>perdita o inesattezza dei dati dovuta a errori di inserimento, malfunzionamenti dei dispositivi dell&apos;Utente o di servizi di terzi;</li>
          <li>interruzioni, indisponibilità o malfunzionamenti non imputabili a propria colpa;</li>
          <li>decisioni operative assunte dall&apos;Utente sulla base dei dati o delle statistiche prodotte dall&apos;Applicazione.</li>
        </ul>
        <p>
          Resta ferma la disciplina inderogabile di legge in materia di responsabilità.
        </p>
      </Section>

      <Section title="9. Trattamento dei dati personali">
        <p>
          Il trattamento dei dati personali nell&apos;ambito dell&apos;Applicazione è disciplinato
          dall&apos;
          <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-700">
            Informativa sulla privacy
          </Link>{' '}
          e dalla{' '}
          <Link href="/cookie-policy" className="underline underline-offset-2 hover:text-slate-700">
            Cookie Policy
          </Link>
          , che costituiscono parte integrante dei presenti Termini.
        </p>
      </Section>

      <Section title="10. Modifiche ai Termini">
        <p>
          Il Titolare si riserva il diritto di modificare i presenti Termini in qualsiasi momento. Le
          modifiche hanno effetto dalla pubblicazione all&apos;interno dell&apos;Applicazione.
          L&apos;uso continuato dopo la pubblicazione costituisce accettazione delle modifiche.
        </p>
      </Section>

      <Section title="11. Legge applicabile e foro competente">
        <p>
          I presenti Termini sono regolati dalla <strong>legge italiana</strong>. Per ogni
          controversia è competente in via esclusiva il Foro di «Città del Titolare», fatte salve le
          disposizioni inderogabili a tutela del consumatore ove applicabili.
        </p>
      </Section>

      <Section title="12. Contatti">
        <p>
          Per comunicazioni relative al <strong>software</strong> (Fornitore): Enea Frontera, persona
          fisica — C.F. «codice fiscale» — «email».
        </p>
        <p>
          Per comunicazioni relative al <strong>trattamento dei dati</strong> (Titolare): il
          panificio ai recapiti indicati nella{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-700">
            Privacy Policy
          </Link>
          .
        </p>
      </Section>
    </LegalLayout>
  )
}
