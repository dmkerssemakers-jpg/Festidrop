import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { drops: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-navy" style={{ letterSpacing: '-0.03em' }}>
            Events
          </h1>
          <p className="text-sm text-muted mt-1">{events.length} event{events.length !== 1 ? 's' : ''} totaal</p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)', boxShadow: '0 8px 24px rgba(30,139,255,0.25)' }}
        >
          + Nieuw event
        </Link>
      </div>

      {events.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)' }}
        >
          <p className="text-4xl mb-3">◈</p>
          <p className="text-base font-bold text-navy mb-1">Nog geen events</p>
          <p className="text-sm text-muted mb-5">Maak je eerste event aan</p>
          <Link
            href="/admin/events/new"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)' }}
          >
            + Nieuw event
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-4 rounded-2xl px-5 py-4"
              style={{
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(189,239,255,0.55)',
                boxShadow: '0 4px 16px rgba(7,22,47,0.06)',
              }}
            >
              {/* Color dot */}
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{ background: event.accentColor }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-navy">{event.name}</p>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={event.isActive
                      ? { background: 'rgba(30,139,255,0.12)', color: '#1E8BFF' }
                      : { background: 'rgba(108,122,141,0.12)', color: '#6C7A8D' }
                    }
                  >
                    {event.isActive ? 'actief' : 'inactief'}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  festidrop.vercel.app/{event.slug} · {event._count.drops} drops
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/${event.slug}`}
                  target="_blank"
                  className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ background: 'rgba(189,239,255,0.3)', color: '#07162F' }}
                >
                  Open ↗
                </Link>
                <Link
                  href={`/admin/events/${event.id}`}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-80"
                  style={{ background: '#07162F' }}
                >
                  Beheren
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
