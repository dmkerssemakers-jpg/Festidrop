'use client';
import { useRef, useState, useTransition } from 'react';
import { updateEvent, deleteEvent } from '@/lib/actions';
import type { Event } from '@prisma/client';

const COLORS = [
  { hex: '#1E8BFF', label: 'Blauw' },
  { hex: '#20D6E8', label: 'Aqua' },
  { hex: '#FF6B35', label: 'Oranje' },
  { hex: '#FF3CAC', label: 'Roze' },
  { hex: '#7B2FF7', label: 'Paars' },
  { hex: '#00C896', label: 'Groen' },
  { hex: '#FFB800', label: 'Goud' },
  { hex: '#FF1E5B', label: 'Rood' },
];

const PHOTO_OPTIONS = [5, 8, 10, 12, 15, 20];

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://festidrop.vercel.app';

interface Props {
  event: Event;
}

export default function EventForm({ event }: Props) {
  const [isPending, startTransition] = useTransition();
  const [color, setColor]           = useState(event.accentColor);
  const [maxPhotos, setMaxPhotos]   = useState(event.maxPhotos);
  const [isActive, setIsActive]     = useState(event.isActive);
  const [saved, setSaved]           = useState(false);
  const [logoUrl, setLogoUrl]       = useState(event.logoUrl ?? '');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set('accentColor', color);
    fd.set('maxPhotos', String(maxPhotos));
    fd.set('isActive', String(isActive));
    fd.set('slug', event.slug); // always keep original slug

    startTransition(async () => {
      await updateEvent(event.id, fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  const handleDelete = () => {
    if (!confirm(`Event "${event.name}" verwijderen? Dit kan niet ongedaan worden.`)) return;
    startTransition(() => deleteEvent(event.id));
  };

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.85)',
        border: '1px solid rgba(189,239,255,0.55)',
        boxShadow: '0 4px 16px rgba(7,22,47,0.06)',
      }}
    >
      <h2 className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-5">Instellingen</h2>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">

        {/* ── Sectie: Basis ──────────────────────────────── */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] mb-3"
             style={{ color: 'rgba(108,122,141,0.6)' }}>Basis</p>
          <div className="space-y-4">

            {/* Name */}
            <Field label="Naam">
              <input
                name="name"
                defaultValue={event.name}
                required
                placeholder="bijv. Lowlands 2026"
                className="field"
              />
            </Field>

            {/* Slug — locked */}
            <div>
              <div className="flex items-baseline gap-2 mb-1.5">
                <label className="field-label">Event URL</label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,184,0,0.12)', color: '#B07800' }}>
                  🔒 Vast na aanmaken
                </span>
              </div>
              <div
                className="flex items-center rounded-xl overflow-hidden text-sm"
                style={{ border: '1px solid rgba(189,239,255,0.6)', background: 'rgba(247,251,255,0.8)' }}
              >
                <span className="px-3 py-2.5 text-muted text-xs font-medium shrink-0 border-r"
                  style={{ borderColor: 'rgba(189,239,255,0.6)', background: 'rgba(189,239,255,0.15)' }}>
                  {BASE_URL}/
                </span>
                <span className="px-3 py-2.5 font-bold text-navy flex-1 text-sm">{event.slug}</span>
              </div>
              <input type="hidden" name="slug" value={event.slug} />
            </div>

            {/* Max photos — quick-select */}
            <div>
              <label className="field-label block mb-2">Max foto&apos;s per sessie</label>
              <div className="flex gap-2 flex-wrap">
                {PHOTO_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMaxPhotos(n)}
                    className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    style={maxPhotos === n
                      ? { background: event.accentColor, color: '#fff', boxShadow: `0 4px 12px ${event.accentColor}40` }
                      : { background: 'rgba(189,239,255,0.2)', color: '#07162F' }
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Status — pill toggle */}
            <div>
              <label className="field-label block mb-2">Status</label>
              <div
                className="inline-flex rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(189,239,255,0.6)', background: 'rgba(247,251,255,0.8)' }}
              >
                <button
                  type="button"
                  onClick={() => setIsActive(true)}
                  className="px-5 py-2 text-xs font-bold transition-all"
                  style={isActive
                    ? { background: '#00C896', color: '#fff' }
                    : { color: '#6C7A8D' }
                  }
                >
                  ● Actief
                </button>
                <button
                  type="button"
                  onClick={() => setIsActive(false)}
                  className="px-5 py-2 text-xs font-bold transition-all"
                  style={!isActive
                    ? { background: 'rgba(108,122,141,0.2)', color: '#6C7A8D' }
                    : { color: '#6C7A8D' }
                  }
                >
                  ○ Inactief
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(189,239,255,0.4)' }} />

        {/* ── Sectie: Personalisatie ──────────────────── */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] mb-3"
             style={{ color: 'rgba(108,122,141,0.6)' }}>Personalisatie</p>
          <div className="space-y-4">

            {/* Logo URL + live thumbnail */}
            <div>
              <label className="field-label block mb-1.5">
                Logo URL <span className="text-[10px] text-muted normal-case font-normal">optioneel</span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  name="logoUrl"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="field flex-1"
                />
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-9 w-9 rounded-lg object-contain border shrink-0"
                    style={{ borderColor: 'rgba(189,239,255,0.6)', background: '#fff', padding: '4px' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block'; }}
                  />
                )}
              </div>
            </div>

            {/* Email text */}
            <Field label="E-mail tekst" hint="optioneel — verschijnt in de bevestigingsmail">
              <textarea
                name="emailText"
                defaultValue={event.emailText ?? ''}
                placeholder="bijv. Bedankt voor je komst bij Lowlands 2026! 🎪"
                rows={2}
                className="field resize-none"
              />
            </Field>

            {/* Accent color */}
            <div>
              <label className="field-label block mb-2">Accentkleur</label>
              <div className="flex gap-2 flex-wrap items-center">
                {COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    title={c.label}
                    className="w-8 h-8 rounded-full transition-all relative flex items-center justify-center"
                    style={{
                      background: c.hex,
                      outline: color === c.hex ? `3px solid ${c.hex}` : undefined,
                      outlineOffset: color === c.hex ? '2px' : undefined,
                      opacity: color === c.hex ? 1 : 0.55,
                      transform: color === c.hex ? 'scale(1.18)' : undefined,
                    }}
                  >
                    {color === c.hex && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded-full cursor-pointer border-0 opacity-70 hover:opacity-100 transition-opacity"
                  title="Aangepaste kleur"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Actions ─────────────────────────────────── */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-60 active:scale-[0.98]"
            style={{
              background: saved
                ? '#00C896'
                : 'linear-gradient(135deg, #1E8BFF, #20D6E8)',
              boxShadow: saved
                ? '0 6px 20px rgba(0,200,150,0.3)'
                : '0 6px 20px rgba(30,139,255,0.25)',
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

          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-xl px-4 py-3 text-sm font-bold transition-all disabled:opacity-60 hover:bg-red-50 active:scale-[0.97]"
            style={{ background: 'rgba(255,30,30,0.08)', color: '#CC1010' }}
          >
            Verwijder
          </button>
        </div>
      </form>

      <style jsx>{`
        .field-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6C7A8D;
        }
        .field {
          width: 100%;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          font-family: inherit;
          background: rgba(247,251,255,0.8);
          border: 1px solid rgba(189,239,255,0.6);
          color: #07162F;
          outline: none;
          transition: border-color 0.15s;
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
        <label className="field-label"
          style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6C7A8D' }}>
          {label}
        </label>
        {hint && <span className="text-[10px] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
