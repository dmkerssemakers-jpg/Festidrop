'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FestiDropLogo } from './Logo';

interface Props {
  slug:        string;
  accentColor: string;
  eventName?:  string;
  logoUrl?:    string;
}

const DISPLAY_MS = 2600;

export default function EventSplash({ slug, accentColor, eventName, logoUrl }: Props) {
  const [visible, setVisible] = useState(false);
  const key = `fd_splash_${slug}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      setVisible(true);
      const t = setTimeout(() => setVisible(false), DISPLAY_MS);
      return () => clearTimeout(t);
    }
  }, [key]);

  const dismiss = () => setVisible(false);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
          style={{ background: '#07162F' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ exit: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } }}
          onClick={dismiss}
        >
          {/* ── Background glow ───────────────────────────────── */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: '600px', height: '600px',
              background: `radial-gradient(circle, ${accentColor}45 0%, ${accentColor}10 45%, transparent 70%)`,
            }}
            animate={{ scale: [1, 1.12, 1.04, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* ── Pulsing rings ─────────────────────────────────── */}
          {[0, 0.7, 1.4].map((delay, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '180px', height: '180px',
                border: `1.5px solid ${accentColor}`,
                opacity: 0,
              }}
              animate={{ scale: [1, 2.8], opacity: [0.55, 0] }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: 'easeOut',
                delay,
              }}
            />
          ))}

          {/* ── Content ───────────────────────────────────────── */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-5 px-8"
            initial={{ scale: 0.78, opacity: 0, y: 16 }}
            animate={{ scale: 1,    opacity: 1, y: 0  }}
            exit={{ scale: 1.06, opacity: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }}
            transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            {logoUrl ? (
              /* ── Logo in frosted white card ── */
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  className="rounded-3xl px-10 py-7 flex items-center justify-center"
                  style={{
                    background:   'rgba(255,255,255,0.97)',
                    boxShadow:    `0 24px 80px ${accentColor}50, 0 0 0 1px rgba(255,255,255,0.1)`,
                    backdropFilter: 'blur(10px)',
                  }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt={eventName ?? 'Event'}
                    style={{ maxHeight: '72px', maxWidth: '220px', objectFit: 'contain' }}
                  />
                </motion.div>

                {eventName && (
                  <p
                    className="text-lg font-black tracking-[-0.02em]"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    {eventName}
                  </p>
                )}
              </div>
            ) : (
              /* ── Text-only branding ── */
              <div className="text-center">
                <motion.div
                  className="w-24 h-24 rounded-[28px] mx-auto mb-5 flex items-center justify-center"
                  style={{
                    background:  `linear-gradient(135deg, ${accentColor}30, ${accentColor}15)`,
                    border:      `2px solid ${accentColor}50`,
                    boxShadow:   `0 16px 50px ${accentColor}35`,
                    fontSize:    '40px',
                  }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                >
                  ✦
                </motion.div>
                <h1
                  className="font-black text-white leading-none mb-2"
                  style={{
                    fontSize:       'clamp(32px, 9vw, 54px)',
                    letterSpacing:  '-0.04em',
                    textShadow:     `0 0 60px ${accentColor}60`,
                  }}
                >
                  {eventName ?? 'FestiDrop'}
                </h1>
              </div>
            )}

            {/* Tagline */}
            <motion.p
              className="text-[13px] font-semibold tracking-wide text-center"
              style={{ color: 'rgba(255,255,255,0.38)' }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              Jouw moment wordt vastgelegd
            </motion.p>
          </motion.div>

          {/* ── Progress bar ──────────────────────────────────── */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px]"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="h-full"
              style={{ background: `linear-gradient(90deg, ${accentColor}99, ${accentColor})` }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: DISPLAY_MS / 1000, ease: 'linear' }}
            />
          </div>

          {/* ── Powered by FestiDrop ──────────────────────────── */}
          <motion.div
            className="absolute bottom-6 right-6 flex flex-col items-end gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.18em]"
               style={{ color: 'rgba(255,255,255,0.2)' }}>
              Powered by
            </p>
            <FestiDropLogo size="sm" onDark />
          </motion.div>

          {/* ── Tap hint ─────────────────────────────────────── */}
          <motion.p
            className="absolute bottom-8 left-0 right-0 text-center text-[10px] font-medium"
            style={{ color: 'rgba(255,255,255,0.18)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            Tik om door te gaan
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
