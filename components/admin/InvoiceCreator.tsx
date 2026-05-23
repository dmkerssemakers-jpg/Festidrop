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

  function addLine() {
    setLines(l => [...l, newLine()]);
  }

  function removeLine(key: string) {
    setLines(l => l.filter(x => x.key !== key));
  }

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

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const vat      = subtotal * vatPct / 100;
  const total    = subtotal + vat;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set('lines', JSON.stringify(lines.map(({ description, quantity, unitPrice }) => ({ description, quantity, unitPrice }))));
    startTransition(async () => { await createInvoice(fd); });
  };

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/invoices"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-navy transition-colors mb-6"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Alle facturen
      </Link>

      <h1 className="text-2xl font-black text-navy mb-6" style={{ letterSpacing: '-0.03em' }}>Nieuwe factuur</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Client + dates row */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.06)' }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-4">Klant &amp; gegevens</p>
          <div className="grid grid-cols-2 gap-4">
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
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
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
              <label className="field-label">Vervaldatum</label>
              <input name="dueDate" type="date" className="field" />
            </div>
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
              <label className="field-label">Notities <span className="normal-case font-normal text-[10px] text-muted ml-1">optioneel</span></label>
              <input name="notes" placeholder="Betalingskenmerk, project…" className="field" />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Regelitems</p>
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

          {/* Column headers */}
          <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: '1fr 80px 110px 80px 32px' }}>
            <span className="field-label">Omschrijving</span>
            <span className="field-label">Aantal</span>
            <span className="field-label">Prijs</span>
            <span className="field-label text-right">Totaal</span>
            <span />
          </div>

          <div className="space-y-2">
            {lines.map(line => (
              <div key={line.key} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 80px 110px 80px 32px' }}>
                <input
                  placeholder="Omschrijving…"
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted pointer-events-none">€</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={line.unitPrice}
                    onChange={e => updateLine(line.key, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="field pl-7 text-right"
                  />
                </div>
                <span className="text-sm font-bold text-navy text-right tabular-nums">
                  {fmt(line.quantity * line.unitPrice)}
                </span>
                <button
                  type="button"
                  onClick={() => removeLine(line.key)}
                  disabled={lines.length === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-25"
                  style={{ background: 'rgba(255,30,30,0.08)', color: '#CC1010' }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M2 2l7 7M9 2l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addLine}
            className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
            style={{ background: 'rgba(30,139,255,0.06)', color: '#1E8BFF', border: '1px dashed rgba(30,139,255,0.3)' }}
          >
            + Regel toevoegen
          </button>

          {/* Totals */}
          <div className="mt-4 pt-4 space-y-1.5" style={{ borderTop: '1px solid rgba(189,239,255,0.4)' }}>
            <div className="flex justify-between text-xs text-muted">
              <span>Subtotaal</span>
              <span className="font-bold text-navy tabular-nums">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>BTW ({vatPct}%)</span>
              <span className="font-bold text-navy tabular-nums">{fmt(vat)}</span>
            </div>
            <div className="flex justify-between text-base font-black pt-1"
              style={{ borderTop: '1px solid rgba(189,239,255,0.4)', color: '#07162F' }}>
              <span>Totaal</span>
              <span className="tabular-nums" style={{ color: '#1E8BFF' }}>{fmt(total)}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !clientId || lines.every(l => !l.description)}
          className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-50 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)', boxShadow: '0 6px 20px rgba(30,139,255,0.25)' }}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Aanmaken…
            </span>
          ) : 'Factuur aanmaken'}
        </button>
      </form>

      <style jsx>{`
        .field-label {
          display: block;
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: #6C7A8D; margin-bottom: 6px;
        }
        .field {
          width: 100%; border-radius: 12px; padding: 10px 14px;
          font-size: 14px; font-family: inherit;
          background: rgba(247,251,255,0.8);
          border: 1.5px solid rgba(189,239,255,0.6);
          color: #07162F; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .field:focus { border-color: #1E8BFF; box-shadow: 0 0 0 3px rgba(30,139,255,0.08); }
        .field::placeholder { color: rgba(108,122,141,0.6); }
      `}</style>
    </div>
  );
}
