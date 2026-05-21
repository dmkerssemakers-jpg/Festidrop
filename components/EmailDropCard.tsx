'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  photos:       string[];
  onSent?:      () => void;
  slug?:        string;
  accentColor?: string;
  eventName?:   string;
  logoUrl?:     string;
};

// Compress a photo to max 500px / JPEG 0.72 before sending to API
// Reduces each photo from ~180KB to ~55KB → 20 photos stay well under Vercel's 4.5MB limit
function compressForEmail(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX   = 500;
      const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
      const w     = Math.round(img.naturalWidth  * scale);
      const h     = Math.round(img.naturalHeight * scale);
      const c     = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => resolve(dataUrl); // fallback: send original
    img.src = dataUrl;
  });
}

type State = 'idle' | 'sending' | 'sent' | 'error';

function ShareButton({ accentColor }: { accentColor: string }) {
  const [shared, setShared] = useState(false);

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  if (!canShare) return null;

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Mijn FestiDrop 📸',
        text: 'Check mijn festivalfoto\'s via FestiDrop!',
        url: window.location.origin,
      });
      setShared(true);
    } catch {
      // User cancelled — no action needed
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-bold transition-all hover:opacity-90 active:scale-[0.97]"
      style={{
        background: shared ? 'rgba(0,200,150,0.15)' : `${accentColor}18`,
        border:     `1px solid ${shared ? 'rgba(0,200,150,0.3)' : `${accentColor}30`}`,
        color:      shared ? '#00C896' : accentColor,
      }}
    >
      {shared ? (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Gedeeld!
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="11" cy="3" r="1.8" stroke="currentColor" strokeWidth="1.4"/>
            <circle cx="11" cy="11" r="1.8" stroke="currentColor" strokeWidth="1.4"/>
            <circle cx="3" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M4.7 6.1l4.7-2.3M4.7 7.9l4.7 2.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Deel met vrienden
        </>
      )}
    </button>
  );
}

export default function EmailDropCard({ photos, onSent, slug, accentColor = '#1E8BFF', eventName, logoUrl }: Props) {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [state,    setState]    = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || state === 'sending') return;
    setState('sending');
    setErrorMsg('');
    try {
      // Compress before sending to stay well under Vercel's 4.5 MB request limit
      const compressed = await Promise.all(photos.map(compressForEmail));

      const res  = await fetch('/api/send-drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, photos: compressed, slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Onbekende fout');
      setState('sent');
      onSent?.();
    } catch (err: unknown) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Probeer het opnieuw.');
    }
  }

  return (
    <div
      className="relative rounded-[28px] overflow-hidden"
      style={{
        background:       'rgba(7,22,47,0.88)',
        border:           '1px solid rgba(255,255,255,0.07)',
        boxShadow:        `0 32px 80px rgba(7,22,47,0.28), 0 0 80px ${accentColor}18`,
        backdropFilter:   'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }}
      />

      <AnimatePresence mode="wait">
        {state !== 'sent' ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }}
            className="p-7 text-center"
          >
            {/* Event logo / icon */}
            <div className="flex justify-center mb-5">
              {logoUrl ? (
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center p-2"
                  style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt={eventName ?? ''} className="w-full h-full object-contain" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
                >
                  {/* Camera icon */}
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <rect x="2" y="8" width="24" height="17" rx="4" stroke={accentColor} strokeWidth="1.8"/>
                    <circle cx="14" cy="16.5" r="5" stroke={accentColor} strokeWidth="1.8"/>
                    <path d="M9 8V6.5A2.5 2.5 0 0111.5 4h5A2.5 2.5 0 0119 6.5V8" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </motion.div>
              )}
            </div>

            <h2 className="text-[24px] font-black tracking-[-0.035em] text-white mb-2">
              Je FestiDrop is klaar!
            </h2>
            <p className="text-sm mb-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Vul je e-mailadres in en ontvang je{' '}
              <span className="font-bold text-white">{photos.length} polaroid{photos.length !== 1 ? 's' : ''}</span>{' '}
              direct in je inbox.
            </p>
            <p
              className="text-[12px] font-semibold mb-6"
              style={{ color: `${accentColor}CC` }}
            >
              De foto&apos;s zijn alleen via je mail te zien. ✦
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jij@email.nl"
                required
                disabled={state === 'sending'}
                className="w-full px-5 py-3.5 rounded-full text-sm font-medium placeholder:font-normal focus:outline-none transition disabled:opacity-50"
                style={{
                  background:    'rgba(255,255,255,0.07)',
                  border:        '1px solid rgba(255,255,255,0.12)',
                  color:         '#fff',
                  caretColor:    accentColor,
                }}
                onFocus={e => { e.target.style.borderColor = `${accentColor}80`; e.target.style.background = 'rgba(255,255,255,0.10)'; }}
                onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
              />

              <motion.button
                type="submit"
                disabled={state === 'sending' || !email}
                whileTap={state !== 'sending' ? { scale: 0.97 } : {}}
                className="w-full py-4 rounded-full text-sm font-black text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background:  `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
                  boxShadow:   state === 'sending' ? 'none' : `0 10px 30px ${accentColor}40`,
                }}
              >
                {state === 'sending' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Versturen…
                  </>
                ) : (
                  <>
                    Verstuur mijn drop
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M8 3l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </motion.button>
            </form>

            {state === 'error' && (
              <motion.p
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="text-[12px] mt-3 font-medium"
                style={{ color: '#FF6B6B' }}
              >
                {errorMsg}
              </motion.p>
            )}

            <p className="text-[11px] mt-4 font-medium" style={{ color: 'rgba(255,255,255,0.28)' }}>
              We sturen alleen jouw foto&apos;s. Geen spam.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="p-7 text-center"
          >
            {/* Success checkmark */}
            <motion.div
              className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center relative"
              style={{ background: `${accentColor}18`, border: `2px solid ${accentColor}40` }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.05 }}
            >
              {/* Outer ring pulse */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid ${accentColor}40` }}
                animate={{ scale: [1, 1.4, 1.4], opacity: [1, 0, 0] }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              />
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <motion.path
                  d="M6 16l7 7 13-13"
                  stroke={accentColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
                />
              </svg>
            </motion.div>

            <motion.h2
              className="text-[26px] font-black text-white mb-2"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Verstuurd! 🎉
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
            >
              <p className="text-sm leading-relaxed mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Je FestiDrop is onderweg naar
              </p>
              <p className="text-sm font-bold text-white mb-3">{email}</p>
              <p className="text-xs" style={{ color: `${accentColor}90` }}>
                Check je inbox — de foto&apos;s wachten op je. 📸
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="mt-6 flex flex-col gap-2 items-center w-full"
            >
              {/* Share button — uses Web Share API if available */}
              <ShareButton accentColor={accentColor} />

              <button
                onClick={() => router.push(slug ? `/${slug}` : '/')}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold transition-all hover:opacity-80"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border:     '1px solid rgba(255,255,255,0.12)',
                  color:      'rgba(255,255,255,0.6)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Nieuwe drop maken
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
