'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  slug:        string;
  accessCode:  string;
  accentColor: string;
  eventName:   string;
  children:    React.ReactNode;
};

export default function AccessGate({ slug, accessCode, accentColor, eventName, children }: Props) {
  const storageKey = `fd_access_${slug}`;
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [input,    setInput]    = useState('');
  const [error,    setError]    = useState(false);
  const [shake,    setShake]    = useState(false);

  useEffect(() => {
    try {
      setUnlocked(sessionStorage.getItem(storageKey) === '1');
    } catch {
      setUnlocked(true); // fallback if sessionStorage unavailable
    }
  }, [storageKey]);

  if (unlocked === null) return null; // SSR guard
  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().toLowerCase() === accessCode.toLowerCase()) {
      try { sessionStorage.setItem(storageKey, '1'); } catch { /* noop */ }
      setUnlocked(true);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2500);
      setInput('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-5"
      style={{ background: 'rgba(7,22,47,0.96)', backdropFilter: 'blur(16px)' }}
    >
      {/* Glow blob */}
      <div
        className="absolute w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: `${accentColor}20`, top: '20%', left: '50%', transform: 'translateX(-50%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={shake
          ? { x: [-8, 8, -6, 6, -3, 3, 0], opacity: 1, scale: 1, y: 0 }
          : { opacity: 1, y: 0, scale: 1 }
        }
        transition={{ duration: shake ? 0.4 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm rounded-[28px] p-8 text-center"
        style={{
          background:   'rgba(255,255,255,0.05)',
          border:       `1px solid ${accentColor}30`,
          boxShadow:    `0 32px 80px rgba(7,22,47,0.4), 0 0 60px ${accentColor}18`,
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px rounded-t-[28px]"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }}
        />

        {/* Lock icon */}
        <motion.div
          className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="3" y="10" width="16" height="10" rx="3" stroke={accentColor} strokeWidth="1.6"/>
            <path d="M7 10V7a4 4 0 018 0v3" stroke={accentColor} strokeWidth="1.6" strokeLinecap="round"/>
            <circle cx="11" cy="15" r="1.5" fill={accentColor}/>
          </svg>
        </motion.div>

        <h2 className="text-xl font-black text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
          {eventName}
        </h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Voer de toegangscode in om verder te gaan.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Toegangscode"
            autoFocus
            autoComplete="current-password"
            className="w-full px-5 py-3.5 rounded-full text-sm font-medium text-center text-white placeholder:text-white/30 focus:outline-none transition"
            style={{
              background:   error ? 'rgba(255,60,60,0.12)' : 'rgba(255,255,255,0.07)',
              border:       `1px solid ${error ? 'rgba(255,60,60,0.4)' : 'rgba(255,255,255,0.12)'}`,
              caretColor:   accentColor,
            }}
          />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-xs font-semibold"
                style={{ color: '#FF6B6B' }}
              >
                Onjuiste code. Probeer opnieuw.
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={!input}
            className="w-full py-3.5 rounded-full text-sm font-black text-white disabled:opacity-40 transition-all"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
              boxShadow:  `0 10px 30px ${accentColor}40`,
            }}
          >
            Toegang krijgen →
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
