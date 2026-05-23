'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundPattern from './BackgroundPattern';
import { FestiDropLogo } from './Logo';
import EmailDropCard from './EmailDropCard';

interface Props {
  slug:         string;
  accentColor:  string;
  eventName?:   string;
  logoUrl?:     string;
}

export default function SendPageClient({ slug, accentColor, eventName, logoUrl }: Props) {
  const [photos, setPhotos] = useState<string[] | null>(null);
  const router   = useRouter();
  const storageKey = `festidrop_photos_${slug}`;

  useEffect(() => {
    try {
      // Try localStorage first, then sessionStorage fallback
      const stored = localStorage.getItem(storageKey) ?? sessionStorage.getItem(storageKey);
      if (!stored) { router.replace(`/${slug}`); return; }
      const parsed = JSON.parse(stored) as string[];
      if (!Array.isArray(parsed) || parsed.length === 0) { router.replace(`/${slug}`); return; }
      setPhotos(parsed);
    } catch {
      router.replace(`/${slug}`);
    }
  }, [router, slug, storageKey]);

  function handleSent() {
    try { localStorage.removeItem(storageKey); } catch { /* noop */ }
    try { sessionStorage.removeItem(storageKey); } catch { /* noop */ }
  }

  if (!photos) {
    return (
      <main className="min-h-screen bg-page flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${accentColor}50`, borderTopColor: 'transparent' }}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-page relative overflow-hidden">
      <BackgroundPattern accentColor={accentColor} />

      {/* ── FestiDrop header ───────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-page/80 backdrop-blur-md border-b border-[rgba(189,239,255,0.35)]" />
        <div className="relative flex items-center justify-center px-5 py-4 max-w-md mx-auto">
          <FestiDropLogo size="md" />
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────── */}
      <div className="pb-16 px-4 max-w-md mx-auto pt-24">

        {/* Polaroid hero stack */}
        <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Secret photo stack */}
          <div className="relative w-56 h-64 mb-6">

            {/* Deep glow behind stack */}
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-52 h-16 rounded-full blur-3xl"
              style={{ background: `${accentColor}50` }}
              animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.08, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Polaroid frames — dark mystery style */}
            {[
              { rotate: -12, y: 12, x: -16, z: 1, delay: 0.05 },
              { rotate:   8, y:  4, x:  14, z: 2, delay: 0.13 },
              { rotate:  -2, y: -6, x:   0, z: 3, delay: 0.22 },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="absolute rounded-xl overflow-hidden"
                style={{
                  width:  '144px',
                  height: '176px',
                  left: '50%', top: '50%',
                  marginLeft: '-72px', marginTop: '-88px',
                  zIndex: s.z,
                  background: '#0D1F3C',
                  boxShadow: i === 2
                    ? `0 20px 60px rgba(7,22,47,0.55), 0 0 0 1px rgba(255,255,255,0.06), 0 0 40px ${accentColor}30`
                    : '0 12px 36px rgba(7,22,47,0.40), 0 0 0 1px rgba(255,255,255,0.04)',
                }}
                initial={{ opacity: 0, scale: 0.75, rotate: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, rotate: s.rotate, x: s.x, y: s.y }}
                transition={{ delay: s.delay, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Scanline texture */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.015) 3px, rgba(255,255,255,0.015) 4px)',
                    bottom: '28px',
                  }}
                />
                {/* Center lock icon — only on front card */}
                {i === 2 && (
                  <motion.div
                    className="absolute flex flex-col items-center justify-center gap-2"
                    style={{ inset: 0, bottom: '28px' }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center"
                      style={{
                        background: `${accentColor}20`,
                        border: `1.5px solid ${accentColor}50`,
                        boxShadow: `0 0 24px ${accentColor}40`,
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <rect x="3" y="8" width="12" height="8" rx="2.5" stroke={accentColor} strokeWidth="1.5"/>
                        <path d="M6 8V6a3 3 0 016 0v2" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round"/>
                        <circle cx="9" cy="12" r="1.2" fill={accentColor}/>
                      </svg>
                    </div>
                    <p
                      className="text-[8px] font-black uppercase tracking-[0.2em]"
                      style={{ color: `${accentColor}80` }}
                    >
                      Verborgen
                    </p>
                  </motion.div>
                )}
                {/* Grain overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
                    backgroundSize: '160px',
                    mixBlendMode: 'overlay',
                    bottom: '28px',
                  }}
                />
                {/* Polaroid label strip */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-7 flex items-center justify-center"
                  style={{ background: '#111D35', borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {i === 2 && (
                    <span className="text-[7px] font-black uppercase tracking-[0.22em]" style={{ color: `${accentColor}60` }}>
                      ✦ festidrop
                    </span>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Count badge */}
            <motion.div
              className="absolute -top-1 -right-1 w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm z-20"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}BB)`,
                boxShadow:  `0 4px 20px ${accentColor}60, 0 0 0 2px rgba(255,255,255,0.15)`,
              }}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.45, type: 'spring', stiffness: 380, damping: 16 }}
            >
              {photos.length}
            </motion.div>
          </div>

          {/* Caption */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted">
              {photos.length} polaroid{photos.length !== 1 ? 's' : ''} vastgelegd ✦
            </p>
            <p className="text-[10px] mt-1" style={{ color: accentColor + '99' }}>
              Vul je e-mail in om ze te ontvangen
            </p>
          </motion.div>
        </motion.div>

        {/* Email form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <EmailDropCard
            photos={photos}
            onSent={handleSent}
            slug={slug}
            accentColor={accentColor}
            eventName={eventName}
            logoUrl={logoUrl}
          />
        </motion.div>
      </div>
    </main>
  );
}
