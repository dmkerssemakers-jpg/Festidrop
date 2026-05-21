import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BackgroundPattern from '@/components/BackgroundPattern';
import Header from '@/components/Header';
import EventSubHeader from '@/components/EventSubHeader';
import EventPhotoSession from '@/components/EventPhotoSession';

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug, isActive: true },
  });

  if (!event) notFound();

  return (
    <main className="min-h-screen bg-page relative">
      <BackgroundPattern accentColor={event.accentColor} />

      {/* FestiDrop header — altijd zichtbaar */}
      <Header />

      {/* Event sub-header — onder FestiDrop logo, alleen als event naam/logo is ingesteld */}
      <EventSubHeader
        name={event.name}
        logoUrl={event.logoUrl}
        accentColor={event.accentColor}
      />

      {/* Extra padding voor de dubbele header */}
      <EventPhotoSession
        eventId={event.id}
        eventName={event.name}
        accentColor={event.accentColor}
        maxPhotos={event.maxPhotos}
        slug={slug}
        logoUrl={event.logoUrl}
        hasSubHeader
      />
    </main>
  );
}
