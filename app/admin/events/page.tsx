import { prisma } from '@/lib/prisma';
import type { Event } from '@prisma/client';
import Link from 'next/link';
import CopyLinkButton from '@/components/admin/CopyLinkButton';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://festidrop.vercel.app';

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { drops: true } } },
  });

  const totalDrops  = events.reduce((s, e) => s + e._count.drops, 0);
  const activeCount = events.filter(e => e.isActive).length;

  return (
    <div>
      {/* ── Page header ───────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy mb-1" style={{ letterSpacing: '-0.03em' }}>
            Events
          </h1>
          {/* Summary chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <Chip label={`${events.length} totaal`} color="rgba(7,22,47,0.08)" text="#07162F" />
            <Chip label={`${activeCount} actief`}   color="rgba(0,200,150,0.12)" text="#00A878" />
            <Chip label={`${totalDrops} drops`}     color="rgba(30,139,255,0.12)" text="#1E8BFF" />
          </div>
        </div>

        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shrink-0"
          style={{
            background:  'linear-gradient(135deg, #1E8BFF, #20D6E8)',
            boxShadow:   '0 8px 24px rgba(30,139,255,0.28)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Nieuw event
        </Link>
      </div>

      {/* ── Empty state ───────────────────────────────────────── */}
      {events.length === 0 && (
        <div
          className="rounded-2xl p-14 text-center"
          style={{
            background: 'rgba(255,255,255,0.85)',
            border:     '1px solid rgba(189,239,255,0.55)',
            boxShadow:  '0 4px 16px rgba(7,22,47,0.06)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(30,139,255,0.1)' }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="7" width="24" height="18" rx="4" stroke="#1E8BFF" strokeWidth="1.8"/>
              <circle cx="14" cy="16" r="5" stroke="#1E8BFF" strokeWidth="1.8"/>
              <path d="M9 7V5.5A2.5 2.5 0 0111.5 3h5A2.5 2.5 0 0119 5.5V7" stroke="#1E8BFF" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-base font-black text-navy mb-1">Nog geen events</p>
          <p className="text-sm text-muted mb-6">Maak je eerste event aan en deel de QR-code met je gasten.</p>
          <Link
            href="/admin/events/new"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)', boxShadow: '0 8px 24px rgba(30,139,255,0.25)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Eerste event aanmaken
          </Link>
        </div>
      )}

      {/* ── Event list ────────────────────────────────────────── */}
      {events.length > 0 && (
        <div className="space-y-3">
          {events.map((event: Event & { _count: { drops: number } }) => {
            const url = `${BASE_URL}/${event.slug}`;
            const created = new Date(event.createdAt).toLocaleDateString('nl-NL', {
              day: 'numeric', month: 'short', year: 'numeric',
            });

            return (
              <div
                key={event.id}
                className="group flex items-center gap-5 rounded-2xl px-5 py-4 transition-all duration-200 hover:scale-[1.005]"
                style={{
                  background: `linear-gradient(135deg, ${event.accentColor}08 0%, rgba(255,255,255,0.92) 55%)`,
                  border:     `1px solid ${event.accentColor}28`,
                  boxShadow:  `inset 4px 0 0 ${event.accentColor}, 0 2px 12px rgba(7,22,47,0.05)`,
                }}
              >
                {/* Color icon */}
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${event.accentColor}, ${event.accentColor}BB)`,
                    boxShadow:  `0 4px 14px ${event.accentColor}40`,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="1" y="5" width="16" height="11" rx="2.5" stroke="white" strokeWidth="1.5"/>
                    <circle cx="9" cy="10.5" r="3" stroke="white" strokeWidth="1.5"/>
                    <path d="M6 5V3.5A1.5 1.5 0 017.5 2h3A1.5 1.5 0 0112 3.5V5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-black text-navy truncate">{event.name}</p>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={event.isActive
                        ? { background: 'rgba(0,200,150,0.12)', color: '#00A878' }
                        : { background: 'rgba(108,122,141,0.12)', color: '#6C7A8D' }
                      }
                    >
                      {event.isActive ? '● actief' : '○ inactief'}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted mb-2 truncate">
                    {url}
                  </p>

                  {/* Stat chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <StatPill icon="📊" label={`${event._count.drops} drops`} />
                    <StatPill icon="📷" label={`${event.maxPhotos} foto's max`} />
                    <StatPill icon="📅" label={created} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <CopyLinkButton url={url} />

                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-all hover:opacity-80 hover:scale-105"
                    style={{ background: 'rgba(189,239,255,0.3)', color: '#07162F' }}
                  >
                    Open
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M3 2H2a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1V7M6 1h3m0 0v3M9 1L4.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>

                  <Link
                    href={`/admin/events/${event.id}`}
                    className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90 hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${event.accentColor}, ${event.accentColor}CC)`,
                      boxShadow:  `0 4px 14px ${event.accentColor}35`,
                    }}
                  >
                    Beheren
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5h6M5 2l3 3-3 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chip({ label, color, text }: { label: string; color: string; text: string }) {
  return (
    <span
      className="text-[11px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: color, color: text }}
    >
      {label}
    </span>
  );
}

function StatPill({ icon, label }: { icon: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md"
      style={{ background: 'rgba(189,239,255,0.25)', color: '#6C7A8D' }}
    >
      <span style={{ fontSize: '9px' }}>{icon}</span>
      {label}
    </span>
  );
}
