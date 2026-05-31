'use client';
import { useTransition, useState } from 'react';
import { saveSettings } from '@/lib/actions';
import type { CompanySettings } from '@/lib/settings';

const SECTIONS = [
  {
    id:    'identiteit',
    step:  '1',
    color: '#1E8BFF',
    grad:  'linear-gradient(90deg,#1E8BFF,#20D6E8)',
    label: 'Bedrijfsidentiteit',
    fields: [
      { key: 'name',    label: 'Bedrijfsnaam',  placeholder: 'FestiDrop',            required: true,  full: true  },
      { key: 'email',   label: 'E-mail',         placeholder: 'info@festidrop.nl',    required: false, full: false },
      { key: 'website', label: 'Website',         placeholder: 'www.festidrop.nl',    required: false, full: false },
      { key: 'address', label: 'Adres',           placeholder: 'Straatnaam 1',        required: false, full: false },
      { key: 'city',    label: 'Postcode + stad', placeholder: '1234 AB Amsterdam',   required: false, full: false },
    ],
  },
  {
    id:    'fiscaal',
    step:  '2',
    color: '#7B2FF7',
    grad:  'linear-gradient(90deg,#7B2FF7,#1E8BFF)',
    label: 'Fiscale gegevens',
    fields: [
      { key: 'kvk',  label: 'KVK-nummer',  placeholder: '12345678',           required: true,  full: false },
      { key: 'btw',  label: 'BTW-nummer',  placeholder: 'NL123456789B01',     required: true,  full: false },
      { key: 'iban', label: 'IBAN',        placeholder: 'NL00INGB0000000000', required: true,  full: true  },
      { key: 'bank', label: 'Banknaam',    placeholder: 'ING',                required: false, full: false },
    ],
  },
] as const;

type FieldKey = keyof CompanySettings;
type FieldConfig = { key: FieldKey; label: string; placeholder: string; required: boolean; full: boolean };

// Single source of truth: the fields flagged `required` in SECTIONS drive the
// inline "verplicht" badge, the completeness bar and the checklist alike — so
// they can never disagree about which fields are required.
const REQUIRED_FIELDS: FieldConfig[] = SECTIONS
  .flatMap(s => s.fields as readonly FieldConfig[])
  .filter(f => f.required);
const REQUIRED = REQUIRED_FIELDS.map(f => f.key);
const REQUIRED_LABELS: Record<string, string> = Object.fromEntries(
  REQUIRED_FIELDS.map(f => [f.key, f.label]),
);

