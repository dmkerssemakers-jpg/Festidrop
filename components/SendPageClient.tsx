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
      const stored = localStorage.getItem(storageKey);
      if (!stored) { router.replace(`/${slug}`); return; }
      const parsed = JSON.parse(stored) as string[];
      if (!Array.isArray(parsed) || parsed.length === 0) { router.replace(`/${slug}`); return; }
      setPhotos(parsed);
    } catch {
      router.replace(`/${slug}`);
    }
  }, [router, slug, storageKey]);

  function handleSent() {
    localStorage.removeItem(storageKey);
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
          {/* Stack area */}
          <div className="relative w-48 h-56 mb-5">

            {/* Shadow blob behind stack */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-8 rounded-full blur-2xl"
              style={{ background: `${accentColor}30` }}
            />

            {/* Photo layers — back to front */}
            {[
              { rotate: -11, y: 10,  x: -14, z: 1, delay: 0.05 },
              { rotate:   7, y:  2,  x:  10, z: 2, delay: 0.12 },
              { rotate:  -2, y: -8,  x:   0, z: 3, delay: 0.20 },
            ].map((s, i) => {
              const photoIdx = Math.max(0, photos.length - (3 - i));
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-lg overflow-hidden"
                  style={{
                    width:  '136px',
                    height: '168px',
                    background: '#FEFDF8',
                    left: '50%',
                    top:  '50%',
                    marginLeft: '-68px',
                    marginTop:  '-84px',
                    zIndex: s.z,
                    boxShadow: '0 10px 40px rgba(7,22,47,0.28), 0 2px 8px rgba(7,22,47,0.12)',
                  }}
                  initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
                  animate={{ opacity: 1, scale: 1, rotate: s.rotate, x: s.x, y: s.y }}
                  transition={{ delay: s.delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  {photos[photoIdx] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photos[photoIdx]}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ top: 0, left: 0, bottom: '26px', height: 'calc(100% - 26px)' }}
                    />
                  )}
                  {/* Polaroid label area */}
                  <div className="absolute bottom-0 left-0 right-0 h-7 bg-[#FEFDF8]" />
                </motion.div>
              );
            })}

            {/* Photo count badge */}
            <motion.div
              className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm z-20"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
                boxShadow:  `0 4px 16px ${accentColor}50`,
              }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 420, damping: 18 }}
            >
              {photos.length}
            </motion.div>
          </div>

          {/* Caption */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted">
              {photos.length} polaroid{photos.length !== 1 ? 's' : ''} vastgelegd ✦
            </p>
          </motion.div>
        </motion.div>

        {/* Email form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
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
