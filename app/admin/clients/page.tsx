import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const revalidate = 30;

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { events: true } },
      events: { select: { _count: { select: { drops: true } } } },
    },
  });

  type ClientRow = (typeof clients)[number];
  type EventRow  = ClientRow['events'][number];
  const totalEvents = clients.reduce((s: number, c: ClientRow) => s + c._count.events, 0);
  const totalDrops  = clients.reduce(
    (s: number, c: ClientRow) => s + c.events.reduce((es: number, e: EventRow) => es + e._count.drops, 0), 0
  );

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy" style={{ letterSpacing: '-0.03em' }}>Klanten</h1>
          <p className="text-sm text-muted mt-0.5">
            {clients.length === 0
              ? 'Beheer je klanten en koppel events'
              : `${clients.length} klant${clients.length !== 1 ? 'en' : ''}`}
          </p>
        </div>
        <Link
          href="/admin/clients/new"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)', boxShadow: '0 8px 24px rgba(30,139,255,0.25)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Nieuwe klant
        </Link>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Klanten',          value: clients.length, color: '#1E8BFF',
            icon: <><circle cx="7" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2 13c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></> },
          { label: 'Events gekoppeld', value: totalEvents,    color: '#7B2FF7',
            icon: <><rect x="1.5" y="3" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M4.5 3V2M9.5 3V2M1.5 6h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></> },
          { label: 'Drops totaal',     value: totalDrops,     color: '#00C896',
            icon: <><rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="7" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 6V4.5a2 2 0 014 0V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></> },
        ].map(({ label, value, color, icon }) => (
          <div
            key={label}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 2px 12px rgba(7,22,47,0.04)' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}15`, color }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">{icon}</svg>
            </div>
            <div>
              <p className="text-2xl font-black leading-none" style={{ color, letterSpacing: '-0.04em' }}>{value}</p>
              <p className="text-[10px] text-muted font-medium mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {clients.length === 0 ? (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)' }}
        >
          {/* Top gradient strip */}
          <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #1E8BFF, #20D6E8, #7B2FF7)' }} />

          <div className="p-10 text-center">
            <div className="w-16 h-16 rounded-3xl mx-auto mb-5 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(30,139,255,0.12), rgba(32,214,232,0.08))' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="11" cy="9" r="4.5" stroke="#1E8BFF" strokeWidth="1.5"/>
                <path d="M3 25c0-5 3.6-8 8-8s8 3 8 8" stroke="#1E8BFF" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="21" cy="11" r="3" stroke="#20D6E8" strokeWidth="1.5"/>
                <path d="M21 8V14M18 11h6" stroke="#20D6E8" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>

            <h2 className="text-lg font-black text-navy mb-2" style={{ letterSpacing: '-0.02em' }}>
              Voeg je eerste klant toe
            </h2>
            <p className="text-sm text-muted mb-8 max-w-sm mx-auto leading-relaxed">
              Houd bij wie je klanten zijn, koppel events aan hen en zie in één oogopslag hoeveel drops elke klant heeft gegenereerd.
            </p>

            {/* Stappen */}
            <div className="grid grid-cols-3 gap-4 mb-8 text-left max-w-lg mx-auto">
              {[
                { step: '1', title: 'Klant aanmaken', desc: 'Naam, contact\nen notities', color: '#1E8BFF' },
                { step: '2', title: 'Event koppelen', desc: 'Link bestaande\nevents aan klant', color: '#7B2FF7' },
                { step: '3', title: 'Overzicht', desc: 'Drops en stats\nper klant', color: '#00C896' },
              ].map(({ step, title, desc, color }) => (
                <div
                  key={step}
                  className="rounded-xl p-3.5"
                  style={{ background: `${color}08`, border: `1px solid ${color}20` }}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white mb-2"
                    style={{ background: color }}
                  >
                    {step}
                  </div>
                  <p className="text-xs font-black text-navy mb-0.5">{title}</p>
                  <p className="text-[10px] text-muted leading-relaxed whitespace-pre-line">{desc}</p>
                </div>
              ))}
            </div>

            <Link
              href="/admin/clients/new"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)', boxShadow: '0 8px 24px rgba(30,139,255,0.25)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Eerste klant toevoegen
            </Link>
          </div>
        </div>
      ) : (
        /* ── Client cards ──────────────────────────────────────────────── */
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client: (typeof clients)[number]) => {
            const drops    = client.events.reduce((s: number, e: (typeof client.events)[number]) => s + e._count.drops, 0);
            const initials = client.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
            const hue      = client.name.charCodeAt(0) * 137 % 360;

            return (
              <Link
                key={client.id}
                href={`/admin/clients/${client.id}`}
                className="group flex flex-col rounded-2xl p-5 transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  border:     '1px solid rgba(189,239,255,0.55)',
                  boxShadow:  '0 2px 12px rgba(7,22,47,0.04)',
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-black shrink-0"
                    style={{ background: `hsl(${hue},60%,52%)` }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-navy truncate group-hover:text-azure transition-colors">
                      {client.name}
                    </p>
                    {client.contactPerson && (
                      <p className="text-xs text-muted truncate">{client.contactPerson}</p>
                    )}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                    className="shrink-0 opacity-30 group-hover:opacity-60 transition-opacity">
                    <path d="M5 3l4 4-4 4" stroke="#07162F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                <div className="space-y-1.5 mb-4 flex-1">
                  {client.email && (
                    <p className="text-xs text-muted flex items-center gap-1.5 truncate">
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <rect x="1" y="2" width="9" height="7" rx="1.5" stroke="#6C7A8D" strokeWidth="1.1"/>
                        <path d="M1 4l4.5 3L10 4" stroke="#6C7A8D" strokeWidth="1.1" strokeLinecap="round"/>
                      </svg>
                      {client.email}
                    </p>
                  )}
                  {client.phone && (
                    <p className="text-xs text-muted flex items-center gap-1.5">
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M2 1.5h2l1 2.5-1.5 1a6 6 0 002.5 2.5l1-1.5 2.5 1v2A1 1 0 019 10C4 10 1 7 1 2a1 1 0 011-1z"
                          stroke="#6C7A8D" strokeWidth="1.1" strokeLinecap="round"/>
                      </svg>
                      {client.phone}
                    </p>
                  )}
                  {!client.email && !client.phone && (
                    <p className="text-xs text-muted italic">Geen contactgegevens</p>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-3"
                  style={{ borderTop: '1px solid rgba(189,239,255,0.4)' }}>
                  <span className="text-xs text-muted">
                    <span className="font-black text-navy">{client._count.events}</span> event{client._count.events !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-muted">
                    <span className="font-black text-navy">{drops}</span> drops
                  </span>
                  {client.notes && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(255,184,0,0.1)', color: '#B07800' }}>
                      notitie
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
