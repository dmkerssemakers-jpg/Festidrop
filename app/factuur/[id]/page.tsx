import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import PrintButton from './PrintButton';

function fmt(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
}

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #F0F5FF; color: #07162F; }
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .page { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
        }
      `}</style>

      {/* Print button bar */}
      <div className="no-print" style={{ background: '#07162F', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(189,239,255,0.6)', fontSize: 12, fontWeight: 600 }}>
          {invoice.number} · {invoice.client.name}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/admin/invoices" style={{ color: 'rgba(189,239,255,0.5)', fontSize: 12, fontWeight: 600, textDecoration: 'none', padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.06)' }}>
            ← Terug
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Invoice page */}
      <div style={{ padding: '40px 24px', maxWidth: 860, margin: '0 auto' }}>
        <div
          className="page"
          style={{ background: 'white', borderRadius: 16, boxShadow: '0 8px 48px rgba(7,22,47,0.12)', overflow: 'hidden' }}
        >
          {/* Color strip */}
          <div style={{ height: 6, background: 'linear-gradient(90deg, #1E8BFF, #20D6E8, #00C896)' }} />

          <div style={{ padding: '48px 56px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
              <div>
                {/* FestiDrop branding */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="2" y="2" width="16" height="16" rx="4" fill="white" fillOpacity=".9"/>
                      <path d="M6 10l3 3 5-5" stroke="#1E8BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#07162F', letterSpacing: '-0.03em' }}>FestiDrop</span>
                </div>
                <p style={{ fontSize: 11, color: '#6C7A8D', lineHeight: 1.6 }}>
                  info@festidrop.nl<br />
                  www.festidrop.nl
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: '#07162F', letterSpacing: '-0.04em', marginBottom: 4 }}>
                  FACTUUR
                </h1>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1E8BFF' }}>{invoice.number}</p>
              </div>
            </div>

            {/* Billing info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 40 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6C7A8D', marginBottom: 8 }}>
                  Factuur aan
                </p>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#07162F', marginBottom: 2 }}>{invoice.client.name}</p>
                {invoice.client.contactPerson && (
                  <p style={{ fontSize: 13, color: '#6C7A8D' }}>{invoice.client.contactPerson}</p>
                )}
                {invoice.client.email && (
                  <p style={{ fontSize: 13, color: '#6C7A8D' }}>{invoice.client.email}</p>
                )}
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6C7A8D', marginBottom: 8 }}>
                  Details
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    ['Factuurnummer', invoice.number],
                    ['Factuurdatum', new Date(invoice.issueDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })],
                    ...(invoice.dueDate ? [['Vervaldatum', new Date(invoice.dueDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })]] : []),
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 12, color: '#6C7A8D', width: 110, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#07162F' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div style={{ marginBottom: 32 }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 100px', gap: 16, padding: '10px 16px', background: '#F0F5FF', borderRadius: 8, marginBottom: 4 }}>
                {['Omschrijving', 'Aantal', 'Prijs', 'Totaal'].map((h, i) => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6C7A8D', textAlign: i > 0 ? 'right' : 'left' }}>
                    {h}
                  </span>
                ))}
              </div>

              {invoice.lines.map((line: LineRow, idx: number) => (
                <div
                  key={line.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 110px 100px', gap: 16,
                    padding: '14px 16px',
                    background: idx % 2 === 0 ? 'white' : 'rgba(240,245,255,0.5)',
                    borderBottom: '1px solid rgba(189,239,255,0.4)',
                  }}
                >
                  <span style={{ fontSize: 13, color: '#07162F' }}>{line.description}</span>
                  <span style={{ fontSize: 13, color: '#6C7A8D', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{line.quantity}</span>
                  <span style={{ fontSize: 13, color: '#6C7A8D', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(line.unitPrice)}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#07162F', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(line.quantity * line.unitPrice)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: 300 }}>
                {[
                  { label: 'Subtotaal', value: fmt(subtotal), bold: false },
                  { label: `BTW (${invoice.vatPct}%)`, value: fmt(vat), bold: false },
                ].map(({ label, value, bold }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(189,239,255,0.4)' }}>
                    <span style={{ fontSize: 13, color: '#6C7A8D', fontWeight: bold ? 700 : 400 }}>{label}</span>
                    <span style={{ fontSize: 13, color: '#07162F', fontWeight: bold ? 700 : 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'linear-gradient(135deg, rgba(30,139,255,0.08), rgba(32,214,232,0.06))', borderRadius: 10, marginTop: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#07162F' }}>Totaal</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#1E8BFF', fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div style={{ marginTop: 40, padding: '16px 20px', background: 'rgba(240,245,255,0.8)', borderRadius: 10, borderLeft: '3px solid #1E8BFF' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6C7A8D', marginBottom: 6 }}>Notities</p>
                <p style={{ fontSize: 13, color: '#07162F', lineHeight: 1.6 }}>{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid rgba(189,239,255,0.4)', textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#9CA3AF' }}>
                Bedankt voor uw vertrouwen · FestiDrop · info@festidrop.nl
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
