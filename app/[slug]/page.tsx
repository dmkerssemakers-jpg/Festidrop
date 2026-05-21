import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BackgroundPattern from '@/components/BackgroundPattern';
import EventHeader from '@/components/EventHeader';
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
      <EventHeader
        name={event.name}
        logoUrl={event.logoUrl}
        accentColor={event.accentColor}
      />
      <EventPhotoSession
        eventId={event.id}
        eventName={event.name}
        accentColor={event.accentColor}
        maxPhotos={event.maxPhotos}
        slug={slug}
      />
    </main>
  );
}