export default function SettingsForm({ initial }: { initial: CompanySettings }) {
  const [isPending, startTransition] = useTransition();
  const [saved,     setSaved]        = useState(false);
  const [values,    setValues]       = useState<CompanySettings>({ ...initial });

  const set = (k: FieldKey, v: string) => {
    setValues(prev => ({ ...prev, [k]: v }));
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await saveSettings(fd);
      setSaved(true);
    });
  };

  const filled = REQUIRED.filter(k => values[k].trim()).length;
  const pct    = Math.round((filled / REQUIRED.length) * 100);
  const allDone = pct === 100;

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">

        {/* ── LEFT: form ─────────────────────────────────────────────────────── */}
        <div className="space-y-4 min-w-0">

          {/* Completeness bar */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 2px 12px rgba(7,22,47,0.04)' }}
          >
            <div
              className="h-1 transition-all duration-500"
              style={{ width: `${pct}%`, background: allDone ? 'linear-gradient(90deg,#00C896,#00A878)' : 'linear-gradient(90deg,#1E8BFF,#20D6E8)' }}
            />
            <div className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-navy">Factuurvolledigheid</p>
                  <p className="text-xs font-black" style={{ color: allDone ? '#00C896' : '#1E8BFF' }}>{pct}%</p>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(189,239,255,0.3)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: allDone ? 'linear-gradient(90deg,#00C896,#00A878)' : 'linear-gradient(90deg,#1E8BFF,#20D6E8)' }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {REQUIRED.map(k => (
                  <div
                    key={k}
                    title={REQUIRED_LABELS[k]}
                    className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
                    style={values[k].trim()
                      ? { background: 'rgba(0,200,150,0.12)', color: '#00C896' }
                      : { background: 'rgba(189,239,255,0.3)', color: '#B0BFCC' }
                    }
                  >
                    {values[k].trim() ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <circle cx="4" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sections */}
          {SECTIONS.map(section => (
            <div
              key={section.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.05)' }}
            >
              <div className="h-1" style={{ background: section.grad }} />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white shrink-0"
                    style={{ background: section.color }}
                  >
                    {section.step}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">{section.label}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {section.fields.map(field => (
                    <div key={field.key} className={field.full ? 'col-span-2' : ''}>
                      <label className="field-label">
                        {field.label}
                        {field.required && (
                          <span className="ml-1 text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: 'rgba(30,139,255,0.1)', color: '#1E8BFF' }}>
                            verplicht
                          </span>
                        )}
                      </label>
                      <input
                        name={`company.${field.key}`}
                        value={values[field.key as FieldKey]}
                        onChange={e => set(field.key as FieldKey, e.target.value)}
                        placeholder={field.placeholder}
                        className={`field${values[field.key as FieldKey] ? ' filled' : ''}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl py-4 text-sm font-black text-white transition-all disabled:opacity-50 active:scale-[0.99]"
            style={{
              background: saved
                ? 'linear-gradient(135deg,#00A878,#00C896)'
                : 'linear-gradient(135deg,#1E8BFF,#20D6E8)',
              boxShadow: saved
                ? '0 8px 24px rgba(0,200,150,0.28)'
                : '0 8px 24px rgba(30,139,255,0.28)',
              letterSpacing: '-0.01em',
            }}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Opslaan…
              </span>
            ) : saved ? (
              <span className="flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l4 4 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Instellingen opgeslagen!
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M2 13V5.5L7.5 2 13 5.5V13H9.5v-4h-4v4H2z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Instellingen opslaan
              </span>
            )}
          </button>
        </div>

        {/* ── RIGHT: sticky preview + checklist ─────────────────────────────── */}
        <div className="space-y-4 self-start sticky top-6">

          {/* Mini invoice preview */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.05)' }}
          >
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #1E8BFF, #20D6E8, #00C896)' }} />
            <div className="p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-3">Voorbeeld op factuur</p>

              {/* Mini factuur header */}
              <div
                className="rounded-xl p-4 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(240,245,255,0.8), white)', border: '1px solid rgba(189,239,255,0.5)' }}
              >
                {/* Colored top bar */}
                <div className="h-1 rounded-full mb-3" style={{ background: 'linear-gradient(90deg, #1E8BFF, #20D6E8, #00C896)' }} />

                <div className="flex items-start justify-between gap-2">
                  {/* Company block */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                          <rect x="2" y="5" width="16" height="11" rx="2.5" fill="white" fillOpacity=".9"/>
                          <circle cx="10" cy="10.5" r="2.8" stroke="#1E8BFF" strokeWidth="1.5" fill="none"/>
                          <path d="M7.5 5V4A1 1 0 018.5 3h3a1 1 0 011 1v1" stroke="#1E8BFF" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span className="text-sm font-black text-navy truncate" style={{ letterSpacing: '-0.02em' }}>
                        {values.name || <span style={{ color: '#B0BFCC', fontWeight: 500, fontSize: 11 }}>Bedrijfsnaam…</span>}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: '#6C7A8D', lineHeight: 1.7 }}>
                      {values.address && <p className="truncate">{values.address}</p>}
                      {values.city    && <p className="truncate">{values.city}</p>}
                      {values.email   && <p className="truncate">{values.email}</p>}
                      {values.website && <p className="truncate">{values.website}</p>}
                      {!values.address && !values.city && !values.email && !values.website && (
                        <p style={{ color: '#B0BFCC' }}>adres · email · website</p>
                      )}
                    </div>
                    {(values.kvk || values.btw) && (
                      <div className="mt-1.5" style={{ fontSize: 9, color: '#9CA3AF' }}>
                        {values.kvk && <span>KVK: <span style={{ color: '#07162F', fontWeight: 700 }}>{values.kvk}</span></span>}
                        {values.kvk && values.btw && <span style={{ margin: '0 4px' }}>·</span>}
                        {values.btw && <span>BTW: <span style={{ color: '#07162F', fontWeight: 700 }}>{values.btw}</span></span>}
                      </div>
                    )}
                  </div>

                  {/* FACTUUR label */}
                  <div className="text-right shrink-0">
                    <p style={{ fontSize: 14, fontWeight: 900, color: '#07162F', letterSpacing: '-0.04em' }}>FACTUUR</p>
                    <p style={{ fontSize: 9, fontWeight: 700, color: '#1E8BFF' }}>FD-2025-001</p>
                  </div>
                </div>

                {/* IBAN strip */}
                {values.iban && (
                  <div
                    className="mt-3 pt-3 flex items-center gap-2"
                    style={{ borderTop: '1px solid rgba(189,239,255,0.5)' }}
                  >
                    <span style={{ fontSize: 9, color: '#9CA3AF', flexShrink: 0 }}>IBAN</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#07162F', fontVariantNumeric: 'tabular-nums' }}>
                      {values.iban}
                    </span>
                    {values.bank && (
                      <span style={{ fontSize: 9, color: '#9CA3AF', marginLeft: 2 }}>({values.bank})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.05)' }}
          >
            <div className="h-1" style={{ background: allDone ? 'linear-gradient(90deg,#00C896,#00A878)' : 'linear-gradient(90deg,#7B2FF7,#1E8BFF)' }} />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Vereiste velden</p>
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={allDone
                    ? { background: 'rgba(0,200,150,0.1)', color: '#00A878' }
                    : { background: 'rgba(30,139,255,0.08)', color: '#1E8BFF' }
                  }
                >
                  {filled}/{REQUIRED.length}
                </span>
              </div>
              <div className="space-y-2">
                {REQUIRED.map(k => {
                  const done = !!values[k].trim();
                  return (
                    <div key={k} className="flex items-center gap-2.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
                        style={done
                          ? { background: 'rgba(0,200,150,0.12)', color: '#00C896' }
                          : { background: 'rgba(189,239,255,0.3)', color: '#B0BFCC' }
                        }
                      >
                        {done ? (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <circle cx="4" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
                          </svg>
                        )}
                      </div>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: done ? '#07162F' : '#9CA3AF' }}
                      >
                        {REQUIRED_LABELS[k]}
                      </span>
                      {done && values[k].length > 0 && (
                        <span className="text-[10px] text-muted truncate flex-1 min-w-0">
                          {values[k].length > 18 ? values[k].slice(0, 18) + '…' : values[k]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {allDone && (
                <div
                  className="mt-3 pt-3 flex items-center gap-2"
                  style={{ borderTop: '1px solid rgba(0,200,150,0.15)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#00C896" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-[10px] font-bold" style={{ color: '#00A878' }}>
                    Klaar voor factuurafdruk
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tip card */}
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(30,139,255,0.04)', border: '1px solid rgba(30,139,255,0.12)' }}
          >
            <div className="flex items-start gap-2.5">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(30,139,255,0.1)' }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" stroke="#1E8BFF" strokeWidth="1.2"/>
                  <path d="M5 4.5v3M5 3h.01" stroke="#1E8BFF" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-navy mb-1">Tip</p>
                <p className="text-[10px] text-muted leading-relaxed">
                  Deze gegevens verschijnen automatisch op elke factuur. Wijzigingen zijn direct zichtbaar in het voorbeeld.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .field-label {
          display: flex; align-items: center; gap: 4px;
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
        .field.filled { border-color: rgba(0,200,150,0.4); }
        .field.filled:focus { border-color: #00C896; box-shadow: 0 0 0 3px rgba(0,200,150,0.08); }
        .field::placeholder { color: rgba(108,122,141,0.45); }
      `}</style>
    </form>
  );
}
