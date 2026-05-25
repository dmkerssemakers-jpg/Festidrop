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
      { key: 'name',    label: 'Bedrijfsnaam',  placeholder: 'FestiDrop',            required: true,  full: true },
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
      { key: 'kvk',  label: 'KVK-nummer',  placeholder: '12345678',         required: false, full: false },
      { key: 'btw',  label: 'BTW-nummer',  placeholder: 'NL123456789B01',   required: false, full: false },
      { key: 'iban', label: 'IBAN',        placeholder: 'NL00INGB0000000000', required: false, full: true },
      { key: 'bank', label: 'Banknaam',    placeholder: 'ING',              required: false, full: false },
    ],
  },
] as const;

type FieldKey = keyof CompanySettings;

export default function SettingsForm({ initial }: { initial: CompanySettings }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [values, setValues] = useState<CompanySettings>({ ...initial });

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

  // Completeness indicator
  const required: FieldKey[] = ['name', 'kvk', 'btw', 'iban'];
  const filled = required.filter(k => values[k].trim()).length;
  const pct    = Math.round((filled / required.length) * 100);

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 640 }} className="space-y-4">

      {/* Completeness bar */}
      <div
        className="rounded-2xl p-4 flex items-center gap-4"
        style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 2px 12px rgba(7,22,47,0.04)' }}
      >
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-navy">Factuurvolledigheid</p>
            <p className="text-xs font-black" style={{ color: pct === 100 ? '#00C896' : '#1E8BFF' }}>{pct}%</p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(189,239,255,0.3)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct === 100 ? 'linear-gradient(90deg,#00C896,#00A878)' : 'linear-gradient(90deg,#1E8BFF,#20D6E8)' }}
            />
          </div>
        </div>
        <p className="text-[11px] text-muted shrink-0">
          {pct === 100 ? '✓ Klaar voor factuurafdruk' : `${required.length - filled} verplichte velden ontbreken`}
        </p>
      </div>

      {SECTIONS.map(section => (
        <div
          key={section.id}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.05)' }}
        >
          <div className="h-1" style={{ background: section.grad }} />
          <div className="p-5">

            {/* Section header */}
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

      {/* Preview strip */}
      {values.name && (
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(7,22,47,0.03)', border: '1px solid rgba(189,239,255,0.4)' }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-3">Voorbeeld op factuur</p>
          <div className="flex items-start gap-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#1E8BFF,#20D6E8)' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="4" width="16" height="11" rx="2.5" fill="white" fillOpacity=".9"/>
                <circle cx="9" cy="9.5" r="2.8" stroke="#1E8BFF" strokeWidth="1.4" fill="none"/>
                <path d="M6.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1" stroke="#1E8BFF" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-xs leading-relaxed text-muted">
              <p className="font-black text-navy text-sm">{values.name}</p>
              {values.address && <p>{values.address}</p>}
              {values.city    && <p>{values.city}</p>}
              {values.email   && <p>{values.email}</p>}
              {(values.kvk || values.btw) && (
                <p className="mt-1">
                  {values.kvk && `KVK ${values.kvk}`}
                  {values.kvk && values.btw && ' · '}
                  {values.btw && `BTW ${values.btw}`}
                </p>
              )}
              {values.iban && <p className="mt-1 font-mono text-[11px]">IBAN {values.iban}{values.bank && ` (${values.bank})`}</p>}
            </div>
          </div>
        </div>
      )}

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
              <rect x="1" y="1" width="13" height="13" rx="2.5" stroke="white" strokeWidth="1.4"/>
              <path d="M4 7.5h7M7.5 4v7" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Instellingen opslaan
          </span>
        )}
      </button>

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
