import { prisma } from '@/lib/prisma';
import SendPageClient from '@/components/SendPageClient';

export default async function EventSendPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug },
    select: { name: true, accentColor: true, logoUrl: true },
  });

  return (
    <SendPageClient
      slug={slug}
      accentColor={event?.accentColor ?? '#1E8BFF'}
      eventName={event?.name ?? undefined}
      logoUrl={event?.logoUrl ?? undefined}
    />
  );
}
