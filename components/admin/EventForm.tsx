'use client';
import { useRef, useState, useTransition, useEffect, useCallback } from 'react';
import { updateEvent, deleteEvent } from '@/lib/actions';
import type { Event } from '@prisma/client';

type UploadState  = 'idle' | 'uploading' | 'done' | 'error';
type DeleteStep   = 'idle' | 'confirm';

const COLORS = [
  { hex: '#1E8BFF', label: 'Blauw'  },
  { hex: '#20D6E8', label: 'Aqua'   },
  { hex: '#FF6B35', label: 'Oranje' },
  { hex: '#FF3CAC', label: 'Roze'   },
  { hex: '#7B2FF7', label: 'Paars'  },
  { hex: '#00C896', label: 'Groen'  },
  { hex: '#FFB800', label: 'Goud'   },
  { hex: '#FF1E5B', label: 'Rood'   },
];

const PHOTO_OPTIONS = [5, 8, 10, 12, 15, 20];
const BASE_URL      = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://festidrop.vercel.app';

interface Props {
  event:    Event;
  eventUrl: string;
}

export default function EventForm({ event, eventUrl }: Props) {
  const [isPending,    startTransition] = useTransition();
  const [color,        setColor]        = useState(event.accentColor);
  const [maxPhotos,    setMaxPhotos]    = useState(event.maxPhotos);
  const [isActive,     setIsActive]     = useState(event.isActive);
  const [saved,        setSaved]        = useState(false);
  const [isDirty,      setIsDirty]      = useState(false);
  const [logoUrl,      setLogoUrl]      = useState(event.logoUrl ?? '');
  const [showCode,     setShowCode]     = useState(false);
  const [uploadState,  setUploadState]  = useState<UploadState>('idle');
  const [uploadError,  setUploadError]  = useState('');
  const [deleteStep,   setDeleteStep]   = useState<DeleteStep>('idle');
  const [urlCopied,    setUrlCopied]    = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef      = useRef<HTMLFormElement>(null);

  const endsAtValue = event.endsAt
    ? new Date(event.endsAt).toISOString().slice(0, 16)
    : '';

  // ── Warn before unload when dirty ────────────────────────────────────────
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ── Logo upload ───────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState('uploading');
    setUploadError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res  = await fetch('/api/admin/upload-logo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload mislukt');
      setLogoUrl(data.url);
      setUploadState('done');
      setIsDirty(true);
    } catch (err) {
      setUploadState('error');
      setUploadError(err instanceof Error ? err.message : 'Upload mislukt');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set('accentColor', color);
    fd.set('maxPhotos',   String(maxPhotos));
    fd.set('isActive',    String(isActive));
    fd.set('slug',        event.slug);

    startTransition(async () => {
      await updateEvent(event.id, fd);
      setSaved(true);
      setIsDirty(false);
      setDeleteStep('idle');
      setTimeout(() => setSaved(false), 2500);
    });
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    if (deleteStep === 'idle') { setDeleteStep('confirm'); return; }
    startTransition(() => deleteEvent(event.id));
  }, [deleteStep, event.id]);

  // ── Copy URL ─────────────────────────────────────────────────────────────
  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(eventUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 1800);
  };

  // ── Dirty helpers ─────────────────────────────────────────────────────────
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
      {/* ── Sticky unsaved banner ──────────────────────────── */}
      {isDirty && (
        <div
          className="sticky top-0 z-20 flex items-center justify-between px-5 py-2.5"
          style={{
            background:   'rgba(255,184,0,0.10)',
            borderBottom: '1px solid rgba(255,184,0,0.25)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#B07800' }} />
            <span className="text-xs font-bold" style={{ color: '#B07800' }}>
              Niet-opgeslagen wijzigingen
            </span>
          </div>
          <button
            type="submit"
            form="event-form"
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
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

      {/* ── Form body ──────────────────────────────────────── */}
      <div className="p-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-5">
          Instellingen
        </h2>

        <form id="event-form" ref={formRef} onSubmit={handleSubmit}
          onChange={markDirty}
          className="space-y-6"
        >

          {/* ── Sectie: Basis ──────────────────────────── */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] mb-3"
              style={{ color: 'rgba(108,122,141,0.6)' }}>Basis</p>
            <div className="space-y-4">

              <Field label="Naam">
                <input
                  name="name"
                  defaultValue={event.name}
                  required
                  placeholder="bijv. Lowlands 2026"
                  className="field"
                />
              </Field>

              {/* Slug — locked, with copy button */}
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
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    title={urlCopied ? 'Gekopieerd!' : 'Kopieer link'}
                    className="px-3 py-2.5 transition-all hover:opacity-70 shrink-0"
                    style={{ borderLeft: '1px solid rgba(189,239,255,0.6)', background: urlCopied ? 'rgba(0,200,150,0.1)' : 'transparent' }}
                  >
                    {urlCopied ? (
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 7l3 3 6-6" stroke="#00C896" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="#6C7A8D" strokeWidth="1.3"/>
                        <path d="M3 9H2a1 1 0 01-1-1V2a1 1 0 011-1h6a1 1 0 011 1v1" stroke="#6C7A8D" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                </div>
                <input type="hidden" name="slug" value={event.slug} />
              </div>

              {/* Max photos */}
              <div>
                <label className="field-label block mb-2">Max foto&apos;s per sessie</label>
                <div className="flex gap-2 flex-wrap">
                  {PHOTO_OPTIONS.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => { setMaxPhotos(n); markDirty(); }}
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

              {/* Status */}
              <div>
                <label className="field-label block mb-2">Status</label>
                <div
                  className="inline-flex rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(189,239,255,0.6)', background: 'rgba(247,251,255,0.8)' }}
                >
                  {[
                    { val: true,  label: '● Actief',   activeStyle: { background: '#00C896', color: '#fff' } },
                    { val: false, label: '○ Inactief',  activeStyle: { background: 'rgba(108,122,141,0.2)', color: '#6C7A8D' } },
                  ].map(opt => (
                    <button
                      key={String(opt.val)}
                      type="button"
                      onClick={() => { setIsActive(opt.val); markDirty(); }}
                      className="px-5 py-2 text-xs font-bold transition-all"
                      style={isActive === opt.val ? opt.activeStyle : { color: '#6C7A8D' }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Access code */}
              <div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <label className="field-label">Toegangscode</label>
                  <span className="text-[10px] text-muted">optioneel — gasten moeten code invoeren</span>
                </div>
                <div className="relative">
                  <input
                    name="accessCode"
                    type={showCode ? 'text' : 'password'}
                    defaultValue={event.accessCode ?? ''}
                    placeholder="bijv. lowlands2026"
                    autoComplete="new-password"
                    className="field pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-navy transition-colors"
                    tabIndex={-1}
                  >
                    {showCode ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 2l12 12M6.5 6.6A2 2 0 0010.4 9.5M4.3 4.4C2.9 5.3 1.8 6.5 1 8c1.5 3 4.1 5 7 5 1.3 0 2.5-.4 3.6-1M7 3.1C7.3 3 7.7 3 8 3c2.9 0 5.5 2 7 5-.5 1-1.2 2-2 2.7"
                          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M1 8c1.5-3 4.1-5 7-5s5.5 2 7 5c-1.5 3-4.1 5-7 5S2.5 11 1 8z"
                          stroke="currentColor" strokeWidth="1.3"/>
                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Auto end date */}
              <div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <label className="field-label">Automatisch eindigen</label>
                  <span className="text-[10px] text-muted">optioneel</span>
                </div>
                <input name="endsAt" type="datetime-local" defaultValue={endsAtValue} className="field" />
                {event.endsAt && new Date(event.endsAt) < new Date() && (
                  <p className="text-[11px] mt-1 font-medium" style={{ color: '#FF6B35' }}>
                    ⚠ Einddatum is verstreken — event is automatisch gestopt
                  </p>
                )}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(189,239,255,0.4)' }} />

          {/* ── Sectie: Personalisatie ──────────────────── */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] mb-3"
              style={{ color: 'rgba(108,122,141,0.6)' }}>Personalisatie</p>
            <div className="space-y-4">

              {/* Logo */}
              <div>
                <label className="field-label block mb-1.5">
                  Logo <span className="text-[10px] text-muted normal-case font-normal">optioneel</span>
                </label>
                <div className="flex gap-2 items-center mb-2">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadState === 'uploading'}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
                    style={{
                      background: uploadState === 'done' ? 'rgba(0,200,150,0.12)' : 'rgba(30,139,255,0.10)',
                      border:     uploadState === 'done' ? '1px solid rgba(0,200,150,0.3)' : '1px solid rgba(30,139,255,0.25)',
                      color:      uploadState === 'done' ? '#00A878' : '#1E8BFF',
                    }}
                  >
                    {uploadState === 'uploading' ? (
                      <span className="w-3.5 h-3.5 border-2 border-blue-300/40 border-t-blue-400 rounded-full animate-spin" />
                    ) : uploadState === 'done' ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1v7M3 4l3-3 3 3M1 10h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {uploadState === 'uploading' ? 'Uploaden…' : uploadState === 'done' ? 'Geüpload!' : 'Upload afbeelding'}
                  </button>
                  <span className="text-[10px] text-muted font-medium">of</span>
                  <input
                    name="logoUrl"
                    type="url"
                    value={logoUrl}
                    onChange={e => { setLogoUrl(e.target.value); setUploadState('idle'); markDirty(); }}
                    placeholder="https://..."
                    className="field flex-1 min-w-0"
                  />
                  {logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt=""
                      className="h-9 w-9 rounded-lg object-contain border shrink-0"
                      style={{ borderColor: 'rgba(189,239,255,0.6)', background: '#fff', padding: '4px' }}
                      onError={e  => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      onLoad={e   => { (e.target as HTMLImageElement).style.display = 'block'; }}
                    />
                  )}
                </div>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => { setLogoUrl(''); setUploadState('idle'); setUploadError(''); markDirty(); }}
                    className="text-[10px] font-semibold transition-colors hover:opacity-70"
                    style={{ color: '#6C7A8D' }}
                  >
                    × Logo verwijderen
                  </button>
                )}
                {uploadState === 'error' && uploadError && (
                  <p className="text-[11px] mt-1 font-medium" style={{ color: '#FF6B35' }}>⚠ {uploadError}</p>
                )}
              </div>

              {/* Email text */}
              <Field label="E-mail tekst" hint="optioneel — verschijnt in de bevestigingsmail">
                <textarea
                  name="emailText"
                  defaultValue={event.emailText ?? ''}
                  placeholder="bijv. Bedankt voor je komst bij Lowlands 2026! 🎪"
                  rows={3}
                  className="field resize-none"
                />
              </Field>

              {/* Accent color */}
              <div>
                <label className="field-label block mb-2">Accentkleur</label>
                <div className="flex gap-2 flex-wrap items-center">
                  {COLORS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => { setColor(c.hex); markDirty(); }}
                      title={c.label}
                      className="w-8 h-8 rounded-full transition-all relative flex items-center justify-center"
                      style={{
                        background:    c.hex,
                        outline:       color === c.hex ? `3px solid ${c.hex}` : undefined,
                        outlineOffset: color === c.hex ? '2px' : undefined,
                        opacity:       color === c.hex ? 1 : 0.55,
                        transform:     color === c.hex ? 'scale(1.18)' : undefined,
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
                    onChange={e => { setColor(e.target.value); markDirty(); }}
                    className="w-8 h-8 rounded-full cursor-pointer border-0 opacity-70 hover:opacity-100 transition-opacity"
                    title="Aangepaste kleur"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Actions ──────────────────────────────────── */}
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

            {/* Delete — two-step */}
            {deleteStep === 'idle' ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-xl px-4 py-3 text-sm font-bold transition-all disabled:opacity-60 hover:bg-red-50 active:scale-[0.97]"
                style={{ background: 'rgba(255,30,30,0.08)', color: '#CC1010' }}
              >
                Verwijder
              </button>
            ) : (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: 'rgba(255,30,30,0.06)', border: '1px solid rgba(255,30,30,0.2)' }}
              >
                <span className="text-xs font-bold" style={{ color: '#CC1010' }}>Zeker weten?</span>
                <button
                  type="button"
                  onClick={() => setDeleteStep('idle')}
                  className="text-[11px] font-bold text-muted hover:text-navy transition-colors"
                >
                  Annuleer
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="text-[11px] font-black px-2.5 py-1 rounded-lg text-white transition-all disabled:opacity-50"
                  style={{ background: '#CC1010' }}
                >
                  {isPending ? '…' : 'Ja, verwijder'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

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
        <label
          className="field-label"
          style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6C7A8D' }}
        >
          {label}
        </label>
        {hint && <span className="text-[10px] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
