'use client';
import { useTransition, useState } from 'react';
import Link from 'next/link';
import { createInvoice } from '@/lib/actions';

interface EventData {
  id:    string;
  name:  string;
  _count: { drops: number };
}
interface ClientData {
  id:     string;
  name:   string;
  email:  string | null;
  events: EventData[];
}
interface Line {
  key:         string;
  description: string;
  quantity:    number;
  unitPrice:   number;
}

const VAT_OPTIONS = [0, 9, 21];

function fmt(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
}

export default function InvoiceCreator({ clients }: { clients: ClientData[] }) {
  const [isPending, startTransition] = useTransition();
  const [clientId,  setClientId]     = useState('');
  const [vatPct,    setVatPct]        = useState(21);
  const [lines,     setLines]         = useState<Line[]>([newLine()]);

  const selectedClient = clients.find(c => c.id === clientId) ?? null;

  function newLine(): Line {
    return { key: Math.random().toString(36).slice(2), description: '', quantity: 1, unitPrice: 0 };
  }

  function addLine() { setLines(l => [...l, newLine()]); }

  function removeLine(key: string) { setLines(l => l.filter(x => x.key !== key)); }

  function updateLine(key: string, field: keyof Omit<Line, 'key'>, value: string | number) {
    setLines(l => l.map(x => x.key === key ? { ...x, [field]: value } : x));
  }

  function importEvents() {
    if (!selectedClient) return;
    const existing = new Set(lines.map(l => l.description));
    const toAdd = selectedClient.events
      .filter(e => !existing.has(`Event: ${e.name} — ${e._count.drops} drops`))
      .map(e => ({ ...newLine(), description: `Event: ${e.name} — ${e._count.drops} drops` }));
    if (toAdd.length) setLines(l => [...l.filter(x => x.description !== ''), ...toAdd]);
  }

  const subtotal  = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const vat       = subtotal * vatPct / 100;
  const total     = subtotal + vat;
  const canSubmit = !isPending && !!clientId && lines.some(l => l.description.trim());

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set('lines', JSON.stringify(lines.map(({ description, quantity, unitPrice }) => ({ description, quantity, unitPrice }))));
    startTransition(async () => { await createInvoice(fd); });
  };

  return (
    <div style={{ maxWidth: 680 }}>

      {/* Back nav */}
      <Link
        href="/admin/invoices"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-navy transition-colors mb-6"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Alle facturen
      </Link>

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy" style={{ letterSpacing: '-0.03em' }}>Nieuwe factuur</h1>
          <p className="text-sm text-muted mt-0.5">Vul de gegevens in en maak direct aan</p>
        </div>
        {/* Invoice number preview badge */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 shrink-0"
          style={{ background: 'rgba(30,139,255,0.06)', border: '1px solid rgba(30,139,255,0.15)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1" width="10" height="10" rx="2" stroke="#1E8BFF" strokeWidth="1.2"/>
            <path d="M3.5 4h5M3.5 6h5M3.5 8h3" stroke="#1E8BFF" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
          <span className="text-xs font-black" style={{ color: '#1E8BFF', letterSpacing: '-0.01em' }}>
            FD-{new Date().getFullYear()}-???
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ─── Section 1: Klant & gegevens ─────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.05)' }}
        >
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #1E8BFF, #20D6E8)' }} />

          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white shrink-0"
                style={{ background: '#1E8BFF' }}
              >1</div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Klant &amp; gegevens</p>
            </div>

            <div className="grid grid-cols-2 gap-4">

              {/* Client selector */}
              <div className="col-span-2">
                <label className="field-label">Klant</label>
                <select
                  name="clientId"
                  required
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="field"
                >
                  <option value="">— Selecteer klant —</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.events.length > 0 ? ` (${c.events.length} event${c.events.length !== 1 ? 's' : ''})` : ''}
                    </option>
                  ))}
                </select>

                {/* Client info card — shown when a client is selected */}
                {selectedClient && (
                  <div
                    className="mt-2.5 flex items-center gap-3 rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(30,139,255,0.05)', border: '1px solid rgba(30,139,255,0.12)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-black text-white"
                      style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)' }}
                    >
                      {selectedClient.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-navy leading-none truncate">{selectedClient.name}</p>
                      {selectedClient.email && (
                        <p className="text-[11px] text-muted mt-0.5 truncate">{selectedClient.email}</p>
                      )}
                    </div>
                    {selectedClient.events.length > 0 && (
                      <div
                        className="shrink-0 text-[11px] font-bold px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(30,139,255,0.1)', color: '#1E8BFF' }}
                      >
                        {selectedClient.events.length} event{selectedClient.events.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dates */}
              <div>
                <label className="field-label">Factuurdatum</label>
                <input
                  name="issueDate"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="field"
                />
              </div>
              <div>
                <label className="field-label">Vervaldatum <span className="normal-case font-normal text-[10px] text-muted ml-0.5">optioneel</span></label>
                <input name="dueDate" type="date" className="field" />
              </div>

              {/* VAT + notes */}
              <div>
                <label className="field-label">BTW</label>
                <select
                  name="vatPct"
                  value={vatPct}
                  onChange={e => setVatPct(Number(e.target.value))}
                  className="field"
                >
                  {VAT_OPTIONS.map(v => (
                    <option key={v} value={v}>{v}%</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Notities <span className="normal-case font-normal text-[10px] text-muted ml-0.5">optioneel</span></label>
                <input name="notes" placeholder="Betalingskenmerk, project…" className="field" />
              </div>

            </div>
          </div>
        </div>

        {/* ─── Section 2: Regelitems ───────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.05)' }}
        >
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #7B2FF7, #1E8BFF)' }} />

          <div className="p-5">

            {/* Section header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white shrink-0"
                  style={{ background: '#7B2FF7' }}
                >2</div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Regelitems</p>
              </div>
              {selectedClient && selectedClient.events.length > 0 && (
                <button
                  type="button"
                  onClick={importEvents}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ background: 'rgba(123,47,247,0.08)', color: '#7B2FF7', border: '1px solid rgba(123,47,247,0.15)' }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <rect x="1.5" y="3" width="8" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.1"/>
                    <path d="M4 3V2M7 3V2M1.5 5.5h8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                  </svg>
                  Importeer events ({selectedClient.events.length})
                </button>
              )}
            </div>

            {/* Column header row */}
            <div
              className="grid gap-2 px-2.5 py-2 rounded-xl mb-1.5"
              style={{ gridTemplateColumns: '1fr 72px 108px 84px 32px', background: 'rgba(247,251,255,0.9)' }}
            >
              <span className="field-label mb-0">Omschrijving</span>
              <span className="field-label mb-0 text-right">Aantal</span>
              <span className="field-label mb-0 text-right">Prijs</span>
              <span className="field-label mb-0 text-right">Totaal</span>
              <span />
            </div>

            {/* Line rows */}
            <div className="space-y-1.5">
              {lines.map((line, idx) => (
                <div
                  key={line.key}
                  className="grid gap-2 items-center"
                  style={{ gridTemplateColumns: '1fr 72px 108px 84px 32px' }}
                >
                  <input
                    placeholder={`Regel ${idx + 1}…`}
                    value={line.description}
                    onChange={e => updateLine(line.key, 'description', e.target.value)}
                    className="field"
                    required
                  />
                  <input
                    type="number" min="0.01" step="0.01"
                    value={line.quantity}
                    onChange={e => updateLine(line.key, 'quantity', parseFloat(e.target.value) || 0)}
                    className="field text-right"
                  />
                  <div className="relative">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none"
                      style={{ color: '#6C7A8D' }}
                    >€</span>
                    <input
                      type="number" min="0" step="0.01"
                      value={line.unitPrice}
                      onChange={e => updateLine(line.key, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="field pl-6 text-right"
                    />
                  </div>
                  <span className="text-sm font-black text-right tabular-nums" style={{ color: '#07162F' }}>
                    {fmt(line.quantity * line.unitPrice)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    disabled={lines.length === 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-20 hover:scale-110 active:scale-95"
                    style={{ background: 'rgba(255,30,30,0.08)', color: '#CC1010' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Add line button */}
            <button
              type="button"
              onClick={addLine}
              className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80 active:scale-[0.99]"
              style={{ background: 'rgba(123,47,247,0.05)', color: '#7B2FF7', border: '1px dashed rgba(123,47,247,0.25)' }}
            >
              + Regel toevoegen
            </button>

            {/* Totals block */}
            <div
              className="mt-4 rounded-xl p-4"
              style={{ background: 'rgba(7,22,47,0.03)', border: '1px solid rgba(189,239,255,0.45)' }}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Subtotaal</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: '#07162F' }}>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">BTW ({vatPct}%)</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: '#07162F' }}>{fmt(vat)}</span>
                </div>
                <div
                  className="flex justify-between items-center pt-2.5 mt-0.5"
                  style={{ borderTop: '1px solid rgba(189,239,255,0.5)' }}
                >
                  <span className="text-sm font-black" style={{ color: '#07162F' }}>Totaal incl. BTW</span>
                  <span className="text-xl font-black tabular-nums" style={{ color: '#1E8BFF', letterSpacing: '-0.04em' }}>
                    {fmt(total)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ─── Submit button ──────────────────────────────────────── */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl py-4 text-sm font-black text-white transition-all disabled:opacity-40 active:scale-[0.99]"
          style={{
            background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)',
            boxShadow: canSubmit ? '0 8px 24px rgba(30,139,255,0.28)' : 'none',
            letterSpacing: '-0.01em',
          }}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Aanmaken…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <rect x="1.5" y="2" width="12" height="11" rx="2" stroke="white" strokeWidth="1.4"/>
                <path d="M4.5 7h6M4.5 9.5h4" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M7.5 2V5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Factuur aanmaken
              {total > 0 && (
                <>
                  <span style={{ opacity: 0.4, fontSize: 16 }}>·</span>
                  <span className="tabular-nums">{fmt(total)}</span>
                </>
              )}
            </span>
          )}
        </button>

      </form>

      <style jsx>{`
        .field-label {
          display: block;
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: #6C7A8D; margin-bottom: 6px;
        }
        .field {
          width: 100%; border-radius: 10px; padding: 9px 12px;
          font-size: 13px; font-family: inherit;
          background: rgba(247,251,255,0.9);
          border: 1.5px solid rgba(189,239,255,0.65);
          color: #07162F; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .field:focus { border-color: #1E8BFF; box-shadow: 0 0 0 3px rgba(30,139,255,0.08); }
        .field::placeholder { color: rgba(108,122,141,0.5); }
      `}</style>
    </div>
  );
}
