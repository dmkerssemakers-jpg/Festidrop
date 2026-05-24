import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import GalleryView from '@/components/GalleryView';

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { slug }  = await params;
  const { email } = await searchParams;

  const event = await prisma.event.findUnique({
    where:  { slug },
    select: { id: true, name: true, logoUrl: true, accentColor: true, slug: true },
  });
  if (!event) notFound();

  /* ── Email not provided → show entry form ── */
  if (!email) {
    return (
      <div style={{ minHeight: '100vh', background: '#07162F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          {/* Logo / event */}
          <div style={{ marginBottom: 32 }}>
            {event.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.logoUrl} alt={event.name} style={{ height: 40, objectFit: 'contain', marginBottom: 16 }} />
            ) : (
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎞️</div>
            )}
            <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>
              Jouw <span style={{ color: event.accentColor }}>filmrol</span>
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(189,239,255,0.5)' }}>{event.name}</p>
          </div>

          {/* Form */}
          <form
            action={`/gallery/${slug}`}
            method="GET"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <input
              name="email"
              type="email"
              required
              placeholder="jouw@email.nl"
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '14px 16px', borderRadius: 14, fontSize: 15,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(189,239,255,0.15)',
                color: 'white', outline: 'none', textAlign: 'center',
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%', padding: '14px', borderRadius: 14,
                fontSize: 14, fontWeight: 800, border: 'none',
                background: event.accentColor, color: 'white',
                cursor: 'pointer', letterSpacing: '-0.01em',
              }}
            >
              Bekijk mijn foto&#39;s →
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: 11, color: 'rgba(189,239,255,0.3)', lineHeight: 1.7 }}>
            Voer het e-mailadres in dat je bij de fotobooth hebt gebruikt.<br />
            Foto&#39;s zijn 30 dagen beschikbaar.
          </p>
        </div>
      </div>
    );
  }

  /* ── Email provided → load photos ── */
  const drops = await prisma.drop.findMany({
    where:   { eventId: event.id, email: email.trim().toLowerCase() },
    include: { photos: { orderBy: { order: 'asc' } } },
    orderBy: { sentAt: 'asc' },
  });

  type DropWithPhotos = (typeof drops)[number];
  const photos       = drops.flatMap((d: DropWithPhotos) => d.photos);
  const oldestSentAt = drops[0]?.sentAt?.toISOString() ?? null;

  return <GalleryView event={event} photos={photos} email={email.trim().toLowerCase()} oldestSentAt={oldestSentAt} />;
}
