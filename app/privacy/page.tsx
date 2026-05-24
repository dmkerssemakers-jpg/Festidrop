export const metadata = {
  title: 'Privacybeleid — FestiDrop',
  description: 'Hoe FestiDrop omgaat met jouw foto\'s en e-mailadres.',
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#07162F', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 24px 80px' }}>

        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(189,239,255,0.4)', textDecoration: 'none', fontSize: 13, fontWeight: 600, marginBottom: 40 }}>
          ← Terug
        </a>

        <h1 style={{ margin: '0 0 8px', fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
          Privacybeleid
        </h1>
        <p style={{ margin: '0 0 48px', fontSize: 14, color: 'rgba(189,239,255,0.35)' }}>
          Laatst bijgewerkt: mei 2026
        </p>

        <Section title="Wie zijn wij?">
          FestiDrop is een dienst waarmee festivalbezoekers polaroidfoto&apos;s kunnen ontvangen via e-mail.
          De dienst wordt aangeboden door FestiDrop, bereikbaar via{' '}
          <a href="mailto:info@festidrop.nl" style={{ color: '#1E8BFF' }}>info@festidrop.nl</a>.
        </Section>

        <Section title="Welke gegevens verzamelen we?">
          <p>Bij het gebruik van FestiDrop verzamelen we de volgende gegevens:</p>
          <ul>
            <li><strong>E-mailadres</strong> — om je foto&apos;s naar toe te sturen.</li>
            <li><strong>Foto&apos;s</strong> — de polaroidfoto&apos;s die je bij de fotobooth hebt gemaakt.</li>
            <li><strong>Tijdstip van de drop</strong> — wanneer je foto&apos;s zijn verzonden.</li>
          </ul>
          <p>We verzamelen geen naam, telefoonnummer, locatiedata of andere persoonsgegevens. Er worden geen cookies of trackingscripts gebruikt.</p>
        </Section>

        <Section title="Waarvoor gebruiken we je gegevens?">
          <ul>
            <li>Het versturen van je foto&apos;s per e-mail.</li>
            <li>Het beschikbaar stellen van jouw persoonlijke filmrol-pagina voor 30 dagen.</li>
            <li>Het sturen van een herinnering (op dag 25) dat je foto&apos;s bijna verdwijnen.</li>
            <li>Het bijhouden van statistieken over het aantal drops per event (geanonimiseerd).</li>
          </ul>
          <p>We verkopen, verhuren of delen je gegevens <strong>nooit</strong> met derden voor marketingdoeleinden.</p>
        </Section>

        <Section title="Hoe lang bewaren we je gegevens?">
          <ul>
            <li><strong>Foto&apos;s</strong> — worden <strong>30 dagen</strong> bewaard in onze opslag. Daarna worden ze automatisch verwijderd.</li>
            <li><strong>E-mailadres + tijdstip</strong> — worden bewaard voor statistische doeleinden. Je kunt verwijdering aanvragen (zie hieronder).</li>
          </ul>
          <p>De foto&apos;s die je per e-mail hebt ontvangen, staan in jouw inbox. Daar hebben wij geen invloed op.</p>
        </Section>

        <Section title="Toestemming">
          <p>
            Je geeft uitdrukkelijk toestemming voor de opslag van je foto&apos;s door bij het invullen van je
            e-mailadres het vakje &ldquo;Ik ga akkoord dat mijn foto&apos;s 30 dagen worden bewaard voor mijn
            persoonlijke filmrol&rdquo; aan te vinken. Zonder toestemming wordt de drop niet verwerkt.
          </p>
        </Section>

        <Section title="Je rechten">
          <p>Op grond van de AVG (GDPR) heb je recht op:</p>
          <ul>
            <li><strong>Inzage</strong> — opvragen welke gegevens we van je hebben.</li>
            <li><strong>Correctie</strong> — onjuiste gegevens laten aanpassen.</li>
            <li><strong>Verwijdering</strong> — verzoeken dat je gegevens worden verwijderd (&ldquo;recht op vergetelheid&rdquo;).</li>
            <li><strong>Bezwaar</strong> — bezwaar maken tegen de verwerking van je gegevens.</li>
          </ul>
          <p>
            Stuur een e-mail naar <a href="mailto:info@festidrop.nl" style={{ color: '#1E8BFF' }}>info@festidrop.nl</a> voor het uitoefenen van je rechten.
            We reageren binnen 30 dagen.
          </p>
        </Section>

        <Section title="Derden (verwerkers)">
          <p>Voor het leveren van onze dienst maken we gebruik van:</p>
          <ul>
            <li><strong>Resend</strong> — voor het verzenden van e-mails.{' '}
              <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#1E8BFF' }}>Privacybeleid Resend</a>
            </li>
            <li><strong>Vercel</strong> — voor hosting en opslag van foto&apos;s.{' '}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#1E8BFF' }}>Privacybeleid Vercel</a>
            </li>
          </ul>
          <p>Al onze verwerkers zijn AVG-compliant en verwerken data binnen de EER of met adequate waarborgen.</p>
        </Section>

        <Section title="Contact & klachten">
          <p>
            Vragen over dit privacybeleid? Neem contact op via{' '}
            <a href="mailto:info@festidrop.nl" style={{ color: '#1E8BFF' }}>info@festidrop.nl</a>.
          </p>
          <p>
            Je kunt ook een klacht indienen bij de{' '}
            <a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" style={{ color: '#1E8BFF' }}>
              Autoriteit Persoonsgegevens
            </a>.
          </p>
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, color: 'rgba(189,239,255,0.65)', lineHeight: 1.8 }}>
        {children}
      </div>
      <hr style={{ margin: '40px 0 0', border: 'none', borderTop: '1px solid rgba(189,239,255,0.07)' }} />
    </section>
  );
}
