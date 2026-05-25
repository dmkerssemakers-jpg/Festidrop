import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { updateInvoiceStatus } from '@/lib/actions';
import DeleteInvoiceButton from '@/components/admin/DeleteInvoiceButton';

export const revalidate = 0;

const STATUS_LABEL: Record<string, string> = {
  CONCEPT:     'Concept',
  VERZONDEN:   'Verzonden',
  BETAALD:     'Betaald',
  VERLOPEN:    'Verlopen',
  GEANNULEERD: 'Geannuleerd',
};
const STATUS_COLOR: Record<string, { bg: string; color: string; grad: string }> = {
  CONCEPT:     { bg: 'rgba(108,122,141,0.10)', color: '#6C7A8D', grad: 'linear-gradient(135deg,#9CA3AF,#6C7A8D)' },
  VERZONDEN:   { bg: 'rgba(255,184,0,0.12)',   color: '#B07800', grad: 'linear-gradient(135deg,#FFB800,#E8A800)' },
  BETAALD:     { bg: 'rgba(0,200,150,0.12)',   color: '#007A5E', grad: 'linear-gradient(135deg,#00C896,#00A878)' },
  VERLOPEN:    { bg: 'rgba(255,30,30,0.10)',   color: '#CC1010', grad: 'linear-gradient(135deg,#FF4444,#CC1010)' },
  GEANNULEERD: { bg: 'rgba(108,122,141,0.08)', color: '#9CA3AF', grad: 'linear-gradient(135deg,#C5CDD8,#9CA3AF)' },
};

