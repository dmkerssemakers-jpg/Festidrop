import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const revalidate = 30;

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { events: true } },
      events: {
        select: { _count: { select: { drops: true } } },
      },
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-navy" style={{ letterSpacing: '-0.03em' }}>Klanten</h1>
          <p className="text-sm text-muted mt-0.5">
            {clients.length === 0 ? 'Nog geen klanten' : `${clients.length} klant${clients.length !== 1 ? 'en' : ''}`}
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

      {clients.length === 0 ? (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)' }}
        >
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(30,139,255,0.08)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="7" r="4" stroke="#1E8BFF" strokeWidth="1.5"/>
              <path d="M2 21c0-4 3-7 7-7s7 3 7 7" stroke="#1E8BFF" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M19 8v6M22 11h-6" stroke="#1E8BFF" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-base font-black text-navy mb-1">Nog geen klanten</p>
          <p className="text-sm text-muted mb-6 max-w-xs mx-auto">
            Voeg je eerste klant toe en koppel events aan hen voor een overzichtelijk CRM.
          </p>
          <Link
            href="/admin/clients/new"
            className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)' }}
          >
            + Nieuwe klant
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(clients as typeof clients).map((client: (typeof clients)[number]) => {
            const totalDrops = client.events.reduce((s: number, e: (typeof client.events)[number]) => s + e._count.drops, 0);
            const initials   = client.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
            const hue        = client.name.charCodeAt(0) * 137 % 360;

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
                {/* Avatar + name */}
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
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 opacity-30 group-hover:opacity-60 transition-opacity">
                    <path d="M5 3l4 4-4 4" stroke="#07162F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Contact info */}
                <div className="space-y-1 mb-4 flex-1">
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
                        <path d="M2 1.5h2l1 2.5-1.5 1a6 6 0 002.5 2.5l1-1.5 2.5 1v2A1 1 0 019 10C4 10 1 7 1 2a1 1 0 011-1z" stroke="#6C7A8D" strokeWidth="1.1" strokeLinecap="round"/>
                      </svg>
                      {client.phone}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 pt-3"
                  style={{ borderTop: '1px solid rgba(189,239,255,0.4)' }}>
                  <span className="text-xs text-muted">
                    <span className="font-black text-navy">{client._count.events}</span> event{client._count.events !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-muted">
                    <span className="font-black text-navy">{totalDrops}</span> drops
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
