export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#F0F5FF', fontFamily: 'Inter, sans-serif', padding: '48px 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <a href="/" style={{ fontSize: 12, fontWeight: 700, color: '#6C7A8D', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
            ← Terug
          </a>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#07162F', letterSpacing: '-0.03em', margin: '0 0 8px' }}>
            Privacybeleid
          </h1>
          <p style={{ fontSize: 14, color: '#6C7A8D', margin: 0 }}>Laatst bijgewerkt: mei 2025</p>
        </div>

        {/* Content */}
        <div style={{ background: 'white', borderRadius: 20, padding: '40px 48px', boxShadow: '0 4px 24px rgba(7,22,47,0.06)', border: '1px solid rgba(189,239,255,0.55)', lineHeight: 1.8, color: '#374151', fontSize: 15 }}>

          <Section title="Wie zijn wij?">
            FestiDrop is een dienst waarmee festivalbezoekers polaroidfoto&apos;s kunnen ontvangen via e-mail.
            De dienst wordt aangeboden door FestiDrop.
          </Section>

          <Section title="Welke gegevens verzamelen we?">
            <p>Bij het gebruik van FestiDrop verzamelen we de volgende gegevens:</p>
            <ul>
              <li><strong>E-mailadres</strong> — om je foto&apos;s naar toe te sturen.</li>
              <li><strong>Foto&apos;s</strong> — de polaroidfoto&apos;s die je bij de fotobooth hebt gemaakt.</li>
              <li><strong>Tijdstip van de drop</strong> — wanneer je foto&apos;s zijn verzonden.</li>
            </ul>
            <p>We verzamelen geen naam, telefoonnummer, locatiedata of andere persoonsgegevens.</p>
          </Section>

          <Section title="Waarvoor gebruiken we je gegevens?">
            <ul>
              <li>Het versturen van je foto&apos;s per e-mail.</li>
              <li>Het beschikbaar stellen van jouw persoonlijke filmrol-pagina voor 30 dagen.</li>
              <li>Het bijhouden van statistieken over het aantal drops per event (geanonimiseerd).</li>
            </ul>
            <p>We verkopen, verhuren of delen je gegevens <strong>nooit</strong> met derden voor marketingdoeleinden.</p>
          </Section>

          <Section title="Hoe lang bewaren we je gegevens?">
            <ul>
              <li><strong>Foto&apos;s</strong> — worden 30 dagen bewaard in onze opslag. Daarna worden ze automatisch verwijderd.</li>
              <li><strong>E-mailadres + tijdstip</strong> — worden bewaard voor statistische doeleinden. Je kunt verwijdering aanvragen (zie hieronder).</li>
            </ul>
            <p>De foto&apos;s die je per e-mail hebt ontvangen, staan in jouw inbox. Daar hebben wij geen invloed op.</p>
          </Section>

          <Section title="Je rechten">
            <p>Op grond van de AVG (GDPR) heb je recht op:</p>
            <ul>
              <li><strong>Inzage</strong> — opvragen welke gegevens we van je hebben.</li>
              <li><strong>Verwijdering</strong> — verzoeken dat je gegevens worden verwijderd.</li>
              <li><strong>Bezwaar</strong> — bezwaar maken tegen de verwerking van je gegevens.</li>
            </ul>
            <p>
              Stuur een e-mail naar <a href="mailto:info@festidrop.nl" style={{ color: '#1E8BFF' }}>info@festidrop.nl</a> voor het uitoefenen van je rechten.
              We reageren binnen 30 dagen.
            </p>
          </Section>

          <Section title="Derden">
            <p>Voor het leveren van onze dienst maken we gebruik van:</p>
            <ul>
              <li><strong>Resend</strong> — voor het verzenden van e-mails. <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#1E8BFF' }}>Privacybeleid Resend</a></li>
              <li><strong>Vercel</strong> — voor hosting en opslag van foto&apos;s. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#1E8BFF' }}>Privacybeleid Vercel</a></li>
            </ul>
            <p>Al onze verwerkers zijn AVG-compliant en verwerken data binnen de EER of met adequate waarborgen.</p>
          </Section>

          <Section title="Contact">
            <p>
              Vragen over dit privacybeleid? Neem contact op via{' '}
              <a href="mailto:info@festidrop.nl" style={{ color: '#1E8BFF' }}>info@festidrop.nl</a>.
            </p>
          </Section>

        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#07162F', letterSpacing: '-0.02em', margin: '0 0 12px' }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.8 }}>
        {children}
      </div>
      <hr style={{ margin: '32px 0 0', border: 'none', borderTop: '1px solid rgba(189,239,255,0.5)' }} />
    </div>
  );
}
