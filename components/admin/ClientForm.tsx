'use client';
import { useTransition, useState, useCallback, useEffect } from 'react';
import { updateClient, deleteClient } from '@/lib/actions';

type DeleteStep = 'idle' | 'confirm';

interface ClientData {
  id:            string;
  name:          string;
  contactPerson: string | null;
  email:         string | null;
  phone:         string | null;
  website:       string | null;
  notes:         string | null;
}

interface Props {
  client: ClientData;
}

export default function ClientForm({ client }: Props) {
  const [isPending,  startTransition] = useTransition();
  const [saved,      setSaved]        = useState(false);
  const [isDirty,    setIsDirty]      = useState(false);
  const [deleteStep, setDeleteStep]   = useState<DeleteStep>('idle');

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateClient(client.id, fd);
      setSaved(true);
      setIsDirty(false);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  const handleDelete = useCallback(() => {
    if (deleteStep === 'idle') { setDeleteStep('confirm'); return; }
    startTransition(() => deleteClient(client.id));
  }, [deleteStep, client.id]);

  function markDirty() { setIsDirty(true); }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.85)',
        border:     '1px solid rgba(189,239,255,0.55)',
        boxShadow:  '0 4px 16px rgba(7,22,47,0.06)',
      }}
    >
      {/* Unsaved banner */}
      {isDirty && (
        <div
          className="sticky top-0 z-20 flex items-center justify-between px-5 py-2.5"
          style={{
            background:     'rgba(255,184,0,0.10)',
            borderBottom:   '1px solid rgba(255,184,0,0.25)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#B07800' }} />
            <span className="text-xs font-bold" style={{ color: '#B07800' }}>Niet-opgeslagen wijzigingen</span>
          </div>
          <button
            type="submit" form="client-form" disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)' }}
          >
            {isPending
              ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5.5l2.5 2.5 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            }
            Nu opslaan
          </button>
        </div>
      )}

      <div className="p-6">
        {/* Section header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(30,139,255,0.1)' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="4.5" r="2.5" stroke="#1E8BFF" strokeWidth="1.3"/>
              <path d="M1.5 12c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="#1E8BFF" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Klantgegevens</p>
        </div>

        <form id="client-form" onSubmit={handleSubmit} onChange={markDirty} className="space-y-4">

          <Field label="Bedrijfsnaam">
            <input name="name" defaultValue={client.name} required
              placeholder="bijv. Mojo Concerts" className="field" />
          </Field>

          {/* Contact divider */}
          <SectionDivider label="Contact" color="#00C896">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M2 1.5h2l1 2.5-1.5 1a6 6 0 002.5 2.5l1-1.5 2.5 1v2A1 1 0 019 10C4 10 1 7 1 2a1 1 0 011-1z"
                stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
          </SectionDivider>

          <Field label="Contactpersoon">
            <input name="contactPerson" defaultValue={client.contactPerson ?? ''}
              placeholder="bijv. Jan de Vries" className="field" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="E-mail" icon={
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <rect x="1" y="2" width="9" height="7" rx="1.5" stroke="#6C7A8D" strokeWidth="1.1"/>
                <path d="M1 4l4.5 3L10 4" stroke="#6C7A8D" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
            }>
              <input name="email" type="email" defaultValue={client.email ?? ''}
                placeholder="jan@bedrijf.nl" className="field" />
            </Field>
            <Field label="Telefoon" icon={
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M2 1.5h2l1 2.5-1.5 1a6 6 0 002.5 2.5l1-1.5 2.5 1v2A1 1 0 019 10C4 10 1 7 1 2a1 1 0 011-1z"
                  stroke="#6C7A8D" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
            }>
              <input name="phone" defaultValue={client.phone ?? ''}
                placeholder="+31 6 12345678" className="field" />
            </Field>
          </div>

          <Field label="Website" icon={
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <circle cx="5.5" cy="5.5" r="4.5" stroke="#6C7A8D" strokeWidth="1.1"/>
              <path d="M5.5 1c-1.4 1.5-2 3-2 4.5s.6 3 2 4.5M5.5 1c1.4 1.5 2 3 2 4.5s-.6 3-2 4.5M1 5.5h9" stroke="#6C7A8D" strokeWidth="1.1"/>
            </svg>
          }>
            <input name="website" type="url" defaultValue={client.website ?? ''}
              placeholder="https://bedrijf.nl" className="field" />
          </Field>

          {/* Intern divider */}
          <SectionDivider label="Intern" color="#7B2FF7">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <rect x="1.5" y="1.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
              <path d="M3.5 4.5h4M3.5 6.5h2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
          </SectionDivider>

          <Field label="Notities" hint="alleen voor jou zichtbaar">
            <textarea name="notes" defaultValue={client.notes ?? ''}
              placeholder="bijv. vaste klant, jaarcontract, contact via Erik…"
              rows={3} className="field resize-none" />
          </Field>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit" disabled={isPending}
              className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-60 active:scale-[0.98]"
              style={{
                background: saved ? '#00C896' : 'linear-gradient(135deg, #1E8BFF, #20D6E8)',
                boxShadow:  saved ? '0 6px 20px rgba(0,200,150,0.3)' : '0 6px 20px rgba(30,139,255,0.25)',
              }}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Opslaan…
                </span>
              ) : saved ? (
                <span className="flex items-center justify-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l4 4 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Opgeslagen!
                </span>
              ) : 'Opslaan'}
            </button>

            {deleteStep === 'idle' ? (
              <button type="button" onClick={handleDelete} disabled={isPending}
                className="rounded-xl px-4 py-3 text-sm font-bold transition-all disabled:opacity-60"
                style={{ background: 'rgba(255,30,30,0.07)', color: '#CC1010', border: '1px solid rgba(255,30,30,0.12)' }}>
                Verwijder
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: 'rgba(255,30,30,0.06)', border: '1px solid rgba(255,30,30,0.2)' }}>
                <span className="text-xs font-bold" style={{ color: '#CC1010' }}>Zeker?</span>
                <button type="button" onClick={() => setDeleteStep('idle')}
                  className="text-[11px] font-bold text-muted hover:text-navy transition-colors">
                  Annuleer
                </button>
                <button type="button" onClick={handleDelete} disabled={isPending}
                  className="text-[11px] font-black px-2.5 py-1 rounded-lg text-white disabled:opacity-50"
                  style={{ background: '#CC1010' }}>
                  {isPending ? '…' : 'Ja'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      <style jsx>{`
        .field {
          width: 100%; border-radius: 12px; padding: 10px 14px;
          font-size: 14px; font-family: inherit;
          background: rgba(247,251,255,0.8);
          border: 1.5px solid rgba(189,239,255,0.6);
          color: #07162F; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .field:focus {
          border-color: #1E8BFF;
          box-shadow: 0 0 0 3px rgba(30,139,255,0.08);
        }
        .field::placeholder { color: rgba(108,122,141,0.6); }
      `}</style>
    </div>
  );
}

function SectionDivider({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3" style={{ marginTop: 8 }}>
      <div className="flex-1 h-px" style={{ background: 'rgba(189,239,255,0.4)' }} />
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.12em]"
        style={{ background: `${color}10`, color, border: `1px solid ${color}20` }}
      >
        <span style={{ color }}>{children}</span>
        {label}
      </div>
      <div className="flex-1 h-px" style={{ background: 'rgba(189,239,255,0.4)' }} />
    </div>
  );
}

function Field({ label, hint, icon, children }: { label: string; hint?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon && <span className="opacity-70">{icon}</span>}
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6C7A8D' }}>
          {label}
        </label>
        {hint && <span className="text-[10px] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
