import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { updateInvoiceStatus, deleteInvoice } from '@/lib/actions';

export const revalidate = 0;

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

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true, lines: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!invoice) notFound();

  type LineRow = (typeof invoice.lines)[number];
  const subtotal = invoice.lines.reduce((s: number, l: LineRow) => s + l.quantity * l.unitPrice, 0);
  const vat      = subtotal * invoice.vatPct / 100;
  const total    = subtotal + vat;
  const sc       = STATUS_COLOR[invoice.status] ?? STATUS_COLOR.CONCEPT;
  const isOverdue = invoice.status === 'VERZONDEN' && invoice.dueDate && invoice.dueDate < new Date();

  return (
    <div>
      {/* Back */}
      <Link
        href="/admin/invoices"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-navy transition-colors mb-6"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Alle facturen
      </Link>

      {/* Hero */}
      <div
        className="rounded-2xl overflow-hidden mb-6"
        style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 24px rgba(7,22,47,0.06)' }}
      >
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #1E8BFF, #20D6E8, #00C896)' }} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-navy" style={{ letterSpacing: '-0.03em' }}>
                  {invoice.number}
                </h1>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: isOverdue ? STATUS_COLOR.VERLOPEN.bg : sc.bg, color: isOverdue ? STATUS_COLOR.VERLOPEN.color : sc.color }}
                >
                  {isOverdue ? 'Verlopen' : STATUS_LABEL[invoice.status]}
                </span>
              </div>
              <Link
                href={`/admin/clients/${invoice.client.id}`}
                className="text-sm font-bold hover:underline"
                style={{ color: '#1E8BFF' }}
              >
                {invoice.client.name}
              </Link>
              {invoice.client.email && (
                <p className="text-xs text-muted mt-0.5">{invoice.client.email}</p>
              )}
            </div>

            {/* Total + print */}
            <div className="text-right shrink-0">
              <p className="text-3xl font-black" style={{ color: '#1E8BFF', letterSpacing: '-0.04em' }}>
                {fmt(total)}
              </p>
              <p className="text-xs text-muted">incl. {invoice.vatPct}% BTW</p>
              <a
                href={`/factuur/${invoice.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{ background: 'rgba(30,139,255,0.08)', color: '#1E5FBF', border: '1px solid rgba(30,139,255,0.15)' }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M2 8.5V10h1.5l4.5-4.5-1.5-1.5L2 8.5zM9.7 2.8a.5.5 0 000-.7l-1-1a.5.5 0 00-.7 0L7 2l1.5 1.5 1.2-1.2z" fill="currentColor"/>
                </svg>
                Afdrukken / PDF
              </a>
            </div>
          </div>

          {/* Dates row */}
          <div className="flex items-center gap-6 mt-4 pt-4" style={{ borderTop: '1px solid rgba(189,239,255,0.4)' }}>
            <div>
              <p className="text-[10px] text-muted font-medium uppercase tracking-wider">Factuurdatum</p>
              <p className="text-sm font-bold text-navy mt-0.5">
                {new Date(invoice.issueDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            {invoice.dueDate && (
              <div>
                <p className="text-[10px] text-muted font-medium uppercase tracking-wider">Vervaldatum</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: isOverdue ? '#CC1010' : '#07162F' }}>
                  {new Date(invoice.dueDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {isOverdue && <span className="text-[10px] font-bold ml-2 text-red-600">VERLOPEN</span>}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">

        {/* Left — line items */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.06)' }}
        >
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #1E8BFF, #20D6E8)' }} />
          <div className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-4">Regelitems</p>

            {/* Header row */}
            <div className="grid gap-3 mb-2 text-[10px] font-black uppercase tracking-[0.1em] text-muted"
              style={{ gridTemplateColumns: '1fr 70px 100px 90px' }}>
              <span>Omschrijving</span>
              <span className="text-right">Aantal</span>
              <span className="text-right">Prijs</span>
              <span className="text-right">Totaal</span>
            </div>

            <div className="space-y-1">
              {invoice.lines.map((line: LineRow) => (
                <div
                  key={line.id}
                  className="grid gap-3 py-2.5 px-3 rounded-xl"
                  style={{ gridTemplateColumns: '1fr 70px 100px 90px', background: 'rgba(247,251,255,0.7)', border: '1px solid rgba(189,239,255,0.3)' }}
                >
                  <span className="text-sm text-navy font-medium">{line.description}</span>
                  <span className="text-sm text-muted text-right tabular-nums">{line.quantity}</span>
                  <span className="text-sm text-muted text-right tabular-nums">{fmt(line.unitPrice)}</span>
                  <span className="text-sm font-bold text-navy text-right tabular-nums">{fmt(line.quantity * line.unitPrice)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 space-y-1.5" style={{ borderTop: '1px solid rgba(189,239,255,0.4)' }}>
              <div className="flex justify-between text-xs text-muted">
                <span>Subtotaal</span>
                <span className="font-bold text-navy tabular-nums">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>BTW ({invoice.vatPct}%)</span>
                <span className="font-bold text-navy tabular-nums">{fmt(vat)}</span>
              </div>
              <div
                className="flex justify-between text-base font-black pt-2"
                style={{ borderTop: '1px solid rgba(189,239,255,0.4)', color: '#07162F' }}
              >
                <span>Totaal</span>
                <span className="tabular-nums" style={{ color: '#1E8BFF' }}>{fmt(total)}</span>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(189,239,255,0.4)' }}>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-1">Notities</p>
                <p className="text-xs text-muted">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right — status + actions */}
        <div className="space-y-4">

          {/* Status management */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.06)' }}
          >
            <div className="h-1 w-full" style={{ background: sc.color + '40' }} />
            <div className="p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-3">Status</p>

              <div className="space-y-2">
                {invoice.status === 'CONCEPT' && (
                  <form action={async () => { 'use server'; await updateInvoiceStatus(id, 'VERZONDEN'); }}>
                    <button type="submit" className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #B07800, #E8A800)' }}>
                      Markeer als verzonden
                    </button>
                  </form>
                )}
                {(invoice.status === 'VERZONDEN' || invoice.status === 'VERLOPEN') && (
                  <form action={async () => { 'use server'; await updateInvoiceStatus(id, 'BETAALD'); }}>
                    <button type="submit" className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #00A878, #00C896)' }}>
                      Markeer als betaald
                    </button>
                  </form>
                )}
                {invoice.status === 'VERZONDEN' && (
                  <form action={async () => { 'use server'; await updateInvoiceStatus(id, 'VERLOPEN'); }}>
                    <button type="submit" className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                      style={{ background: 'rgba(255,30,30,0.08)', color: '#CC1010' }}>
                      Markeer als verlopen
                    </button>
                  </form>
                )}
                {invoice.status !== 'BETAALD' && invoice.status !== 'GEANNULEERD' && invoice.status !== 'CONCEPT' && (
                  <form action={async () => { 'use server'; await updateInvoiceStatus(id, 'CONCEPT'); }}>
                    <button type="submit" className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                      style={{ background: 'rgba(108,122,141,0.08)', color: '#6C7A8D' }}>
                      Terugzetten naar concept
                    </button>
                  </form>
                )}
                {invoice.status !== 'BETAALD' && (
                  <form action={async () => { 'use server'; await updateInvoiceStatus(id, 'GEANNULEERD'); }}>
                    <button type="submit" className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
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
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.06)' }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-3">Info</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted">Klant</span>
                <Link href={`/admin/clients/${invoice.client.id}`}
                  className="text-xs font-bold hover:underline" style={{ color: '#1E8BFF' }}>
                  {invoice.client.name}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted">Regelitems</span>
                <span className="text-xs font-bold text-navy">{invoice.lines.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted">BTW</span>
                <span className="text-xs font-bold text-navy">{invoice.vatPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted">Aangemaakt</span>
                <span className="text-xs font-bold text-navy">
                  {new Date(invoice.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          </div>

          {/* Delete */}
          {invoice.status === 'CONCEPT' && (
            <form action={async () => { 'use server'; await deleteInvoice(id); }}>
              <button type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                style={{ background: 'rgba(255,30,30,0.07)', color: '#CC1010', border: '1px solid rgba(255,30,30,0.12)' }}>
                Verwijder factuur
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
