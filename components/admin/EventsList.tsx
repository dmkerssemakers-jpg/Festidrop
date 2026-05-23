'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import CopyLinkButton    from './CopyLinkButton';
import DuplicateEventButton from './DuplicateEventButton';
import ToggleActiveButton   from './ToggleActiveButton';

// ── Types ─────────────────────────────────────────────────────────────────────
export type EventRow = {
  id:            string;
  name:          string;
  slug:          string;
  accentColor:   string;
  isActive:      boolean;
  maxPhotos:     number;
  accessCode:    string | null;
  createdAt:     string;   // ISO
  endsAt:        string | null; // ISO
  totalDrops:    number;
  dropsThisWeek: number;
  lastDropAt:    string | null; // ISO
};

type SortKey   = 'date' | 'drops' | 'name';
type FilterKey = 'all'  | 'active' | 'inactive';

// ── Helpers ───────────────────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins <  1)  return 'zojuist';
  if (mins < 60)  return `${mins} min geleden`;
  const h = Math.floor(mins / 60);
  if (h   < 24)  return `${h}u geleden`;
  return `${Math.floor(h / 24)}d geleden`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function EventsList({
  events,
  baseUrl,
}: {
  events:  EventRow[];
  baseUrl: string;
}) {
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState<FilterKey>('all');
  const [sort,     setSort]     = useState<SortKey>('date');
  const [sortDir,  setSortDir]  = useState<'asc' | 'desc'>('desc');

  // ── Filtered + sorted list ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = [...events];

    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(e =>
        e.name.toLowerCase().includes(q) || e.slug.toLowerCase().includes(q),
      );
    }
    if (filter === 'active')   r = r.filter(e =>  e.isActive);
    if (filter === 'inactive') r = r.filter(e => !e.isActive);

    r.sort((a, b) => {
      let d = 0;
      if (sort === 'date')  d = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === 'drops') d = a.totalDrops - b.totalDrops;
      if (sort === 'name')  d = a.name.localeCompare(b.name, 'nl');
      return sortDir === 'desc' ? -d : d;
    });

    return r;
  }, [events, search, filter, sort, sortDir]);

  function toggleSort(key: SortKey) {
    if (sort === key) setSortDir(d => (d === 'desc' ? 'asc' : 'desc'));
    else { setSort(key); setSortDir('desc'); }
  }

  const now         = new Date();
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1_000);

  // ── Empty state (no events at all) ────────────────────────────────────────
  if (events.length === 0) {
    return (
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
            <path d="M9 7V5.5A2.5 2.5 0 0111.5 3h5A2.5 2.5 0 0119 5.5V7"
              stroke="#1E8BFF" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-base font-black text-navy mb-1">Nog geen events</p>
        <p className="text-sm text-muted mb-6">
          Maak je eerste event aan en deel de QR-code met je gasten.
        </p>
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
    );
  }

  // ── Toolbar + list ────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            width="13" height="13" viewBox="0 0 13 13" fill="none"
          >
            <circle cx="5.5" cy="5.5" r="4" stroke="#8A94A6" strokeWidth="1.4"/>
            <path d="M9 9l2.5 2.5" stroke="#8A94A6" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek op naam of URL…"
            className="w-full pl-8 pr-4 py-2 text-xs rounded-xl outline-none"
            style={{
              background: 'rgba(255,255,255,0.9)',
              border:     '1px solid rgba(189,239,255,0.6)',
              color:      '#07162F',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-navy transition-colors"
              style={{ fontSize: 14, lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ border: '1px solid rgba(189,239,255,0.5)', background: 'rgba(255,255,255,0.8)' }}
        >
          {(['all', 'active', 'inactive'] as FilterKey[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 text-[11px] font-bold transition-all whitespace-nowrap"
              style={filter === f
                ? { background: '#07162F', color: '#fff' }
                : { color: '#8A94A6' }
              }
            >
              {f === 'all' ? 'Alle' : f === 'active' ? '● Actief' : '○ Inactief'}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-muted mr-0.5">Sorteer:</span>
          {([['date', 'Datum'], ['drops', 'Drops'], ['name', 'Naam']] as [SortKey, string][]).map(
            ([key, lbl]) => (
              <button
                key={key}
                onClick={() => toggleSort(key)}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all"
                style={sort === key
                  ? { background: 'rgba(30,139,255,0.12)', color: '#1E8BFF' }
                  : { background: 'rgba(0,0,0,0.05)',      color: '#8A94A6' }
                }
              >
                {lbl} {sort === key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </button>
            ),
          )}
        </div>
      </div>

      {/* ── No-results state ─────────────────────────────────── */}
      {filtered.length === 0 && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)' }}
        >
          <p className="text-sm font-bold text-navy mb-1">Geen events gevonden</p>
          <p className="text-xs text-muted mb-3">Probeer een andere zoekterm of filter</p>
          <button
            onClick={() => { setSearch(''); setFilter('all'); }}
            className="text-xs font-bold text-azure hover:underline"
          >
            ↩ Reset filters
          </button>
        </div>
      )}

      {/* ── Event list ───────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(event => {
            const url         = `${baseUrl}/${event.slug}`;
            const createdStr  = new Date(event.createdAt).toLocaleDateString('nl-NL', {
              day: 'numeric', month: 'short', year: 'numeric',
            });
            const endsAt      = event.endsAt ? new Date(event.endsAt) : null;
            const isExpired   = !!endsAt && endsAt < now;
            const expiresSoon = !!endsAt && !isExpired &&
              (endsAt.getTime() - now.getTime()) < 48 * 60 * 60 * 1_000;
            const isLive      = !!event.lastDropAt &&
              new Date(event.lastDropAt) > twoHoursAgo;

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
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${event.accentColor}, ${event.accentColor}BB)`,
                    boxShadow:  `0 4px 14px ${event.accentColor}40`,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="1" y="5" width="16" height="11" rx="2.5" stroke="white" strokeWidth="1.5"/>
                    <circle cx="9" cy="10.5" r="3" stroke="white" strokeWidth="1.5"/>
                    <path d="M6 5V3.5A1.5 1.5 0 017.5 2h3A1.5 1.5 0 0112 3.5V5"
                      stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>

                {/* Info block */}
                <div className="flex-1 min-w-0">

                  {/* Name row */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-black text-navy truncate">{event.name}</p>

                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={event.isActive
                        ? { background: 'rgba(0,200,150,0.12)',  color: '#00A878' }
                        : { background: 'rgba(108,122,141,0.12)', color: '#6C7A8D' }
                      }
                    >
                      {event.isActive ? '● actief' : '○ inactief'}
                    </span>

                    {isLive && (
                      <span
                        className="text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: '#00C89618', color: '#00C896' }}
                      >
                        LIVE
                      </span>
                    )}

                    {event.accessCode && (
                      <span title="Beveiligd met toegangscode" className="shrink-0">
                        <svg width="11" height="12" viewBox="0 0 11 12" fill="none">
                          <rect x="1" y="5.5" width="9" height="6" rx="1.5" stroke="#8A94A6" strokeWidth="1.2"/>
                          <path d="M3 5.5V4A2.5 2.5 0 018 4v1.5"
                            stroke="#8A94A6" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      </span>
                    )}
                  </div>

                  {/* URL */}
                  <p className="text-[11px] text-muted mb-2 truncate">{url}</p>

                  {/* Stat pills row */}
                  <div className="flex items-center gap-1.5 flex-wrap">

                    {/* Drops + weekly */}
                    <Pill>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1 9h8M2.5 9V6M5 9V3.5M7.5 9V5.5"
                          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      {event.totalDrops} drops
                      {event.dropsThisWeek > 0 && (
                        <span style={{ color: '#00C896', fontWeight: 800 }}>
                          +{event.dropsThisWeek} week
                        </span>
                      )}
                    </Pill>

                    {/* Max photos */}
                    <Pill>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <rect x="0.75" y="2.5" width="8.5" height="6.5" rx="1.5"
                          stroke="currentColor" strokeWidth="1.2"/>
                        <circle cx="5" cy="5.75" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M3.5 2.5V2A1.25 1.25 0 015 .75h0A1.25 1.25 0 016.5 2v.5"
                          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      {event.maxPhotos} foto&apos;s max
                    </Pill>

                    {/* Created */}
                    <Pill>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <rect x="1" y="2" width="8" height="7.5" rx="1.5"
                          stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M1 4.5h8M3.5 1v2M6.5 1v2"
                          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      {createdStr}
                    </Pill>

                    {/* endsAt */}
                    {endsAt && (
                      <Pill accent={isExpired ? '#FF5C5C' : expiresSoon ? '#FF9500' : undefined}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <circle cx="5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M5 3.5v2l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        {isExpired
                          ? 'Afgelopen'
                          : `Eindigt ${endsAt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`
                        }
                      </Pill>
                    )}

                    {/* Last drop */}
                    {event.lastDropAt && (
                      <Pill>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <circle cx="5" cy="5" r="3.75" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M5 3v2l1 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        {relativeTime(event.lastDropAt)}
                      </Pill>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <ToggleActiveButton
                    eventId={event.id}
                    isActive={event.isActive}
                    accentColor={event.accentColor}
                  />
                  <DuplicateEventButton eventId={event.id} />
                  <CopyLinkButton url={url} />

                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Event openen"
                    className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-all hover:opacity-80 hover:scale-105"
                    style={{ background: 'rgba(189,239,255,0.3)', color: '#07162F' }}
                  >
                    Open
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M3 2H2a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1V7M6 1h3m0 0v3M9 1L4.5 5.5"
                        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>

                  <Link
                    href={`/admin/events/${event.id}`}
                    title="Event beheren"
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

// ── Sub-components ────────────────────────────────────────────────────────────

function Pill({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?:  string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md"
      style={{
        background: accent ? `${accent}18` : 'rgba(189,239,255,0.25)',
        color:      accent ?? '#6C7A8D',
      }}
    >
      {children}
    </span>
  );
}
