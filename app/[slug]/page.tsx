import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BackgroundPattern from '@/components/BackgroundPattern';
import Header from '@/components/Header';
import EventPhotoSession from '@/components/EventPhotoSession';
import EventSplash from '@/components/EventSplash';
import AccessGate from '@/components/AccessGate';
import { parseDesign } from '@/lib/polaroid-design';

export const revalidate = 60;

// Deduplicate the Prisma call — both generateMetadata and EventPage share this
const getEvent = cache((slug: string) =>
  prisma.event.findUnique({ where: { slug } })
);

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event || !event.isActive) return {};

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://festidrop.vercel.app';
  const title   = `${event.name} — FestiDrop`;
  const desc    = 'Maak gratis polaroid-foto\'s en ontvang ze direct per e-mail. 📸';

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url:         `${baseUrl}/${slug}`,
      siteName:    'FestiDrop',
      type:        'website',
    },
    twitter: {
      card:        'summary',
      title,
      description: desc,
    },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const event = await getEvent(slug);

  if (!event || !event.isActive) notFound();

  // Auto-deactivate: if endsAt has passed, treat as ended
  if (event.endsAt && new Date(event.endsAt) < new Date()) {
    return (
      <main className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: '#F7FBFF' }}>
        <BackgroundPattern accentColor={event.accentColor} />
        <div
          className="relative rounded-[28px] p-10 text-center max-w-sm w-full"
          style={{
            background: 'rgba(255,255,255,0.9)',
            border:     `1px solid ${event.accentColor}30`,
            boxShadow:  '0 24px 80px rgba(7,22,47,0.08)',
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: `${event.accentColor}15` }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke={event.accentColor} strokeWidth="1.6"/>
              <path d="M12 7v5l3 3" stroke={event.accentColor} strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-black mb-2" style={{ color: '#07162F', letterSpacing: '-0.03em' }}>
            {event.name}
          </h1>
          <p className="text-sm" style={{ color: '#6C7A8D' }}>
            Dit event is afgelopen. Tot de volgende editie! 🎉
          </p>
        </div>
      </main>
    );
  }

  const content = (
    <main className="min-h-screen relative" style={{ backgroundColor: '#F7FBFF' }}>
      {/* Subtle page tint in event accent */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{ background: `${event.accentColor}06` }}
      />
      <BackgroundPattern accentColor={event.accentColor} />

      {/* Branded splash — shows once per session */}
      <EventSplash
        slug={slug}
        accentColor={event.accentColor}
        eventName={event.name}
        logoUrl={event.logoUrl ?? undefined}
      />

      {/* FestiDrop header */}
      <Header />

      {/* Camera */}
      <EventPhotoSession
        eventId={event.id}
        eventName={event.name}
        accentColor={event.accentColor}
        maxPhotos={event.maxPhotos}
        slug={slug}
        logoUrl={event.logoUrl}
        design={parseDesign(event.designConfig)}
      />
    </main>
  );

  // If access code is set, wrap in the gate
  if (event.accessCode) {
    return (
      <AccessGate
        slug={slug}
        accessCode={event.accessCode}
        accentColor={event.accentColor}
        eventName={event.name}
      >
        {content}
      </AccessGate>
    );
  }

  return content;
}
