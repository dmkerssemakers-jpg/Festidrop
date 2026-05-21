import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function AdminDashboard() {
  const [totalEvents, totalDrops, recentDrops, activeEvents] = await Promise.all([
    prisma.event.count(),
    prisma.drop.count(),
    prisma.drop.findMany({
      take: 5,
      orderBy: { sentAt: 'desc' },
      include: { event: { select: { name: true } } },
    }),
    prisma.event.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: { _count: { select: { drops: true } } },
    }),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-navy" style={{ letterSpacing: '-0.03em' }}>
          Dashboard
        </h1>
        <p className="text-sm text-muted mt-1">Overzicht van al jouw FestiDrop events</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard label="Totaal events" value={totalEvents} icon="◈" color="#1E8BFF" />
        <StatCard label="Drops verstuurd" value={totalDrops} icon="📸" color="#20D6E8" />
      </div>

      {/* Actieve events */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black uppercase tracking-[0.1em] text-muted">Actieve events</h2>
          <Link href="/admin/events/new" className="text-xs font-bold text-azure hover:underline">
            + Nieuw event
          </Link>
        </div>

        {activeEvents.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-3">
            {activeEvents.map((event) => (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="flex items-center justify-between rounded-2xl px-5 py-4 transition-all hover:scale-[1.01]"
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(189,239,255,0.55)',
                  boxShadow: '0 4px 16px rgba(7,22,47,0.06)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: event.accentColor }}
                  />
                  <div>
                    <p className="text-sm font-bold text-navy">{event.name}</p>
                    <p className="text-xs text-muted">/{event.slug}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-navy">{event._count.drops}</p>
                  <p className="text-[10px] text-muted">drops</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recente drops */}
      {recentDrops.length > 0 && (
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.1em] text-muted mb-4">Recente drops</h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(189,239,255,0.55)',
            }}
          >
            {recentDrops.map((drop, i) => (
              <div
                key={drop.id}
                className="flex items-center justify-between px-5 py-3"
                style={{ borderTop: i > 0 ? '1px solid rgba(189,239,255,0.3)' : undefined }}
              >
                <div>
                  <p className="text-sm font-semibold text-navy">{drop.email}</p>
                  <p className="text-xs text-muted">{drop.event.name}</p>
                </div>
                <p className="text-xs text-muted">
                  {new Date(drop.sentAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.85)',
        border: '1px solid rgba(189,239,255,0.55)',
        boxShadow: '0 4px 16px rgba(7,22,47,0.06)',
      }}
    >
      <p style={{ fontSize: '22px' }}>{icon}</p>
      <p className="text-3xl font-black mt-2" style={{ color, letterSpacing: '-0.03em' }}>
        {value}
      </p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-2xl p-8 text-center"
      style={{
        background: 'rgba(255,255,255,0.85)',
        border: '1px solid rgba(189,239,255,0.55)',
      }}
    >
      <p className="text-3xl mb-3">◈</p>
      <p className="text-sm font-bold text-navy mb-1">Nog geen events</p>
      <p className="text-xs text-muted mb-4">Maak je eerste event aan om te beginnen</p>
      <Link
        href="/admin/events/new"
        className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)' }}
      >
        + Nieuw event
      </Link>
    </div>
  );
}
