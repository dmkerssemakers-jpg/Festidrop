'use client';
import { useState, useTransition, useRef } from 'react';
import { createEvent } from '@/lib/actions';

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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://festidrop.vercel.app';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function NewEventForm() {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [color, setColor] = useState('#1E8BFF');
  const [logoUrl, setLogoUrl] = useState('');
  const [maxPhotos, setMaxPhotos] = useState(10);
  const [emailText, setEmailText] = useState('');
  const slugTouched = useRef(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (!slugTouched.current) setSlug(toSlug(e.target.value));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    slugTouched.current = true;
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set('name', name);
    fd.set('slug', slug);
    fd.set('accentColor', color);
    fd.set('logoUrl', logoUrl);
    fd.set('maxPhotos', String(maxPhotos));
    fd.set('emailText', emailText);
    startTransition(() => createEvent(fd));
  };

  const previewUrl = slug ? `${BASE_URL}/${slug}` : `${BASE_URL}/jouw-event`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

      {/* ── Form ─────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'rgba(255,255,255,0.85)',
          border: '1px solid rgba(189,239,255,0.55)',
          boxShadow: '0 4px 16px rgba(7,22,47,0.06)',
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Section: Basis */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-3">Basis</p>
            <div className="space-y-3">

              {/* Name */}
              <div>
                <label className="field-label">Naam van het event</label>
                <input
                  value={name}
                  onChange={handleNameChange}
                  required
                  placeholder="bijv. Lowlands 2026"
                  className="field"
                />
              </div>

              {/* Slug / URL */}
              <div>
                <label className="field-label">Event URL</label>
                <div
                  className="flex items-center rounded-xl overflow-hidden text-sm"
                  style={{ border: '1px solid rgba(189,239,255,0.6)', background: 'rgba(247,251,255,0.8)' }}
                >
                  <span
                    className="px-3 py-2.5 text-muted text-xs font-medium shrink-0 border-r whitespace-nowrap"
                    style={{ borderColor: 'rgba(189,239,255,0.6)', background: 'rgba(189,239,255,0.15)' }}
                  >
                    {BASE_URL}/
                  </span>
                  <input
                    value={slug}
                    onChange={handleSlugChange}
                    required
                    placeholder="jouw-event"
                    className="flex-1 px-3 py-2.5 bg-transparent outline-none font-bold text-navy text-sm placeholder:text-muted placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Max photos */}
              <div>
                <label className="field-label">Max foto's per sessie</label>
                <div className="flex gap-2 flex-wrap">
                  {[5, 8, 10, 12, 15, 20].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMaxPhotos(n)}
                      className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                      style={maxPhotos === n
                        ? { background: '#1E8BFF', color: '#fff' }
                        : { background: 'rgba(189,239,255,0.2)', color: '#07162F' }
                      }
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(189,239,255,0.4)' }} />

          {/* Section: Personalisatie */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-3">Personalisatie</p>
            <div className="space-y-3">

              {/* Color */}
              <div>
                <label className="field-label">Accentkleur</label>
                <div className="flex gap-2 flex-wrap items-center">
                  {COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      className="w-8 h-8 rounded-full transition-all relative"
                      style={{
                        background: c.hex,
                        outline: color === c.hex ? `3px solid ${c.hex}` : undefined,
                        outlineOffset: color === c.hex ? '2px' : undefined,
                        opacity: color === c.hex ? 1 : 0.55,
                        transform: color === c.hex ? 'scale(1.15)' : undefined,
                      }}
                      title={c.label}
                    />
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

              {/* Logo */}
              <div>
                <label className="field-label">
                  Logo URL <span className="text-[10px] text-muted normal-case font-normal">optioneel</span>
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="field"
                />
              </div>

              {/* Email text */}
              <div>
                <label className="field-label">
                  E-mail tekst <span className="text-[10px] text-muted normal-case font-normal">optioneel</span>
                </label>
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  placeholder="bijv. Bedankt voor je komst! 🎪"
                  rows={2}
                  className="field resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending || !name || !slug}
            className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-40 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)', boxShadow: '0 8px 24px rgba(30,139,255,0.25)' }}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Event aanmaken…
              </span>
            ) : 'Event aanmaken →'}
          </button>
        </form>

        <style jsx>{`
          .field-label {
            display: block;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #6C7A8D;
            margin-bottom: 6px;
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

      {/* ── Live Preview ─────────────────────────────────────── */}
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Live preview</p>

        {/* Phone mockup */}
        <div
          className="rounded-3xl overflow-hidden mx-auto"
          style={{
            width: '280px',
            border: '8px solid #07162F',
            boxShadow: '0 24px 60px rgba(7,22,47,0.22)',
            background: '#F7FBFF',
          }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-4 py-2" style={{ background: '#07162F' }}>
            <span className="text-[10px] text-white/60 font-medium">9:41</span>
            <div className="flex gap-1">
              <div className="w-3 h-1.5 rounded-full bg-white/40" />
              <div className="w-4 h-1.5 rounded-full bg-white/40" />
              <div className="w-5 h-1.5 rounded-full bg-white/40" />
            </div>
          </div>

          {/* Header */}
          <div
            className="px-4 py-3 border-b flex items-center justify-center gap-2"
            style={{
              background: 'rgba(247,251,255,0.92)',
              borderColor: `${color}30`,
            }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-5 object-contain" />
            ) : (
              <>
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[8px] font-black"
                  style={{ background: color }}
                >
                  FD
                </div>
                <span className="text-[11px] font-black text-navy" style={{ letterSpacing: '-0.02em' }}>
                  {name || 'Jouw event'}
                </span>
              </>
            )}
          </div>

          {/* Camera area */}
          <div className="p-3">
            <div
              className="rounded-xl aspect-square flex items-center justify-center text-white/30 text-xs font-medium mb-3"
              style={{ background: '#07162F' }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" opacity="0.4">
                <rect x="2" y="8" width="24" height="18" rx="3.5" stroke="white" strokeWidth="1.5"/>
                <circle cx="14" cy="17" r="5" stroke="white" strokeWidth="1.5"/>
                <path d="M10 8V6.5A1.5 1.5 0 0111.5 5h5A1.5 1.5 0 0118 6.5V8" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1 justify-center mb-3">
              {Array.from({ length: Math.min(maxPhotos, 10) }).map((_, i) => (
                <div key={i} className="rounded-full"
                  style={{
                    width: maxPhotos > 8 ? '6px' : '8px',
                    height: maxPhotos > 8 ? '6px' : '8px',
                    background: i < 3 ? color : 'rgba(189,239,255,0.4)',
                  }}
                />
              ))}
              {maxPhotos > 10 && <span className="text-[8px] text-muted">+{maxPhotos - 10}</span>}
            </div>

            {/* Shutter */}
            <div className="flex justify-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(145deg, #FF3838, #C00000)', boxShadow: '0 4px 12px rgba(255,30,30,0.35)' }}
              >
                <div className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-white/15" />
                </div>
              </div>
            </div>
          </div>

          {/* URL bar */}
          <div className="px-3 pb-3">
            <div
              className="rounded-lg px-3 py-1.5 text-[9px] font-medium truncate"
              style={{ background: 'rgba(189,239,255,0.2)', color: color }}
            >
              {previewUrl}
            </div>
          </div>
        </div>

        {/* QR hint */}
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(189,239,255,0.4)' }}
        >
          <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
            style={{ background: `${color}18` }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" stroke={color} strokeWidth="1.3"/>
              <rect x="10" y="1" width="5" height="5" rx="1" stroke={color} strokeWidth="1.3"/>
              <rect x="1" y="10" width="5" height="5" rx="1" stroke={color} strokeWidth="1.3"/>
              <rect x="3" y="3" width="1" height="1" fill={color}/>
              <rect x="12" y="3" width="1" height="1" fill={color}/>
              <rect x="3" y="12" width="1" height="1" fill={color}/>
              <path d="M10 10h2v2h-2zM12 12h3M12 10h3v2" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-xs font-bold text-navy mb-0.5">QR-code</p>
          <p className="text-[10px] text-muted">Automatisch gegenereerd na aanmaken</p>
        </div>
      </div>
    </div>
  );
}
