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

  // ── Company details from env vars ────────────────────────────────────────────
  const co = {
    name:    process.env.COMPANY_NAME     ?? 'FestiDrop',
    address: process.env.COMPANY_ADDRESS  ?? null,
    city:    process.env.COMPANY_CITY     ?? null,
    kvk:     process.env.COMPANY_KVK     ?? null,
    btw:     process.env.COMPANY_BTW     ?? null,
    iban:    process.env.COMPANY_IBAN    ?? null,
    bank:    process.env.COMPANY_BANK    ?? null,
    email:   process.env.COMPANY_EMAIL   ?? 'info@festidrop.nl',
    website: process.env.COMPANY_WEBSITE ?? 'www.festidrop.nl',
  };

  const missingFields = [
    !co.address && 'COMPANY_ADDRESS',
    !co.kvk     && 'COMPANY_KVK',
    !co.btw     && 'COMPANY_BTW',
    !co.iban    && 'COMPANY_IBAN',
  ].filter(Boolean) as string[];

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

      {/* ── Control bar ─────────────────────────────────────────────────────── */}
      <div className="no-print" style={{ background: '#07162F', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ color: 'rgba(189,239,255,0.6)', fontSize: 12, fontWeight: 600 }}>
          {invoice.number} · {invoice.client.name}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {missingFields.length > 0 && (
            <span style={{ fontSize: 11, color: '#FFB800', fontWeight: 600, background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.2)', borderRadius: 8, padding: '4px 10px' }}>
              ⚠ Vercel env vars ontbreken: {missingFields.join(', ')}
            </span>
          )}
          <a href="/admin/invoices" style={{ color: 'rgba(189,239,255,0.5)', fontSize: 12, fontWeight: 600, textDecoration: 'none', padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.06)' }}>
            ← Terug
          </a>
          <PrintButton />
        </div>
      </div>

      {/* ── Invoice page ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '40px 24px', maxWidth: 860, margin: '0 auto' }}>
        <div
          className="page"
          style={{ background: 'white', borderRadius: 16, boxShadow: '0 8px 48px rgba(7,22,47,0.12)', overflow: 'hidden' }}
        >
          <div style={{ height: 6, background: 'linear-gradient(90deg, #1E8BFF, #20D6E8, #00C896)' }} />

          <div style={{ padding: '48px 56px' }}>

            {/* ── Header: branding left, FACTUUR right ─────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
              {/* From: company info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="2" y="5" width="16" height="11" rx="2.5" fill="white" fillOpacity=".9"/>
                      <circle cx="10" cy="10.5" r="2.8" stroke="#1E8BFF" strokeWidth="1.5" fill="none"/>
                      <path d="M7.5 5V4A1 1 0 018.5 3h3a1 1 0 011 1v1" stroke="#1E8BFF" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#07162F', letterSpacing: '-0.03em' }}>{co.name}</span>
                </div>

                {/* Address */}
                <div style={{ fontSize: 12, color: '#6C7A8D', lineHeight: 1.7 }}>
                  {co.address ? <p style={{ margin: 0 }}>{co.address}</p> : <p style={{ margin: 0, color: '#FFB800' }}>[COMPANY_ADDRESS]</p>}
                  {co.city    ? <p style={{ margin: 0 }}>{co.city}</p>    : null}
                  <p style={{ margin: 0 }}>{co.email}</p>
                  <p style={{ margin: 0 }}>{co.website}</p>
                </div>

                {/* KVK + BTW */}
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>
                    KVK: <span style={{ color: co.kvk ? '#07162F' : '#FFB800', fontWeight: 600 }}>{co.kvk ?? '[COMPANY_KVK]'}</span>
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>
                    BTW: <span style={{ color: co.btw ? '#07162F' : '#FFB800', fontWeight: 600 }}>{co.btw ?? '[COMPANY_BTW]'}</span>
                  </p>
                </div>
              </div>

              {/* FACTUUR + number */}
              <div style={{ textAlign: 'right' }}>
                <h1 style={{ fontSize: 34, fontWeight: 900, color: '#07162F', letterSpacing: '-0.05em', marginBottom: 4 }}>FACTUUR</h1>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#1E8BFF' }}>{invoice.number}</p>
              </div>
            </div>

            {/* ── Bill-to + invoice details ─────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 36, paddingBottom: 28, borderBottom: '1px solid rgba(189,239,255,0.5)' }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6C7A8D', marginBottom: 8 }}>
                  Factuur aan
                </p>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#07162F', marginBottom: 3 }}>{invoice.client.name}</p>
                {invoice.client.contactPerson && <p style={{ fontSize: 13, color: '#6C7A8D', marginBottom: 1 }}>{invoice.client.contactPerson}</p>}
                {invoice.client.email && <p style={{ fontSize: 13, color: '#6C7A8D' }}>{invoice.client.email}</p>}
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6C7A8D', marginBottom: 8 }}>
                  Factuurdetails
                </p>
                {[
                  ['Factuurnummer', invoice.number],
                  ['Factuurdatum',  new Date(invoice.issueDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })],
                  ...(invoice.dueDate ? [['Vervaldatum', new Date(invoice.dueDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })]] : []),
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#6C7A8D', width: 120, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#07162F' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Line items table ──────────────────────────────────── */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 100px', gap: 16, padding: '10px 16px', background: '#F0F5FF', borderRadius: 8, marginBottom: 4 }}>
                {['Omschrijving', 'Aantal', 'Prijs', 'Totaal'].map((h, i) => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6C7A8D', textAlign: i > 0 ? 'right' : 'left' }}>
                    {h}
                  </span>
                ))}
              </div>

              {invoice.lines.map((line: LineRow, idx: number) => (
                <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 100px', gap: 16, padding: '14px 16px', background: idx % 2 === 0 ? 'white' : 'rgba(240,245,255,0.5)', borderBottom: '1px solid rgba(189,239,255,0.35)' }}>
                  <span style={{ fontSize: 13, color: '#07162F' }}>{line.description}</span>
                  <span style={{ fontSize: 13, color: '#6C7A8D', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{line.quantity}</span>
                  <span style={{ fontSize: 13, color: '#6C7A8D', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(line.unitPrice)}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#07162F', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(line.quantity * line.unitPrice)}</span>
                </div>
              ))}
            </div>

            {/* ── Totals ───────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 36 }}>
              <div style={{ width: 300 }}>
                {[
                  { label: 'Subtotaal', value: fmt(subtotal) },
                  { label: `BTW (${invoice.vatPct}%)`, value: fmt(vat) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(189,239,255,0.4)' }}>
                    <span style={{ fontSize: 13, color: '#6C7A8D' }}>{label}</span>
                    <span style={{ fontSize: 13, color: '#07162F', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', background: 'linear-gradient(135deg, rgba(30,139,255,0.07), rgba(32,214,232,0.05))', borderRadius: 10, marginTop: 10, border: '1px solid rgba(30,139,255,0.12)' }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#07162F' }}>Totaal</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#1E8BFF', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* ── Payment details ───────────────────────────────────── */}
            <div style={{ background: 'rgba(240,245,255,0.7)', borderRadius: 12, padding: '20px 24px', marginBottom: invoice.notes ? 28 : 48, border: '1px solid rgba(189,239,255,0.5)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6C7A8D', marginBottom: 12 }}>
                Betaalgegevens
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 32px' }}>
                {[
                  ['IBAN',             co.iban ?? '[COMPANY_IBAN]',  !co.iban],
                  ['Bank',             co.bank ?? 'Zie IBAN',        false],
                  ['Ten name van',     co.name,                      false],
                  ['Betalingskenmerk', invoice.number,               false],
                  ...(invoice.dueDate ? [['Uiterlijk betalen', new Date(invoice.dueDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }), false]] : []),
                ].map(([label, value, warn]) => (
                  <div key={label as string} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#6C7A8D', flexShrink: 0, minWidth: 120 }}>{label as string}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: warn ? '#FFB800' : '#07162F', fontVariantNumeric: 'tabular-nums' }}>{value as string}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Notes ─────────────────────────────────────────────── */}
            {invoice.notes && (
              <div style={{ marginBottom: 48, padding: '16px 20px', background: 'rgba(240,245,255,0.7)', borderRadius: 10, borderLeft: '3px solid #1E8BFF' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6C7A8D', marginBottom: 6 }}>Notities</p>
                <p style={{ fontSize: 13, color: '#07162F', lineHeight: 1.6 }}>{invoice.notes}</p>
              </div>
            )}

            {/* ── Footer ────────────────────────────────────────────── */}
            <div style={{ paddingTop: 20, borderTop: '1px solid rgba(189,239,255,0.4)', textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.8 }}>
                Bedankt voor uw vertrouwen · {co.name} · {co.email}<br />
                {co.kvk && `KVK ${co.kvk}`}{co.kvk && co.btw && ' · '}{co.btw && `BTW ${co.btw}`}
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
