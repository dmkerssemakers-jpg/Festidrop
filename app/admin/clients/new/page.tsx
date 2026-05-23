import { createClient } from '@/lib/actions';
import Link from 'next/link';

export default function NewClientPage() {
  return (
    <div className="max-w-xl">
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-navy transition-colors mb-6"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Alle klanten
      </Link>

      <h1 className="text-2xl font-black text-navy mb-6" style={{ letterSpacing: '-0.03em' }}>
        Nieuwe klant
      </h1>

      <div
        className="rounded-2xl p-6"
        style={{
          background: 'rgba(255,255,255,0.85)',
          border:     '1px solid rgba(189,239,255,0.55)',
          boxShadow:  '0 4px 16px rgba(7,22,47,0.06)',
        }}
      >
        <form action={createClient} className="space-y-4">

          <Field label="Bedrijfsnaam">
            <input name="name" required placeholder="bijv. Mojo Concerts" autoFocus className="field" />
          </Field>

          <div style={{ borderTop: '1px solid rgba(189,239,255,0.4)' }} />

          <p className="text-[9px] font-black uppercase tracking-[0.16em]"
            style={{ color: 'rgba(108,122,141,0.6)' }}>Contact</p>

          <Field label="Contactpersoon">
            <input name="contactPerson" placeholder="bijv. Jan de Vries" className="field" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="E-mail">
              <input name="email" type="email" placeholder="jan@bedrijf.nl" className="field" />
            </Field>
            <Field label="Telefoon">
              <input name="phone" placeholder="+31 6 12345678" className="field" />
            </Field>
          </div>

          <Field label="Website">
            <input name="website" type="url" placeholder="https://bedrijf.nl" className="field" />
          </Field>

          <div style={{ borderTop: '1px solid rgba(189,239,255,0.4)' }} />

          <p className="text-[9px] font-black uppercase tracking-[0.16em]"
            style={{ color: 'rgba(108,122,141,0.6)' }}>Intern</p>

          <Field label="Notities" hint="alleen voor jou zichtbaar">
            <textarea name="notes" placeholder="bijv. vaste klant, jaarcontract…"
              rows={3} className="field resize-none" />
          </Field>

          <button
            type="submit"
            className="w-full rounded-xl py-3 text-sm font-bold text-white mt-2"
            style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)', boxShadow: '0 6px 20px rgba(30,139,255,0.25)' }}
          >
            Klant aanmaken
          </button>
        </form>
      </div>

      <style jsx>{`
        .field {
          width: 100%; border-radius: 12px; padding: 10px 14px;
          font-size: 14px; font-family: inherit;
          background: rgba(247,251,255,0.8);
          border: 1px solid rgba(189,239,255,0.6);
          color: #07162F; outline: none; transition: border-color 0.15s;
        }
        .field:focus { border-color: #1E8BFF; }
        .field::placeholder { color: #6C7A8D; }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#6C7A8D' }}>
          {label}
        </label>
        {hint && <span className="text-[10px] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
