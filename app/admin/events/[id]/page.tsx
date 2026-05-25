import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import EventForm from '@/components/admin/EventForm';
import EventStats from '@/components/admin/EventStats';
import WhitelistManager from '@/components/admin/WhitelistManager';
import QrCodeCard from '@/components/admin/QrCodeCard';
import DuplicateEventButton from '@/components/admin/DuplicateEventButton';
import type { DayData } from '@/components/admin/DashboardChart';

export const revalidate = 30;

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const start7Days = new Date();
  start7Days.setDate(start7Days.getDate() - 6);
  start7Days.setHours(0, 0, 0, 0);

  const [event, drops, chartDrops, clients] = await Promise.all([
    prisma.event.findUnique({ where: { id }, include: { whitelist: true, client: { select: { id: true, name: true } } } }),
    prisma.drop.findMany({
      where:   { eventId: id },
      orderBy: { sentAt: 'desc' },
      take:    100,
    }),
    prisma.drop.findMany({
      where:  { eventId: id, sentAt: { gte: start7Days } },
      select: { sentAt: true },
    }),
    prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  if (!event) notFound();

  // Build 7-day chart data for this event
  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start7Days);
    d.setDate(start7Days.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const chartData: DayData[] = dayLabels.map(day => ({
    label: new Date(`${day}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short' }),
    count: (chartDrops as Array<{ sentAt: Date }>).filter(
      (d: { sentAt: Date }) => new Date(d.sentAt).toISOString().slice(0, 10) === day,
    ).length,
  }));

  const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://festidrop.vercel.app';
  const eventUrl = `${baseUrl}/${event.slug}`;

  // Serialize drops (Date → ISO string) for client component
  type RawDrop = (typeof drops)[number];
  const serializedDrops = drops.map((d: RawDrop) => ({
    id:      d.id,
    email:   d.email,
    sentAt:  d.sentAt.toISOString(),
    eventId: d.eventId,
  }));

  return (
    <div>
      {/* ── Hero header ──────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 mb-8 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${event.accentColor}18 0%, ${event.accentColor}06 100%)`,
          border:     `1px solid ${event.accentColor}30`,
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: `${event.accentColor}20` }}
        />

        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-navy transition-colors mb-4"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Alle events
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${event.accentColor}, ${event.accentColor}AA)`,
                boxShadow:  `0 6px 20px ${event.accentColor}40`,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="5" width="16" height="11" rx="2.5" stroke="white" strokeWidth="1.5"/>
                <circle cx="9" cy="10.5" r="3" stroke="white" strokeWidth="1.5"/>
                <path d="M6 5V4A1 1 0 017 3h4a1 1 0 011 1v1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h1 className="text-2xl font-black text-navy" style={{ letterSpacing: '-0.03em' }}>
                  {event.name}
                </h1>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={event.isActive
                    ? { background: 'rgba(0,200,150,0.12)', color: '#00A878' }
                    : { background: 'rgba(108,122,141,0.12)', color: '#6C7A8D' }
                  }
                >
                  {event.isActive ? '● actief' : '○ inactief'}
                </span>
                {event.client && (
                  <a
                    href={`/admin/clients/${event.client.id}`}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-opacity hover:opacity-70"
                    style={{ background: 'rgba(30,139,255,0.10)', color: '#1E8BFF' }}
                  >
                    ↗ {event.client.name}
                  </a>
                )}
              </div>
              <p className="text-xs text-muted font-medium">{eventUrl}</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/admin/events/${event.id}/designer`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${event.accentColor}, ${event.accentColor}BB)`,
                boxShadow:  `0 4px 14px ${event.accentColor}35`,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="1" width="10" height="10" rx="2" stroke="white" strokeWidth="1.2"/>
                <rect x="2.5" y="2.5" width="7" height="5.5" rx="0.8" stroke="white" strokeWidth="1"/>
                <path d="M4 10h4" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Designer
            </Link>

            <a
              href={`/api/admin/events/${event.id}/export-drops`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-navy transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(189,239,255,0.5)' }}
              title="Download alle drops als CSV"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export CSV
            </a>

            <a
              href={`/api/admin/events/${event.id}/export-drops?marketing=1`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{ background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)', color: '#007A5E' }}
              title="Download alleen e-mails met marketing opt-in"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Marketing
            </a>

            <DuplicateEventButton eventId={event.id} />

            <a
              href={eventUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-navy transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(189,239,255,0.5)' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7M8 1h3m0 0v3m0-3L5 6"
                  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Open event
            </a>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: `1px solid ${event.accentColor}20` }}>
          <span className="text-xs text-muted">
            <span className="font-bold text-navy">{drops.length}</span> drops
          </span>
          <span className="text-xs text-muted">
            <span className="font-bold text-navy">
              {new Set(drops.map((d: { email: string }) => d.email)).size}
            </span> unieke e-mails
          </span>
          <span className="text-xs text-muted">
            Max <span className="font-bold text-navy">{event.maxPhotos}</span> foto&apos;s per sessie
          </span>
          <span className="text-xs text-muted ml-auto">
            Aangemaakt {new Date(event.createdAt).toLocaleDateString('nl-NL', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
        </div>

        {/* Internal notes */}
        {event.notes && (
          <div
            className="mt-3 pt-3 flex items-start gap-2"
            style={{ borderTop: `1px solid ${event.accentColor}20` }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0 mt-0.5">
              <rect x="1" y="1" width="11" height="11" rx="2" stroke="#6C7A8D" strokeWidth="1.2"/>
              <path d="M3.5 4.5h6M3.5 6.5h6M3.5 8.5h3.5" stroke="#6C7A8D" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <p className="text-xs text-muted leading-relaxed">{event.notes}</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <EventStats
            drops={serializedDrops}
            totalDrops={drops.length}
            accentColor={event.accentColor}
            chartData={chartData}
          />
          <EventForm event={event} eventUrl={eventUrl} clients={clients} />
        </div>

        <div className="space-y-6">
          <QrCodeCard slug={event.slug} baseUrl={baseUrl} accentColor={event.accentColor} />
          <WhitelistManager eventId={event.id} whitelist={event.whitelist} />
        </div>
      </div>
    </div>
  );
}
