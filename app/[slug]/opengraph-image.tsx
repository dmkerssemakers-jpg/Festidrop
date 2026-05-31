import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

// Prisma needs the Node runtime (not edge)
export const runtime = 'nodejs';

export const alt = 'FestiDrop — maak gratis polaroids op je event';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let name   = 'FestiDrop';
  let accent = '#1E8BFF';

  try {
    const event = await prisma.event.findUnique({
      where:  { slug },
      select: { name: true, accentColor: true },
    });
    if (event) {
      name   = event.name;
      accent = event.accentColor || accent;
    }
  } catch {
    /* fall back to defaults */
  }

  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#07162F',
          color: '#ffffff',
          padding: '72px',
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background: `radial-gradient(circle at 80% 16%, ${accent}55, transparent 58%)`,
          }}
        />

        {/* Brand */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${accent}, ${accent}AA)`,
            }}
          >
            {/* CSS diamond brand mark — no font glyph dependency */}
            <div style={{ display: 'flex', width: 22, height: 22, borderRadius: 5, background: '#ffffff', transform: 'rotate(45deg)' }} />
          </div>
          <div style={{ display: 'flex', fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>
            FestiDrop
          </div>
        </div>

        {/* Spacer */}
        <div style={{ display: 'flex', flex: 1 }} />

        {/* Kicker */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ display: 'flex', width: 40, height: 6, borderRadius: 3, background: accent }} />
          <div style={{ display: 'flex', fontSize: 24, color: '#AFC2D9', letterSpacing: '0.2em' }}>
            LIVE EVENT
          </div>
        </div>

        {/* Event name */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            fontSize: name.length > 22 ? 76 : 104,
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: '-0.04em',
            maxWidth: 1010,
          }}
        >
          {name}
        </div>

        {/* Subtitle */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            marginTop: 28,
            fontSize: 34,
            color: 'rgba(255,255,255,0.72)',
          }}
        >
          Maak gratis polaroids en ontvang ze direct per e-mail
        </div>

        {/* URL pill */}
        <div style={{ position: 'relative', display: 'flex', marginTop: 46 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 28px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.16)',
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            <div style={{ display: 'flex', width: 12, height: 12, borderRadius: 6, background: accent }} />
            festidrop.nl/{slug}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
