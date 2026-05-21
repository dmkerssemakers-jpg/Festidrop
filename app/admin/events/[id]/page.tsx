import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
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
  const eventUrl = `${baseUrl}/${event.slug}`;

  return (
    <div>
      {/* ── Hero header ───────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 mb-8 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${event.accentColor}18 0%, ${event.accentColor}06 100%)`,
          border: `1px solid ${event.accentColor}30`,
        }}
      >
        {/* Decorative glow blob */}
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: `${event.accentColor}20` }}
        />

        {/* Back link */}
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
            {/* Color dot */}
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${event.accentColor}, ${event.accentColor}AA)`,
                boxShadow: `0 6px 20px ${event.accentColor}40`,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="5" width="16" height="11" rx="2.5" stroke="white" strokeWidth="1.5"/>
                <circle cx="9" cy="10.5" r="3" stroke="white" strokeWidth="1.5"/>
                <path d="M6 5V4A1 1 0 017 3h4a1 1 0 011 1v1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-0.5">
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
              </div>
              <p className="text-xs text-muted font-medium">{eventUrl}</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={eventUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-navy transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(189,239,255,0.5)' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7M8 1h3m0 0v3m0-3L5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Open event
            </a>
          </div>
        </div>

        {/* Mini meta row */}
        <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: `1px solid ${event.accentColor}20` }}>
          <span className="text-xs text-muted">
            <span className="font-bold text-navy">{drops.length}</span> drops
          </span>
          <span className="text-xs text-muted">
            <span className="font-bold text-navy">{new Set(drops.map(d => d.email)).size}</span> unieke e-mails
          </span>
          <span className="text-xs text-muted">
            Max <span className="font-bold text-navy">{event.maxPhotos}</span> foto's per sessie
          </span>
          <span className="text-xs text-muted ml-auto">
            Aangemaakt {new Date(event.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left column */}
        <div className="space-y-6">
          <EventStats drops={drops} totalDrops={drops.length} accentColor={event.accentColor} />
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
