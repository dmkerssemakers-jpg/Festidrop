import { createClient } from '@/lib/actions';
import Link from 'next/link';

export default function NewClientPage() {
  return (
    <div style={{ maxWidth: 560 }}>
      {/* Back */}
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-navy transition-colors mb-6"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Alle klanten
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy" style={{ letterSpacing: '-0.03em' }}>
            Nieuwe klant
          </h1>
          <p className="text-sm text-muted mt-0.5">Voeg een klant toe en koppel events aan hem</p>
        </div>
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: 'rgba(123,47,247,0.06)', border: '1px solid rgba(123,47,247,0.15)' }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="4.5" r="2.5" stroke="#7B2FF7" strokeWidth="1.1"/>
            <path d="M1 11.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="#7B2FF7" strokeWidth="1.1" strokeLinecap="round"/>
            <path d="M9.5 4v3M8 5.5h3" stroke="#7B2FF7" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
          <span className="text-xs font-black" style={{ color: '#7B2FF7' }}>Klantprofiel</span>
        </div>
      </div>

      <form action={createClient} className="space-y-4">

        {/* ── Identiteit ─────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.05)' }}
        >
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #1E8BFF, #20D6E8)' }} />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white shrink-0"
                style={{ background: '#1E8BFF' }}>
                1
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Bedrijfsidentiteit</p>
            </div>

            <Field label="Bedrijfsnaam" required>
              <input
                name="name"
                required
                placeholder="bijv. Mojo Concerts"
                autoFocus
                className="client-field"
              />
            </Field>
          </div>
        </div>

        {/* ── Contact ─────────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.05)' }}
        >
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #7B2FF7, #1E8BFF)' }} />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white shrink-0"
                style={{ background: '#7B2FF7' }}>
                2
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Contactgegevens</p>
            </div>

            <div className="space-y-3">
              <Field label="Contactpersoon">
                <input name="contactPerson" placeholder="bijv. Jan de Vries" className="client-field" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="E-mail">
                  <input name="email" type="email" placeholder="jan@bedrijf.nl" className="client-field" />
                </Field>
                <Field label="Telefoon">
                  <input name="phone" placeholder="+31 6 12345678" className="client-field" />
                </Field>
              </div>

              <Field label="Website">
                <input name="website" type="url" placeholder="https://bedrijf.nl" className="client-field" />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Intern ──────────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 4px 16px rgba(7,22,47,0.05)' }}
        >
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #00C896, #1E8BFF)' }} />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white shrink-0"
                style={{ background: '#00A878' }}>
                3
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Intern</p>
              <span className="text-[10px] text-muted">(alleen voor jou zichtbaar)</span>
            </div>

            <Field label="Notities">
              <textarea
                name="notes"
                placeholder="bijv. vaste klant, jaarcontract, factuuradres…"
                rows={3}
                className="client-field"
                style={{ resize: 'none' }}
              />
            </Field>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full rounded-xl py-4 text-sm font-black text-white transition-all hover:opacity-90 active:scale-[0.99]"
          style={{
            background:  'linear-gradient(135deg, #7B2FF7, #1E8BFF)',
            boxShadow:   '0 8px 24px rgba(123,47,247,0.28)',
            letterSpacing: '-0.01em',
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="5.5" r="3.5" stroke="white" strokeWidth="1.4"/>
              <path d="M1 13c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M11 3.5v4M9 5.5h4" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Klant aanmaken
          </span>
        </button>

      </form>

      <style jsx>{`
        .client-field {
          width: 100%;
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 13px;
          font-family: inherit;
          background: rgba(247,251,255,0.9);
          border: 1.5px solid rgba(189,239,255,0.65);
          color: #07162F;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .client-field:focus {
          border-color: #1E8BFF;
          box-shadow: 0 0 0 3px rgba(30,139,255,0.08);
        }
        .client-field::placeholder {
          color: rgba(108,122,141,0.45);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6C7A8D' }}>
          {label}
        </label>
        {required && (
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(30,139,255,0.1)', color: '#1E8BFF' }}>
            verplicht
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
