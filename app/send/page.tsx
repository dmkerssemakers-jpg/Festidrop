'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import EmailDropCard from '@/components/EmailDropCard';
import Header from '@/components/Header';
import BackgroundPattern from '@/components/BackgroundPattern';

export default function SendPage() {
  const [photos, setPhotos] = useState<string[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('festidrop_photos');
      if (!stored) { router.replace('/'); return; }
      const parsed = JSON.parse(stored) as string[];
      if (!Array.isArray(parsed) || parsed.length === 0) { router.replace('/'); return; }
      setPhotos(parsed);
    } catch {
      router.replace('/');
    }
  }, [router]);

  function handleSent() {
    localStorage.removeItem('festidrop_photos');
  }

  if (!photos) {
    return (
      <main className="min-h-screen bg-page flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-azure border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-page relative">
      <BackgroundPattern />
      <Header />

      <div className="pt-24 pb-16 px-5 max-w-md mx-auto">

        {/* Polaroid stapel — mystery intact */}
        <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative w-36 h-44 mb-5">
            {[
              { rotate: -9, y: 6,  z: 1, idx: photos.length - 3 },
              { rotate:  6, y: -4, z: 2, idx: photos.length - 2 },
              { rotate: -2, y: 0,  z: 3, idx: photos.length - 1 },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="absolute w-28 rounded-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
                style={{
                  height: '140px',
                  background: '#FEFDF8',
                  rotate: s.rotate,
                  translateY: s.y,
                  zIndex: s.z,
                  boxShadow: '0 6px 24px rgba(7,22,47,0.22)',
                }}
                initial={{ opacity: 0, scale: 0.85, rotate: 0 }}
                animate={{ opacity: 1, scale: 1, rotate: s.rotate }}
                transition={{ delay: i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                {photos[s.idx] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photos[s.idx]} alt="" className="w-full h-full object-cover" />
                )}
              </motion.div>
            ))}

            {/* Foto-teller badge */}
            <motion.div
              className="absolute -top-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm z-10"
              style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)', boxShadow: '0 4px 12px rgba(30,139,255,0.4)' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 420, damping: 18 }}
            >
              {photos.length}
            </motion.div>
          </div>

          <motion.p
            className="text-[11px] font-black uppercase tracking-[0.12em] text-muted"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          >
            {photos.length} polaroids vastgelegd
          </motion.p>
        </motion.div>

        {/* Email formulier */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <EmailDropCard photos={photos} onSent={handleSent} />
        </motion.div>
      </div>
    </main>
  );
}
