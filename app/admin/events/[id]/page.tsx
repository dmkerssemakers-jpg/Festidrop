import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EventForm from '@/components/admin/EventForm';
import EventStats from '@/components/admin/EventStats';
import WhitelistManager from '@/components/admin/WhitelistManager';
import QrCodeCard from '@/components/admin/QrCodeCard';

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [event, drops] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: { whitelist: true },
    }),
    prisma.drop.findMany({
      where: { eventId: id },
      orderBy: { sentAt: 'desc' },
      take: 50,
    }),
  ]);

  if (!event) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://festidrop.vercel.app';

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-3 h-3 rounded-full" style={{ background: event.accentColor }} />
          <h1 className="text-2xl font-black text-navy" style={{ letterSpacing: '-0.03em' }}>
            {event.name}
          </h1>
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={event.isActive
              ? { background: 'rgba(30,139,255,0.12)', color: '#1E8BFF' }
              : { background: 'rgba(108,122,141,0.12)', color: '#6C7A8D' }
            }
          >
            {event.isActive ? 'actief' : 'inactief'}
          </span>
        </div>
        <p className="text-sm text-muted">{baseUrl}/{event.slug}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left column */}
        <div className="space-y-6">
          <EventStats drops={drops} totalDrops={drops.length} />
          <EventForm event={event} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <QrCodeCard slug={event.slug} baseUrl={baseUrl} accentColor={event.accentColor} />
          <WhitelistManager eventId={event.id} whitelist={event.whitelist} />
        </div>
      </div>
    </div>
  );
}
