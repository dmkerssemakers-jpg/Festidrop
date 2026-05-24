import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const revalidate = 30;

const STATUS_LABEL: Record<string, string> = {
  CONCEPT:     'Concept',
  VERZONDEN:   'Verzonden',
  BETAALD:     'Betaald',
  VERLOPEN:    'Verlopen',
  GEANNULEERD: 'Geannuleerd',
};
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  CONCEPT:     { bg: 'rgba(108,122,141,0.10)', color: '#6C7A8D' },
  VERZONDEN:   { bg: 'rgba(255,184,0,0.12)',   color: '#B07800' },
  BETAALD:     { bg: 'rgba(0,200,150,0.12)',   color: '#007A5E' },
  VERLOPEN:    { bg: 'rgba(255,30,30,0.10)',   color: '#CC1010' },
  GEANNULEERD: { bg: 'rgba(108,122,141,0.08)', color: '#9CA3AF' },
};

function fmt(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
}

function lineTotal(lines: { quantity: number; unitPrice: number }[]) {
  return lines.reduce((s: number, l: { quantity: number; unitPrice: number }) => s + l.quantity * l.unitPrice, 0);
}

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    include: { client: true, lines: true },
  });

  type Inv = (typeof invoices)[number];

  const totals = {
    openstaand: invoices
      .filter((i: Inv) => i.status === 'VERZONDEN' || i.status === 'VERLOPEN')
      .reduce((s: number, i: Inv) => s + lineTotal(i.lines) * (1 + i.vatPct / 100), 0),
    betaald: invoices
      .filter((i: Inv) => i.status === 'BETAALD')
      .reduce((s: number, i: Inv) => s + lineTotal(i.lines) * (1 + i.vatPct / 100), 0),
    concept: invoices.filter((i: Inv) => i.status === 'CONCEPT').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy" style={{ letterSpacing: '-0.03em' }}>Facturen</h1>
          <p className="text-sm text-muted mt-0.5">
            {invoices.length === 0
              ? 'Maak en beheer facturen per klant'
              : `${invoices.length} factuur${invoices.length !== 1 ? 'en' : ''}`}
          </p>
        </div>
        <Link
          href="/admin/invoices/new"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)', boxShadow: '0 8px 24px rgba(30,139,255,0.25)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Nieuwe factuur
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Openstaand', value: fmt(totals.openstaand), color: '#B07800',
            icon: <><rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1.5 6h11" stroke="currentColor" strokeWidth="1.4"/><circle cx="10" cy="8.5" r="1" fill="currentColor"/></> },
          { label: 'Betaald totaal', value: fmt(totals.betaald), color: '#00C896',
            icon: <><rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="7" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 6V4.5a2 2 0 014 0V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></> },
          { label: 'Concepten', value: String(totals.concept), color: '#1E8BFF',
            icon: <><rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></> },
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

      {/* Empty state */}
      {invoices.length === 0 ? (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)' }}
        >
          <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #1E8BFF, #20D6E8, #00C896)' }} />
          <div className="p-10 text-center">
            <div className="w-16 h-16 rounded-3xl mx-auto mb-5 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(30,139,255,0.12), rgba(0,200,150,0.08))' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="4" y="2" width="20" height="24" rx="3" stroke="#1E8BFF" strokeWidth="1.5"/>
                <path d="M9 9h10M9 13h10M9 17h6" stroke="#1E8BFF" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="text-lg font-black text-navy mb-2" style={{ letterSpacing: '-0.02em' }}>
              Eerste factuur aanmaken
            </h2>
            <p className="text-sm text-muted mb-8 max-w-sm mx-auto leading-relaxed">
              Koppel een klant, voeg regelitems toe en stuur professionele facturen inclusief BTW-berekening.
            </p>
            <Link
              href="/admin/invoices/new"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)', boxShadow: '0 8px 24px rgba(30,139,255,0.25)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Factuur aanmaken
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 2px 12px rgba(7,22,47,0.04)' }}>
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #1E8BFF, #20D6E8, #00C896)' }} />
          <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
            {invoices.map((inv: Inv) => {
              const subtotal = lineTotal(inv.lines);
              const total    = subtotal * (1 + inv.vatPct / 100);
              const sc       = STATUS_COLOR[inv.status] ?? STATUS_COLOR.CONCEPT;
              const isOverdue = inv.status === 'VERZONDEN' && inv.dueDate && inv.dueDate < new Date();

              return (
                <Link
                  key={inv.id}
                  href={`/admin/invoices/${inv.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-blue-50/30 transition-colors group"
                  style={{ borderColor: 'rgba(189,239,255,0.4)' }}
                >
                  {/* Invoice number + client */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-black text-navy group-hover:text-azure transition-colors">
                        {inv.number}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: sc.bg, color: sc.color }}
                      >
                        {isOverdue ? 'Verlopen' : STATUS_LABEL[inv.status]}
                      </span>
                    </div>
                    <p className="text-xs text-muted truncate">{inv.client.name}</p>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-navy">{fmt(total)}</p>
                    <p className="text-[10px] text-muted">incl. {inv.vatPct}% BTW</p>
                  </div>

                  {/* Date */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-xs text-muted">
                      {new Date(inv.issueDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </p>
                    {inv.dueDate && (
                      <p className="text-[10px]" style={{ color: isOverdue ? '#CC1010' : '#6C7A8D' }}>
                        vervalt {new Date(inv.dueDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>

                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                    className="shrink-0 opacity-30 group-hover:opacity-60 transition-opacity">
                    <path d="M5 3l4 4-4 4" stroke="#07162F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