function fmt(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true, lines: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!invoice) notFound();

  type LineRow = (typeof invoice.lines)[number];
  const subtotal  = invoice.lines.reduce((s: number, l: LineRow) => s + l.quantity * l.unitPrice, 0);
  const vat       = subtotal * invoice.vatPct / 100;
  const total     = subtotal + vat;
  const isOverdue = invoice.status === 'VERZONDEN' && invoice.dueDate && invoice.dueDate < new Date();
  const statusKey = isOverdue ? 'VERLOPEN' : invoice.status;
  const sc        = STATUS_COLOR[statusKey] ?? STATUS_COLOR.CONCEPT;

  return (
    <div style={{ maxWidth: 960 }}>

      {/* ── Back nav ─────────────────────────────────────────────── */}
      <Link
        href="/admin/invoices"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-navy transition-colors mb-6"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Alle facturen
      </Link>

      {/* ── Hero card ────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden mb-5"
        style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 24px rgba(7,22,47,0.07)' }}
      >
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #1E8BFF, #20D6E8, #00C896)' }} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-6">

            {/* Left: number + client */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-black text-navy" style={{ letterSpacing: '-0.04em' }}>
                  {invoice.number}
                </h1>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: sc.bg, color: sc.color }}
                >
                  {STATUS_LABEL[statusKey]}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)' }}
                >
                  {invoice.client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <Link
                    href={`/admin/clients/${invoice.client.id}`}
                    className="text-sm font-bold hover:underline leading-none"
                    style={{ color: '#1E8BFF' }}
                  >
                    {invoice.client.name}
                  </Link>
                  {invoice.client.email && (
                    <p className="text-xs text-muted mt-0.5">{invoice.client.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: total amount + print */}
            <div className="text-right shrink-0">
              <p
                className="text-4xl font-black tabular-nums leading-none"
                style={{ color: '#1E8BFF', letterSpacing: '-0.05em' }}
              >
                {fmt(total)}
              </p>
              <p className="text-xs text-muted mt-1">incl. {invoice.vatPct}% BTW</p>
              <a
                href={`/factuur/${invoice.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{ background: 'rgba(30,139,255,0.08)', color: '#1E5FBF', border: '1px solid rgba(30,139,255,0.15)' }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <rect x="1" y="1.5" width="9" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
                  <path d="M3.5 5.5h4M3.5 7h2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  <path d="M7 1.5V4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                </svg>
                Afdrukken / PDF
              </a>
            </div>
          </div>

          {/* Dates strip */}
          <div
            className="flex items-center gap-8 mt-5 pt-4"
            style={{ borderTop: '1px solid rgba(189,239,255,0.45)' }}
          >
            <div>
              <p className="text-[10px] text-muted font-black uppercase tracking-[0.12em]">Factuurdatum</p>
              <p className="text-sm font-bold text-navy mt-0.5">
                {new Date(invoice.issueDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            {invoice.dueDate && (
              <div>
                <p className="text-[10px] text-muted font-black uppercase tracking-[0.12em]">Vervaldatum</p>
                <p className="text-sm font-bold mt-0.5 flex items-center gap-1.5" style={{ color: isOverdue ? '#CC1010' : '#07162F' }}>
                  {new Date(invoice.dueDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {isOverdue && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,30,30,0.1)', color: '#CC1010' }}>
                      VERLOPEN
                    </span>
                  )}
                </p>
              </div>
            )}
            {invoice.notes && (
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted font-black uppercase tracking-[0.12em]">Notities</p>
                <p className="text-xs text-muted mt-0.5 truncate">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_268px]">

        {/* ── Left: line items ─────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.05)' }}
        >
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #7B2FF7, #1E8BFF)' }} />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white shrink-0" style={{ background: '#7B2FF7' }}>2</div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Regelitems</p>
            </div>

            {/* Column header */}
            <div
              className="grid gap-3 px-3 py-2 rounded-xl mb-2"
              style={{ gridTemplateColumns: '1fr 72px 110px 96px', background: 'rgba(247,251,255,0.9)' }}
            >
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-muted">Omschrijving</span>
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-muted text-right">Aantal</span>
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-muted text-right">Prijs</span>
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-muted text-right">Totaal</span>
            </div>

            <div className="space-y-1.5">
              {invoice.lines.map((line: LineRow) => (
                <div
                  key={line.id}
                  className="grid gap-3 py-3 px-3 rounded-xl"
                  style={{ gridTemplateColumns: '1fr 72px 110px 96px', background: 'rgba(247,251,255,0.7)', border: '1px solid rgba(189,239,255,0.3)' }}
                >
                  <span className="text-sm text-navy font-semibold">{line.description}</span>
                  <span className="text-sm text-muted text-right tabular-nums">{line.quantity}</span>
                  <span className="text-sm text-muted text-right tabular-nums">{fmt(line.unitPrice)}</span>
                  <span className="text-sm font-black text-navy text-right tabular-nums">{fmt(line.quantity * line.unitPrice)}</span>
                </div>
              ))}
            </div>

            {/* Totals block */}
            <div
              className="mt-4 rounded-xl p-4"
              style={{ background: 'rgba(7,22,47,0.03)', border: '1px solid rgba(189,239,255,0.45)' }}
            >
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted">Subtotaal</span>
                  <span className="text-xs font-bold tabular-nums text-navy">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted">BTW ({invoice.vatPct}%)</span>
                  <span className="text-xs font-bold tabular-nums text-navy">{fmt(vat)}</span>
                </div>
                <div
                  className="flex justify-between items-baseline pt-2.5 mt-0.5"
                  style={{ borderTop: '1px solid rgba(189,239,255,0.5)' }}
                >
                  <span className="text-sm font-black text-navy">Totaal incl. BTW</span>
                  <span className="text-xl font-black tabular-nums" style={{ color: '#1E8BFF', letterSpacing: '-0.04em' }}>{fmt(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: status + info + delete ────────────────────── */}
        <div className="space-y-4">

          {/* Status card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.05)' }}
          >
            <div className="h-1" style={{ background: sc.grad }} />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white shrink-0" style={{ background: '#1E8BFF' }}>1</div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Status</p>
              </div>

              {/* Current status pill */}
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3"
                style={{ background: sc.bg }}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: sc.color }} />
                <span className="text-sm font-black" style={{ color: sc.color }}>
                  {STATUS_LABEL[statusKey]}
                </span>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                {invoice.status === 'CONCEPT' && (
                  <form action={async () => { 'use server'; await updateInvoiceStatus(id, 'VERZONDEN'); }}>
                    <button type="submit" className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #B07800, #E8A800)' }}>
                      Markeer als verzonden
                    </button>
                  </form>
                )}
                {(invoice.status === 'VERZONDEN' || invoice.status === 'VERLOPEN' || isOverdue) && (
                  <form action={async () => { 'use server'; await updateInvoiceStatus(id, 'BETAALD'); }}>
                    <button type="submit" className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #00A878, #00C896)' }}>
                      Markeer als betaald
                    </button>
                  </form>
                )}
                {invoice.status === 'VERZONDEN' && (
                  <form action={async () => { 'use server'; await updateInvoiceStatus(id, 'VERLOPEN'); }}>
                    <button type="submit" className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ background: 'rgba(255,30,30,0.08)', color: '#CC1010' }}>
                      Markeer als verlopen
                    </button>
                  </form>
                )}
                {(invoice.status === 'BETAALD' || invoice.status === 'GEANNULEERD') && (
                  <form action={async () => { 'use server'; await updateInvoiceStatus(id, 'CONCEPT'); }}>
                    <button type="submit" className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ background: 'rgba(108,122,141,0.08)', color: '#6C7A8D' }}>
                      Terugzetten naar concept
                    </button>
                  </form>
                )}
                {invoice.status === 'VERZONDEN' && (
                  <form action={async () => { 'use server'; await updateInvoiceStatus(id, 'GEANNULEERD'); }}>
                    <button type="submit" className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ background: 'rgba(108,122,141,0.06)', color: '#9CA3AF' }}>
                      Annuleer factuur
                    </button>
                  </form>
                )}
                {invoice.status === 'CONCEPT' && (
                  <form action={async () => { 'use server'; await updateInvoiceStatus(id, 'GEANNULEERD'); }}>
                    <button type="submit" className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ background: 'rgba(108,122,141,0.06)', color: '#9CA3AF' }}>
                      Annuleer factuur
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Info card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.05)' }}
          >
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #1E8BFF, #20D6E8)' }} />
            <div className="p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-3">Info</p>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Klant</span>
                  <Link href={`/admin/clients/${invoice.client.id}`}
                    className="text-xs font-bold hover:underline" style={{ color: '#1E8BFF' }}>
                    {invoice.client.name}
                  </Link>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Regelitems</span>
                  <span className="text-xs font-bold text-navy">{invoice.lines.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">BTW</span>
                  <span className="text-xs font-bold text-navy">{invoice.vatPct}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Aangemaakt</span>
                  <span className="text-xs font-bold text-navy">
                    {new Date(invoice.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div
                  className="flex justify-between items-center pt-2 mt-0.5"
                  style={{ borderTop: '1px solid rgba(189,239,255,0.4)' }}
                >
                  <span className="text-xs text-muted">Subtotaal</span>
                  <span className="text-xs font-bold text-navy tabular-nums">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">BTW bedrag</span>
                  <span className="text-xs font-bold text-navy tabular-nums">{fmt(vat)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delete — always available, with confirmation */}
          <DeleteInvoiceButton id={id} />

        </div>
      </div>
    </div>
  );
}
