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
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#B07800' }} />
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
        <h2 className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-5">
          Klantgegevens
        </h2>

        <form id="client-form" onSubmit={handleSubmit} onChange={markDirty} className="space-y-4">

          <Field label="Bedrijfsnaam">
            <input name="name" defaultValue={client.name} required
              placeholder="bijv. Mojo Concerts" className="field" />
          </Field>

          <div style={{ borderTop: '1px solid rgba(189,239,255,0.4)', marginTop: 8 }} />

          <p className="text-[9px] font-black uppercase tracking-[0.16em]"
            style={{ color: 'rgba(108,122,141,0.6)' }}>Contact</p>

          <Field label="Contactpersoon">
            <input name="contactPerson" defaultValue={client.contactPerson ?? ''}
              placeholder="bijv. Jan de Vries" className="field" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="E-mail">
              <input name="email" type="email" defaultValue={client.email ?? ''}
                placeholder="jan@bedrijf.nl" className="field" />
            </Field>
            <Field label="Telefoon">
              <input name="phone" defaultValue={client.phone ?? ''}
                placeholder="+31 6 12345678" className="field" />
            </Field>
          </div>

          <Field label="Website">
            <input name="website" type="url" defaultValue={client.website ?? ''}
              placeholder="https://bedrijf.nl" className="field" />
          </Field>

          <div style={{ borderTop: '1px solid rgba(189,239,255,0.4)', marginTop: 8 }} />

          <p className="text-[9px] font-black uppercase tracking-[0.16em]"
            style={{ color: 'rgba(108,122,141,0.6)' }}>Intern</p>

          <Field label="Notities" hint="alleen voor jou zichtbaar">
            <textarea name="notes" defaultValue={client.notes ?? ''}
              placeholder="bijv. vaste klant, jaarcontract, contact via Erik…"
              rows={3} className="field resize-none" />
          </Field>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
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
                style={{ background: 'rgba(255,30,30,0.08)', color: '#CC1010' }}>
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
        .field-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: #6C7A8D;
        }
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
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6C7A8D' }}>
          {label}
        </label>
        {hint && <span className="text-[10px] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
