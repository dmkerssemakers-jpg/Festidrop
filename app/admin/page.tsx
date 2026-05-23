import { prisma } from '@/lib/prisma';
import type { Event, Drop } from '@prisma/client';
import Link from 'next/link';
import CopyLinkButton from '@/components/admin/CopyLinkButton';
import DashboardChart from '@/components/admin/DashboardChart';

// ISR: rebuild every 60 seconds so stats stay fresh without hitting DB on every request
export const revalidate = 60;

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Returns trend percentage and label, or null when no meaningful comparison exists. */
function calcTrend(
  current: number,
  prev: number,
  label = 'vs vorige periode',
): { pct: number; label: string } | null {
  if (prev === 0 && current === 0) return null;
  if (prev === 0) return { pct: 100, label };
  return { pct: Math.round(((current - prev) / prev) * 100), label };
}

/** Human-readable relative time in Dutch. */
function relativeTime(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (mins < 1)  return 'zojuist';
  if (mins < 60) return `${mins} min geleden`;
  const h = Math.floor(mins / 60);
  if (h < 24)    return `${h}u geleden`;
  return `${Math.floor(h / 24)}d geleden`;
}

/** Masks email for privacy: dm.kerssemakers@gmail.com → dm.k***@gmail.com */
function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at < 0) return email;
  const local  = email.slice(0, at);
  const domain = email.slice(at);
  const keep   = Math.min(4, local.length);
  return `${local.slice(0, keep)}***${domain}`;
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default async function AdminDashboard() {
  const now          = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Period boundaries
  const startYesterday = new Date(startOfToday); startYesterday.setDate(startOfToday.getDate() - 1);
  const start7Days     = new Date(startOfToday); start7Days.setDate(startOfToday.getDate() - 6);
  const endPrev7       = new Date(startOfToday); endPrev7.setDate(startOfToday.getDate() - 7);
  const start14Days    = new Date(startOfToday); start14Days.setDate(startOfToday.getDate() - 13);

  const [
    totalEvents,
    totalDrops,
    dropsToday,
    dropsYesterday,
    dropsThisWeek,
    dropsPrevWeek,
    newEventsThisWeek,
    newEventsPrevWeek,
    activeEvents,
    recentDrops,
    last7DaysDrops,
  ] = await Promise.all([
    prisma.event.count(),
    prisma.drop.count(),

    // Today vs yesterday
    prisma.drop.count({ where: { sentAt: { gte: startOfToday } } }),
    prisma.drop.count({ where: { sentAt: { gte: startYesterday, lt: startOfToday } } }),

    // This 7 days vs previous 7 days
    prisma.drop.count({ where: { sentAt: { gte: endPrev7 } } }),
    prisma.drop.count({ where: { sentAt: { gte: start14Days, lt: endPrev7 } } }),

    // New events this vs previous week
    prisma.event.count({ where: { createdAt: { gte: endPrev7 } } }),
    prisma.event.count({ where: { createdAt: { gte: start14Days, lt: endPrev7 } } }),

    // Active events with last drop + drop count
    prisma.event.findMany({
      where:   { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { drops: true } },
        drops:  { orderBy: { sentAt: 'desc' }, take: 1, select: { sentAt: true } },
      },
    }),

    // Recent drops for sidebar
    prisma.drop.findMany({
      take:    8,
      orderBy: { sentAt: 'desc' },
      include: { event: { select: { name: true, accentColor: true } } },
    }),

    // Only sentAt needed for chart — efficient, no extra columns fetched
    prisma.drop.findMany({
      where:  { sentAt: { gte: start7Days } },
      select: { sentAt: true },
    }),
  ]);

  // ── Chart data ─────────────────────────────────────────────────────────────
  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start7Days);
    d.setDate(start7Days.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const chartData = dayLabels.map(day => ({
    label: new Date(`${day}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short' }),
    count: (last7DaysDrops as { sentAt: Date }[]).filter(
      d => new Date(d.sentAt).toISOString().slice(0, 10) === day,
    ).length,
  }));

  // ── Trends ────────────────────────────────────────────────────────────────
  const todayTrend  = calcTrend(dropsToday,       dropsYesterday,    'vs gisteren');
  const weekTrend   = calcTrend(dropsThisWeek,    dropsPrevWeek,     'vs vorige week');
  const eventsTrend = calcTrend(newEventsThisWeek, newEventsPrevWeek, 'vs vorige week');
  const totalTrend  = calcTrend(dropsThisWeek,    dropsPrevWeek,     'groei deze week');

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1_000);
  const baseUrl     = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://festidrop.vercel.app';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-navy" style={{ letterSpacing: '-0.03em' }}>Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">Overzicht van al jouw FestiDrop events</p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)', boxShadow: '0 8px 24px rgba(30,139,255,0.25)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Nieuw event
        </Link>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Totaal events" value={totalEvents} color="#1E8BFF" trend={eventsTrend}
          icon={
            <path d="M3 6a3 3 0 116 0 3 3 0 01-6 0zM14.25 6a3 3 0 11-6 0 3 3 0 016 0zM4.5 15a3 3 0 116 0 3 3 0 01-6 0zM15.75 15a3 3 0 11-6 0 3 3 0 016 0z"
              fill="currentColor" />
          }
        />
        <StatCard label="Vandaag" value={dropsToday} color="#00C896" trend={todayTrend}
          icon={
            <>
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </>
          }
        />
        <StatCard label="Afgelopen 7 dagen" value={dropsThisWeek} color="#7B2FF7" trend={weekTrend}
          icon={
            <>
              <rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M2 9h16M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </>
          }
        />
        <StatCard label="Totaal drops" value={totalDrops} color="#20D6E8" trend={totalTrend}
          icon={
            <>
              <rect x="3" y="7" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <circle cx="10" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M8 7V5a2 2 0 014 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </>
          }
        />
      </div>

      {/* ── 7-day chart ─────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 2px 12px rgba(7,22,47,0.04)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-black uppercase tracking-[0.1em] text-muted">Drops afgelopen 7 dagen</h2>
          <span className="text-xs font-bold text-navy">{last7DaysDrops.length} totaal</span>
        </div>
        <DashboardChart data={chartData} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">

        {/* ── Active events ──────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black uppercase tracking-[0.1em] text-muted">Actieve events</h2>
            <Link href="/admin/events" className="text-xs font-bold text-azure hover:underline">Alle events →</Link>
          </div>

          {activeEvents.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)' }}
            >
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'rgba(30,139,255,0.08)' }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="1" y="4" width="20" height="16" rx="3" stroke="#1E8BFF" strokeWidth="1.5"/>
                  <path d="M1 9h20M7 1v4M15 1v4" stroke="#1E8BFF" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-navy mb-1">Nog geen events</p>
              <p className="text-xs text-muted mb-4">Maak je eerste event aan om te beginnen</p>
              <Link
                href="/admin/events/new"
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)' }}
              >
                + Nieuw event
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(activeEvents as (Event & { _count: { drops: number }; drops: { sentAt: Date }[] })[]).map(event => {
                const lastDropDate = event.drops[0]?.sentAt ? new Date(event.drops[0].sentAt) : null;
                const isLive       = !!lastDropDate && lastDropDate > twoHoursAgo;

                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 rounded-2xl px-5 py-4"
                    style={{
                      background:  'rgba(255,255,255,0.85)',
                      border:      '1px solid rgba(189,239,255,0.55)',
                      boxShadow:   '0 2px 12px rgba(7,22,47,0.04)',
                    }}
                  >
                    {/* Dot — pulsing when live */}
                    <div className="relative shrink-0">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ background: event.accentColor }}
                      />
                      {isLive && (
                        <div
                          className="absolute inset-0 rounded-full animate-ping"
                          style={{ background: event.accentColor, opacity: 0.5 }}
                        />
                      )}
                    </div>

                    {/* Name + URL + last drop */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-navy truncate">{event.name}</p>
                        {isLive && (
                          <span
                            className="text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ background: '#00C89618', color: '#00C896' }}
                          >
                            LIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs text-muted truncate">{baseUrl}/{event.slug}</p>
                        {lastDropDate && (
                          <span className="text-[10px] text-muted shrink-0">
                            · {relativeTime(lastDropDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-black text-navy">{event._count.drops}</span>
                      <span className="text-[10px] text-muted mr-2">drops</span>

                      <CopyLinkButton url={`${baseUrl}/${event.slug}`} />

                      <Link
                        href={`/${event.slug}`}
                        target="_blank"
                        className="p-2 rounded-lg transition-all hover:opacity-70"
                        style={{ background: 'rgba(189,239,255,0.25)' }}
                        title="Open event"
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8M8 1h4m0 0v4m0-4L5.5 7.5"
                            stroke="#07162F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>

                      {/* Beheren — settings/cog icon */}
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="p-2 rounded-lg text-white transition-all hover:opacity-80"
                        style={{ background: '#07162F' }}
                        title="Beheren"
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <circle cx="6.5" cy="6.5" r="1.75" stroke="white" strokeWidth="1.3"/>
                          <path
                            d="M6.5 1.5v1.1M6.5 10.4v1.1M1.5 6.5h1.1M9.9 6.5H11M3.2 3.2l.78.78M9.02 9.02l.78.78M9.8 3.2l-.78.78M3.98 9.02l-.78.78"
                            stroke="white" strokeWidth="1.2" strokeLinecap="round"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Recent drops ───────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black uppercase tracking-[0.1em] text-muted">Recente drops</h2>
            <Link href="/admin/events" className="text-xs font-bold text-azure hover:underline">Alle events →</Link>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)' }}
          >
            {recentDrops.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-xs text-muted">Nog geen drops</p>
              </div>
            ) : (
              (recentDrops as (Drop & { event: { name: string; accentColor: string } })[]).map((drop, i) => {
                const hue      = drop.email.charCodeAt(0) * 137 % 360;
                const dropDate = new Date(drop.sentAt);
                const isToday  = dropDate.toDateString() === new Date().toDateString();
                const dateStr  = isToday
                  ? dropDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
                  : dropDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });

                return (
                  <div
                    key={drop.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderTop: i > 0 ? '1px solid rgba(189,239,255,0.3)' : undefined }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-white"
                      style={{ background: `hsl(${hue}, 65%, 52%)` }}
                    >
                      {drop.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-navy truncate">{maskEmail(drop.email)}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: drop.event.accentColor }} />
                        <p className="text-[10px] text-muted truncate">{drop.event.name}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted shrink-0">{dateStr}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── StatCard ───────────────────────────────────────────────────────────────────
function StatCard({
  label, value, color, icon, trend,
}: {
  label:  string;
  value:  number;
  color:  string;
  icon:   React.ReactNode;
  trend?: { pct: number; label: string } | null;
}) {
  const trendColor =
    !trend           ? '#8A94A6' :
    trend.pct > 0    ? '#00C896' :
    trend.pct < 0    ? '#FF5C5C' :
                       '#8A94A6';

  const trendArrow =
    !trend           ? '→' :
    trend.pct > 0    ? '↑' :
    trend.pct < 0    ? '↓' :
                       '→';

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.85)',
        border:     '1px solid rgba(189,239,255,0.55)',
        boxShadow:  '0 2px 12px rgba(7,22,47,0.04)',
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}18`, color }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">{icon}</svg>
      </div>

      <p className="text-3xl font-black" style={{ color, letterSpacing: '-0.04em' }}>{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>

      {trend != null && (
        <div className="flex items-center gap-1 mt-2">
          <span className="text-[10px] font-black" style={{ color: trendColor }}>
            {trendArrow} {Math.abs(trend.pct)}%
          </span>
          <span className="text-[10px] text-muted">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
