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
    totaalAantal: invoices.length,
  };

  const stats = [
    {
      label:   'Openstaand',
      value:   fmt(totals.openstaand),
      accent:  '#B07800',
      grad:    'linear-gradient(135deg, #FFB800, #FF8C00)',
      bgAccent:'rgba(255,184,0,0.08)',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1.5" y="3.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M1.5 7h13" stroke="currentColor" strokeWidth="1.4"/>
          <circle cx="11.5" cy="10" r="1.2" fill="currentColor"/>
        </svg>
      ),
    },
    {
      label:   'Betaald totaal',
      value:   fmt(totals.betaald),
      accent:  '#007A5E',
      grad:    'linear-gradient(135deg, #00C896, #00A878)',
      bgAccent:'rgba(0,200,150,0.08)',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13 5L6.5 11.5 3 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label:   'Concepten',
      value:   String(totals.concept),
      accent:  '#1E8BFF',
      grad:    'linear-gradient(135deg, #1E8BFF, #20D6E8)',
      bgAccent:'rgba(30,139,255,0.08)',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="1.5" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy" style={{ letterSpacing: '-0.03em' }}>Facturen</h1>
          <p className="text-sm text-muted mt-0.5">
            {invoices.length === 0
              ? 'Maak en beheer facturen per klant'
              : `${invoices.length} factuur${invoices.length !== 1 ? 'en' : ''} · ${fmt(totals.betaald + totals.openstaand)} omzet`}
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

      {/* ── Stat cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map(({ label, value, accent, grad, bgAccent, icon }) => (
          <div
            key={label}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 2px 12px rgba(7,22,47,0.04)' }}
          >
            {/* Accent bar */}
            <div className="h-1" style={{ background: grad }} />
            <div className="p-4 flex items-center gap-3">
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: bgAccent, color: accent }}
              >
                {icon}
              </div>
              {/* Value */}
              <div className="min-w-0">
                <p
                  className="text-xl font-black leading-none tabular-nums truncate"
                  style={{ color: accent, letterSpacing: '-0.04em' }}
                >
                  {value}
                </p>
                <p className="text-[11px] text-muted font-medium mt-1">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Empty state ──────────────────────────────────────────── */}
      {invoices.length === 0 ? (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 2px 12px rgba(7,22,47,0.04)' }}
        >
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #1E8BFF, #20D6E8, #00C896)' }} />

          <div className="px-8 py-10 flex gap-10 items-center">
            {/* Illustration side */}
            <div className="shrink-0">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(30,139,255,0.10), rgba(0,200,150,0.08))', border: '1px solid rgba(30,139,255,0.12)' }}
              >
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <rect x="5" y="3" width="22" height="28" rx="3" stroke="#1E8BFF" strokeWidth="1.6"/>
                  <path d="M10 11h12M10 15.5h12M10 20h8" stroke="#1E8BFF" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="18" y="21" width="13" height="12" rx="2.5" fill="#F0F5FF" stroke="#00C896" strokeWidth="1.4"/>
                  <path d="M22 27l2 2 4-4" stroke="#00C896" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Text + features */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black text-navy mb-1" style={{ letterSpacing: '-0.02em' }}>
                Eerste factuur aanmaken
              </h2>
              <p className="text-sm text-muted mb-4 leading-relaxed">
                Koppel een klant, voeg regelitems toe en stuur professionele facturen met BTW-berekening.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { icon: '🏷️', text: 'Auto-nummering' },
                  { icon: '💶', text: 'BTW 0 / 9 / 21%' },
                  { icon: '📋', text: 'Import vanuit events' },
                ].map(({ icon, text }) => (
                  <span
                    key={text}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg"
                    style={{ background: 'rgba(30,139,255,0.06)', color: '#1E8BFF', border: '1px solid rgba(30,139,255,0.12)' }}
                  >
                    <span>{icon}</span>
                    {text}
                  </span>
                ))}
              </div>

              <Link
                href="/admin/invoices/new"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)', boxShadow: '0 6px 20px rgba(30,139,255,0.25)' }}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 1v11M1 6.5h11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                Factuur aanmaken
              </Link>
            </div>
          </div>
        </div>

      ) : (

        /* ── Invoice list ─────────────────────────────────────────── */
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 2px 12px rgba(7,22,47,0.04)' }}
        >
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #1E8BFF, #20D6E8, #00C896)' }} />

          <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
            {invoices.map((inv: Inv) => {
              const subtotal  = lineTotal(inv.lines);
              const total     = subtotal * (1 + inv.vatPct / 100);
              const isOverdue = inv.status === 'VERZONDEN' && inv.dueDate && inv.dueDate < new Date();
              const statusKey = isOverdue ? 'VERLOPEN' : inv.status;
              const sc        = STATUS_COLOR[statusKey] ?? STATUS_COLOR.CONCEPT;

              return (
                <Link
                  key={inv.id}
                  href={`/admin/invoices/${inv.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-blue-50/30 transition-colors group"
                  style={{ borderColor: 'rgba(189,239,255,0.4)' }}
                >
                  {/* Invoice icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: sc.bg, color: sc.color }}
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <rect x="1.5" y="1" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M4 4.5h5M4 6.5h5M4 8.5h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                    </svg>
                  </div>

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
                        {STATUS_LABEL[statusKey]}
                      </span>
                    </div>
                    <p className="text-xs text-muted truncate">{inv.client.name}</p>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-navy tabular-nums">{fmt(total)}</p>
                    <p className="text-[10px] text-muted">incl. {inv.vatPct}% BTW</p>
                  </div>

                  {/* Date */}
                  <div className="text-right shrink-0 hidden sm:block" style={{ minWidth: 72 }}>
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
                    className="shrink-0 opacity-25 group-hover:opacity-60 transition-opacity">
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
