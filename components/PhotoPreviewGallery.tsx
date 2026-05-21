'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  photos:      string[];
  accentColor: string;
};

export default function PhotoPreviewGallery({ photos, accentColor }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      {/* Section header */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Jouw foto&apos;s — {photos.length} polaroid{photos.length !== 1 ? 's' : ''}
        </p>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Tik voor volledig scherm</p>
      </div>

      {/* Horizontal scroll strip */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {photos.map((photo, i) => (
          <motion.button
            key={i}
            onClick={() => setLightbox(i)}
            className="shrink-0 snap-center rounded-xl overflow-hidden relative group"
            style={{
              width: '88px',
              height: '108px',
              background: '#FEFDF8',
              boxShadow: '0 6px 20px rgba(7,22,47,0.30)',
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Photo area */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt={`Foto ${i + 1}`}
              className="absolute inset-x-0 top-0 w-full object-cover"
              style={{ height: 'calc(100% - 20px)' }}
            />
            {/* White label */}
            <div className="absolute bottom-0 left-0 right-0 h-5 bg-[#FEFDF8]" />

            {/* Hover/tap overlay */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
              style={{ background: `${accentColor}25` }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 3h4M3 3v4M15 3h-4M15 3v4M3 15h4M3 15v-4M15 15h-4M15 15v-4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>

            {/* Number badge */}
            <div
              className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white"
              style={{ background: 'rgba(7,22,47,0.55)', backdropFilter: 'blur(4px)' }}
            >
              {i + 1}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            className="fixed inset-0 z-[300] flex items-center justify-center"
            style={{ background: 'rgba(7,22,47,0.95)', backdropFilter: 'blur(16px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setLightbox(null)}
          >
            {/* Photo */}
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-2xl overflow-hidden"
              style={{
                maxWidth: 'min(90vw, 340px)',
                boxShadow: `0 40px 100px rgba(7,22,47,0.6), 0 0 60px ${accentColor}20`,
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[lightbox]}
                alt={`Foto ${lightbox + 1}`}
                className="w-full block"
              />
            </motion.div>

            {/* Prev / Next */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); setLightbox(l => l !== null ? (l - 1 + photos.length) % photos.length : 0); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10 3L6 8l4 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setLightbox(l => l !== null ? (l + 1) % photos.length : 0); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3l4 5-4 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </>
            )}

            {/* Counter + close */}
            <div className="absolute top-5 left-0 right-0 flex items-center justify-between px-5">
              <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {lightbox + 1} / {photos.length}
              </p>
              <button
                onClick={() => setLightbox(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2l8 8M10 2L2 10" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
