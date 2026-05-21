'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import CameraCapture from './CameraCapture';
import type { PolaroidDesign } from '@/lib/polaroid-design';

interface Props {
  eventId:      string;
  eventName:    string;
  accentColor:  string;
  maxPhotos:    number;
  slug:         string;
  logoUrl?:     string | null;
  design?:      PolaroidDesign;
}

export default function EventPhotoSession({ eventId, eventName, accentColor, slug, maxPhotos, logoUrl, design }: Props) {
  const router = useRouter();
  const storageKey = `festidrop_photos_${slug}`;
  const [storageError, setStorageError] = useState(false);

  function handleComplete(photos: string[]) {
    // Try localStorage first, fall back to sessionStorage
    let saved = false;
    const serialised = JSON.stringify(photos);

    try {
      localStorage.setItem(storageKey, serialised);
      saved = true;
    } catch {
      try {
        sessionStorage.setItem(storageKey, serialised);
        saved = true;
      } catch {
        // Both failed (private browsing + full storage)
      }
    }

    if (saved) {
      router.push(`/${slug}/send`);
    } else {
      setStorageError(true);
    }
  }

  return (
    <>
      <CameraCapture
        onComplete={handleComplete}
        maxPhotos={maxPhotos}
        eventId={eventId}
        logoUrl={logoUrl}
        eventName={eventName}
        accentColor={accentColor}
        topOffset="pt-24"
        design={design}
      />

      {/* Storage error overlay */}
      <AnimatePresence>
        {storageError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[150] flex items-center justify-center px-5"
            style={{ background: 'rgba(7,22,47,0.88)', backdropFilter: 'blur(12px)' }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="w-full max-w-sm rounded-[24px] p-7 text-center"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${accentColor}30`,
                boxShadow: `0 24px 60px rgba(7,22,47,0.4)`,
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(255,80,80,0.15)' }}
              >
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                  <circle cx="13" cy="13" r="11" stroke="rgba(255,120,120,0.8)" strokeWidth="1.8"/>
                  <path d="M13 7v8M13 18v1.5" stroke="rgba(255,140,140,0.9)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-black text-white mb-2">Opslag niet beschikbaar</h3>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                Je browser blokkeert lokale opslag (privémodus?). Je foto&apos;s zijn gemaakt maar kunnen niet worden opgeslagen.
                Probeer de pagina te openen in een normaal browservenster.
              </p>
              <button
                onClick={() => { setStorageError(false); window.location.reload(); }}
                className="w-full py-3.5 rounded-full text-sm font-black text-white"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
                  boxShadow: `0 8px 24px ${accentColor}40`,
                }}
              >
                Opnieuw proberen
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
