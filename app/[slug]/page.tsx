import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BackgroundPattern from '@/components/BackgroundPattern';
import Header from '@/components/Header';
import EventPhotoSession from '@/components/EventPhotoSession';

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug, isActive: true },
  });

  if (!event) notFound();

  return (
    <main className="min-h-screen relative" style={{ backgroundColor: '#F7FBFF' }}>
      {/* Subtle page color tint in event accent */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{ background: `${event.accentColor}06` }}
      />
      <BackgroundPattern accentColor={event.accentColor} />

      {/* FestiDrop header */}
      <Header />

      {/* Event branding is now inside the camera card — no sub-header clutter */}
      <EventPhotoSession
        eventId={event.id}
        eventName={event.name}
        accentColor={event.accentColor}
        maxPhotos={event.maxPhotos}
        slug={slug}
        logoUrl={event.logoUrl}
      />
    </main>
  );
}
