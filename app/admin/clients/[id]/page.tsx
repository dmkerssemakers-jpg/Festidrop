import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ClientForm from '@/components/admin/ClientForm';
import { setEventClient } from '@/lib/actions';

export const revalidate = 30;

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [client, availableEvents] = await Promise.all([
    prisma.client.findUnique({
      where: { id },
      include: {
        events: {
          include: { _count: { select: { drops: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.event.findMany({
      where:   { clientId: null },
      select:  { id: true, name: true, accentColor: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!client) notFound();

  const totalDrops = client.events.reduce((s: number, e: (typeof client.events)[number]) => s + e._count.drops, 0);
  const initials   = client.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const hue        = client.name.charCodeAt(0) * 137 % 360;

  return (
    <div>
      {/* Back */}
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-navy transition-colors mb-6"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Alle klanten
      </Link>

      {/* Hero card */}
      <div
        className="rounded-2xl overflow-hidden mb-6"
        style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 24px rgba(7,22,47,0.06)' }}
      >
        {/* Color strip */}
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, hsl(${hue},60%,52%), hsl(${(hue + 40) % 360},60%,60%))` }} />

        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black shrink-0 shadow-lg"
              style={{ background: `linear-gradient(135deg, hsl(${hue},60%,52%), hsl(${(hue + 20) % 360},60%,60%))` }}
            >
              {initials}
            </div>

            {/* Name + chips */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-navy" style={{ letterSpacing: '-0.03em' }}>
                {client.name}
              </h1>
              {client.contactPerson && (
                <p className="text-sm text-muted mt-0.5">{client.contactPerson}</p>
              )}

              {/* Quick-contact chips */}
              {(client.email || client.phone || client.website) && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {client.email && (
                    <a
                      href={`mailto:${client.email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-80"
                      style={{ background: 'rgba(30,139,255,0.08)', color: '#1E5FBF', border: '1px solid rgba(30,139,255,0.15)' }}
                    >
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <rect x="1" y="2" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
                        <path d="M1 4l4.5 3L10 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                      </svg>
                      {client.email}
                    </a>
                  )}
                  {client.phone && (
                    <a
                      href={`tel:${client.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-80"
                      style={{ background: 'rgba(0,200,150,0.08)', color: '#007A5E', border: '1px solid rgba(0,200,150,0.2)' }}
                    >
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M2 1.5h2l1 2.5-1.5 1a6 6 0 002.5 2.5l1-1.5 2.5 1v2A1 1 0 019 10C4 10 1 7 1 2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                      </svg>
                      {client.phone}
                    </a>
                  )}
                  {client.website && (
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-80"
                      style={{ background: 'rgba(123,47,247,0.08)', color: '#5B1FBF', border: '1px solid rgba(123,47,247,0.15)' }}
                    >
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.1"/>
                        <path d="M5.5 1c-1.4 1.5-2 3-2 4.5s.6 3 2 4.5M5.5 1c1.4 1.5 2 3 2 4.5s-.6 3-2 4.5M1 5.5h9" stroke="currentColor" strokeWidth="1.1"/>
                      </svg>
                      Website
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5" style={{ borderTop: '1px solid rgba(189,239,255,0.4)' }}>
            {[
              { label: 'Events', value: client.events.length, color: '#7B2FF7' },
              { label: 'Drops totaal', value: totalDrops, color: '#00C896' },
              {
                label: 'Klant sinds',
                value: new Date(client.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }),
                color: '#1E8BFF',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-black leading-none" style={{ color, letterSpacing: '-0.04em' }}>{value}</p>
                <p className="text-[10px] text-muted font-medium mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

        {/* Left — edit form */}
        <ClientForm client={client} />

        {/* Right — linked events */}
        <div
          className="rounded-2xl overflow-hidden self-start"
          style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.06)' }}
        >
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #7B2FF7, #1E8BFF)' }} />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                Gekoppelde events
              </h2>
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(123,47,247,0.1)', color: '#7B2FF7' }}
              >
                {client.events.length}
              </span>
            </div>

            {client.events.length === 0 ? (
              <div className="py-6 text-center">
                <div
                  className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: 'rgba(123,47,247,0.08)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="4" width="14" height="11" rx="2" stroke="#7B2FF7" strokeWidth="1.3"/>
                    <path d="M6 4V3M12 4V3M2 7.5h14" stroke="#7B2FF7" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-xs font-bold text-navy mb-0.5">Geen events</p>
                <p className="text-[11px] text-muted">Koppel een event aan deze klant</p>
              </div>
            ) : (
              <div className="space-y-2 mb-3">
                {client.events.map((event: (typeof client.events)[number]) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 rounded-xl group"
                    style={{ background: 'rgba(247,251,255,0.8)', border: '1px solid rgba(189,239,255,0.4)' }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: event.accentColor ?? '#1E8BFF' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-navy truncate">{event.name}</p>
                      <p className="text-[10px] text-muted">{event._count.drops} drops</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="p-1.5 rounded-lg"
                        style={{ background: 'rgba(30,139,255,0.1)', color: '#1E8BFF' }}
                        title="Bekijk event"
                      >
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path d="M5 2H2a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          <path d="M7 1h3v3M10 1L5.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                      <form action={async () => {
                        'use server';
                        await setEventClient(event.id, null);
                      }}>
                        <button
                          type="submit"
                          className="p-1.5 rounded-lg"
                          style={{ background: 'rgba(255,30,30,0.08)', color: '#CC1010' }}
                          title="Ontkoppel"
                        >
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                            <path d="M2 2l7 7M9 2l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Link a new event */}
            {availableEvents.length > 0 && (
              <form
                action={async (fd: FormData) => {
                  'use server';
                  const eventId = fd.get('eventId') as string;
                  if (eventId) await setEventClient(eventId, id);
                }}
                className="flex gap-2"
                style={{ paddingTop: client.events.length > 0 ? 12 : 0, borderTop: client.events.length > 0 ? '1px solid rgba(189,239,255,0.4)' : 'none' }}
              >
                <select
                  name="eventId"
                  className="flex-1 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                  style={{ background: 'rgba(247,251,255,0.8)', border: '1px solid rgba(189,239,255,0.6)', color: '#07162F' }}
                >
                  <option value="">Event koppelen…</option>
                  {availableEvents.map((e: (typeof availableEvents)[number]) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl text-xs font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7B2FF7, #1E8BFF)' }}
                >
                  Koppel
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
