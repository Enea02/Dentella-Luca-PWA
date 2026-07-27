import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalLayout, Section, Subheading, Table, Note } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy - Panificio',
  description: 'Informativa sul trattamento dei dati personali (artt. 13-14 GDPR)',
}

// Pagina pubblica (raggiungibile pre-login). Contenuto allineato a
// docs/legal/privacy-policy.md. I segnaposto «...» vanno compilati dal Titolare
// prima della pubblicazione definitiva (vedi docs/legal/README.md).
export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Informativa sul trattamento dei dati personali"
      subtitle="ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (“GDPR”) e del D.lgs. 196/2003 come modificato dal D.lgs. 101/2018 (“Codice Privacy”)"
      meta={
        <>
          <strong className="font-medium text-slate-800">Ultimo aggiornamento:</strong> «GG/MM/AAAA»
          <br />
          <strong className="font-medium text-slate-800">Applicazione:</strong> «Nome
          dell&apos;applicazione» — gestionale per panificio (ordini, produzione, clienti,
          statistiche)
        </>
      }
    >
      <Section title="1. Titolare del trattamento">
        <Note>
          Il <strong>Titolare del trattamento</strong> dei dati (clienti, ordini) è il{' '}
          <strong>panificio</strong> che utilizza l&apos;applicazione, i cui dati sono riportati di
          seguito. Il software è sviluppato e fornito a titolo gratuito da Enea Frontera (persona
          fisica), che ne è il semplice <strong>Fornitore</strong> — non il Titolare — e, ove gestisca
          l&apos;infrastruttura per conto del panificio, agisce quale Responsabile del trattamento
          (art. 28 GDPR). Cfr.{' '}
          <Link href="/termini" className="underline underline-offset-2 hover:text-slate-700">
            Termini e Condizioni
          </Link>
          .
        </Note>
        <p>Il Titolare del trattamento è:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>Denominazione / Ditta:</strong> «Ragione sociale del panificio»</li>
          <li><strong>Sede legale:</strong> «Via, numero civico, CAP, Città (Prov.)»</li>
          <li><strong>P. IVA / Codice Fiscale:</strong> «P.IVA / C.F.»</li>
          <li><strong>E-mail:</strong> «email@panificio.it»</li>
          <li><strong>PEC:</strong> «pec@panificio.it» <em>(se disponibile)</em></li>
          <li><strong>Telefono:</strong> «numero di telefono»</li>
        </ul>
        <p>
          Per ogni richiesta relativa al trattamento dei dati personali è possibile scrivere
          all&apos;indirizzo e-mail sopra indicato.
        </p>
        <Subheading>Responsabile della protezione dei dati (DPO)</Subheading>
        <p>
          «Il Titolare non ha nominato un DPO, non sussistendone l&apos;obbligo ai sensi dell&apos;art.
          37 GDPR.» <em>oppure, se nominato:</em> «DPO: nome e contatto».
        </p>
      </Section>

      <Section title="2. Tipologie di dati trattati e categorie di interessati">
        <p>
          L&apos;applicazione è un gestionale ad uso interno del panificio, accessibile
          esclusivamente previa autenticazione. Tratta le seguenti categorie di dati:
        </p>
        <Subheading>a) Utenti/operatori dell&apos;applicazione (amministratore, titolare, personale)</Subheading>
        <ul className="list-disc space-y-1 pl-5">
          <li>Indirizzo e-mail (usato come credenziale di accesso)</li>
          <li>Nome (facoltativo)</li>
          <li>Password in forma di <strong>hash cifrato</strong> (la password in chiaro non viene mai memorizzata)</li>
          <li>Ruolo e permessi all&apos;interno dell&apos;applicazione</li>
          <li>Dati tecnici di sessione e log di accesso</li>
        </ul>
        <Subheading>b) Clienti del panificio</Subheading>
        <ul className="list-disc space-y-1 pl-5">
          <li>Nome / denominazione del cliente</li>
          <li>Tipologia (cliente fisso / occasionale) e stato (attivo/non attivo)</li>
          <li>Dati relativi agli ordini ad essi associati (prodotti, quantità, date, ricorrenze)</li>
        </ul>
        <p>
          L&apos;applicazione <strong>non è progettata per trattare categorie particolari di
          dati</strong> (art. 9 GDPR — dati sulla salute, convinzioni, ecc.) né dati di pagamento. Si
          invita a <strong>non inserire</strong> nei campi liberi (es. nome cliente, varianti
          prodotto) dati eccedenti o categorie particolari di dati personali.
        </p>
      </Section>

      <Section title="3. Finalità e base giuridica del trattamento">
        <Table
          head={['Finalità', 'Base giuridica (art. 6 GDPR)']}
          rows={[
            ['Gestione degli accessi e autenticazione degli operatori', 'Esecuzione di obblighi contrattuali/di lavoro e legittimo interesse del Titolare alla sicurezza del sistema (art. 6.1 lett. b/f)'],
            ['Gestione di ordini, produzione, anagrafica clienti e statistiche interne', 'Legittimo interesse del Titolare alla gestione della propria attività d’impresa e/o esecuzione del rapporto con il cliente (art. 6.1 lett. f/b)'],
            ['Garanzia di sicurezza, integrità e corretto funzionamento del sistema (log)', 'Legittimo interesse del Titolare (art. 6.1 lett. f)'],
            ['Adempimento di obblighi di legge (es. fiscali, contabili, ove applicabili)', 'Obbligo legale (art. 6.1 lett. c)'],
            ['Statistiche di utilizzo aggregate e anonime del sito (Vercel Web Analytics, cookieless)', 'Legittimo interesse del Titolare a misurare l’utilizzo in forma anonima (art. 6.1 lett. f)'],
          ]}
        />
      </Section>

      <Section title="4. Modalità del trattamento">
        <p>
          I dati sono trattati con strumenti elettronici e informatici, con misure tecniche e
          organizzative adeguate a garantirne sicurezza e riservatezza, tra cui:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>accesso all&apos;applicazione protetto da autenticazione con credenziali individuali;</li>
          <li>memorizzazione delle password tramite funzioni di hashing;</li>
          <li>connessioni cifrate (HTTPS/TLS);</li>
          <li>profilazione dei permessi per ruolo (principio del privilegio minimo);</li>
          <li>isolamento dei dati per singolo panificio (multi-tenancy).</li>
        </ul>
        <p>
          Il trattamento non comporta processi decisionali automatizzati o di profilazione che
          producano effetti giuridici sugli interessati (art. 22 GDPR).
        </p>
      </Section>

      <Section title="5. Destinatari e responsabili esterni del trattamento">
        <p>
          Per l&apos;erogazione del servizio il Titolare si avvale di fornitori che agiscono quali{' '}
          <strong>Responsabili del trattamento</strong> (art. 28 GDPR), nominati con apposito
          accordo, ovvero:
        </p>
        <Table
          head={['Fornitore', 'Servizio', 'Trattamento']}
          rows={[
            ['Neon, Inc.', 'Hosting del database PostgreSQL', 'Memorizzazione dei dati dell’applicazione'],
            ['Vercel, Inc.', 'Hosting dell’applicazione e statistiche anonime (Web Analytics cookieless)', 'Erogazione dell’applicazione e misurazione aggregata degli accessi'],
            ['Cloudflare, Inc. (eventuale)', 'Tunnel/infrastruttura di rete (se attivato per il self-hosting)', 'Instradamento del traffico'],
          ]}
        />
        <Note>
          ⚠️ Aggiornare l&apos;elenco in base ai fornitori effettivamente in uso. In caso di
          <strong> self-hosting</strong> del database (es. server locale del panificio), Neon va
          rimosso e va indicata l&apos;infrastruttura effettiva.
        </Note>
        <p>
          I dati possono inoltre essere comunicati a soggetti la cui facoltà di accesso è prevista da
          norme di legge (es. autorità giudiziaria, organi di controllo). I dati <strong>non sono
          diffusi né ceduti a terzi</strong> per finalità di marketing.
        </p>
      </Section>

      <Section title="6. Trasferimento dei dati extra-UE">
        <p>
          Alcuni fornitori (es. Neon, Vercel, Cloudflare) sono società con sede negli Stati Uniti.
          Eventuali trasferimenti di dati al di fuori dello Spazio Economico Europeo avvengono in
          presenza di garanzie adeguate ai sensi degli artt. 44 ss. GDPR, quali le <strong>Clausole
          Contrattuali Tipo</strong> (Standard Contractual Clauses) approvate dalla Commissione
          Europea e/o l&apos;adesione al <strong>Data Privacy Framework UE-USA</strong>, ove
          applicabile. È possibile richiedere copia delle garanzie adottate scrivendo al Titolare.
        </p>
      </Section>

      <Section title="7. Periodo di conservazione">
        <Table
          head={['Dato', 'Conservazione']}
          rows={[
            ['Account operatori', 'Per la durata del rapporto di lavoro/collaborazione; cancellati o anonimizzati alla cessazione, salvo obblighi di legge'],
            ['Anagrafica clienti e ordini', 'Per il tempo necessario alla gestione dell’attività; gli ordini storici sono conservati per finalità gestionali/statistiche e per gli eventuali termini fiscali e civilistici applicabili («es. 10 anni» ove pertinente)'],
            ['Log tecnici e di accesso', '«Indicare periodo, es. 6–12 mesi»'],
            ['Statistiche anonime di utilizzo', 'In forma aggregata e anonima, non riconducibile a singoli interessati'],
          ]}
        />
        <p>
          Al termine dei periodi indicati i dati sono cancellati o resi anonimi in modo irreversibile.
        </p>
      </Section>

      <Section title="8. Diritti degli interessati">
        <p>
          Gli interessati possono esercitare, nei limiti di legge, i seguenti diritti (artt. 15–22
          GDPR):
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>accesso</strong> ai propri dati;</li>
          <li><strong>rettifica</strong> dei dati inesatti;</li>
          <li><strong>cancellazione</strong> (“diritto all&apos;oblio”);</li>
          <li><strong>limitazione</strong> del trattamento;</li>
          <li><strong>portabilità</strong> dei dati;</li>
          <li><strong>opposizione</strong> al trattamento fondato sul legittimo interesse;</li>
          <li><strong>revoca del consenso</strong>, ove il trattamento si fondi sul consenso, senza pregiudizio per la liceità del trattamento effettuato prima della revoca.</li>
        </ul>
        <p>
          Le richieste vanno indirizzate al Titolare ai recapiti indicati al punto 1. Il Titolare
          risponde entro <strong>un mese</strong> dalla ricezione, prorogabile di due mesi in caso di
          particolare complessità.
        </p>
        <Subheading>Reclamo all&apos;Autorità di controllo</Subheading>
        <p>
          L&apos;interessato ha diritto di proporre reclamo al <strong>Garante per la protezione dei
          dati personali</strong> (
          <a
            href="https://www.garanteprivacy.it"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-900 underline underline-offset-2"
          >
            www.garanteprivacy.it
          </a>
          ) qualora ritenga che il trattamento violi il GDPR.
        </p>
      </Section>

      <Section title="9. Conferimento dei dati">
        <p>
          Il conferimento dei dati di account è <strong>necessario</strong> per poter accedere e
          utilizzare l&apos;applicazione: il mancato conferimento rende impossibile l&apos;utilizzo
          del gestionale. Il conferimento dei dati dei clienti è necessario per la gestione degli
          ordini.
        </p>
      </Section>

      <Section title="10. Modifiche all'informativa">
        <p>
          Il Titolare si riserva di modificare o aggiornare la presente informativa, anche in
          conseguenza di variazioni normative o dei servizi utilizzati. La versione aggiornata è
          quella pubblicata all&apos;interno dell&apos;applicazione con la relativa data di “Ultimo
          aggiornamento”.
        </p>
        <p className="text-slate-500">
          Vedi anche la{' '}
          <Link href="/cookie-policy" className="underline underline-offset-2 hover:text-slate-700">
            Cookie Policy
          </Link>{' '}
          e i{' '}
          <Link href="/termini" className="underline underline-offset-2 hover:text-slate-700">
            Termini e Condizioni
          </Link>
          .
        </p>
      </Section>
    </LegalLayout>
  )
}
