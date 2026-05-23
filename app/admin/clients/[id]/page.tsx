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

      {/* Hero */}
      <div
        className="rounded-2xl p-6 mb-6 relative overflow-hidden"
        style={{ background: `hsl(${hue},60%,96%)`, border: `1px solid hsl(${hue},60%,88%)` }}
      >
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: `hsl(${hue},60%,80%)` }}
        />
        <div className="flex items-center gap-4 relative">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shrink-0 shadow-lg"
            style={{ background: `hsl(${hue},60%,52%)` }}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-black text-navy" style={{ letterSpacing: '-0.03em' }}>
              {client.name}
            </h1>
            {client.contactPerson && (
              <p className="text-sm text-muted">{client.contactPerson}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-5 mt-4 pt-4"
          style={{ borderTop: `1px solid hsl(${hue},60%,88%)` }}>
          <span className="text-xs text-muted">
            <span className="font-black text-navy">{client.events.length}</span> event{client.events.length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-muted">
            <span className="font-black text-navy">{totalDrops}</span> drops totaal
          </span>
          {client.email && (
            <a href={`mailto:${client.email}`}
              className="text-xs font-semibold hover:underline ml-auto"
              style={{ color: `hsl(${hue},60%,40%)` }}>
              {client.email}
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

        {/* Left — edit form */}
        <ClientForm client={client} />

        {/* Right — linked events */}
        <div className="space-y-4">

          {/* Linked events */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.06)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                Gekoppelde events
              </h2>
              <span className="text-[10px] text-muted">{client.events.length}</span>
            </div>

            {client.events.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">Nog geen events gekoppeld</p>
            ) : (
              <div className="space-y-2">
                {client.events.map((event: (typeof client.events)[number]) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(247,251,255,0.8)', border: '1px solid rgba(189,239,255,0.4)' }}
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: event.accentColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-navy truncate">{event.name}</p>
                      <p className="text-[10px] text-muted">{event._count.drops} drops</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                        style={{ background: 'rgba(30,139,255,0.1)', color: '#1E8BFF' }}
                        title="Beheren"
                      >
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <circle cx="5.5" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M5.5 1v.8M5.5 9.2V10M1 5.5h.8M9.2 5.5H10M2.3 2.3l.55.55M8.15 8.15l.55.55M8.7 2.3l-.55.55M2.85 8.15l-.55.55" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                        </svg>
                      </Link>
                      {/* Unlink */}
                      <form action={async () => {
                        'use server';
                        await setEventClient(event.id, null);
                      }}>
                        <button
                          type="submit"
                          className="p-1.5 rounded-lg transition-colors hover:opacity-70"
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
                className="mt-3 flex gap-2"
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
                  style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)' }}
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
