'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Pages where the install banner makes sense
function isEventPath(path: string) {
  // Matches /[slug] and /[slug]/send but NOT /admin, /gallery, /privacy, etc.
  return /^\/[^/]+(?:\/send)?$/.test(path) &&
    !path.startsWith('/admin') &&
    !path.startsWith('/gallery') &&
    !path.startsWith('/privacy') &&
    !path.startsWith('/login') &&
    !path.startsWith('/qr') &&
    path !== '/';
}

export default function PWASetup() {
  const pathname = usePathname();
  const [installPrompt, setInstallPrompt] = useState<Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null>(null);
  const [showAndroid,   setShowAndroid]   = useState(false);
  const [showIOS,       setShowIOS]       = useState(false);
  const [dismissed,     setDismissed]     = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .catch(err => console.warn('[SW] registration failed:', err));
    }

    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).standalone === true;
    if (isStandalone) return;

    // Check if user already dismissed this session
    if (sessionStorage.getItem('pwa-dismissed')) return;

    // Detect iOS (no beforeinstallprompt, manual add-to-homescreen needed)
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
      // Show iOS tip after a short delay
      const t = setTimeout(() => setShowIOS(true), 3000);
      return () => clearTimeout(t);
    }

    // Android / Chrome: capture beforeinstallprompt event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowAndroid(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setShowAndroid(false); setInstallPrompt(null); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    setShowAndroid(false);
    setShowIOS(false);
    sessionStorage.setItem('pwa-dismissed', '1');
  };

  const installAndroid = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') { setShowAndroid(false); setInstallPrompt(null); }
  };

  // Only show on event/send pages
  const visible = isEventPath(pathname) && !dismissed;

  return (
    <AnimatePresence>
      {/* ── Android install prompt ──────────────────────────────── */}
      {visible && showAndroid && (
        <motion.div
          key="android-prompt"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="fixed bottom-4 left-4 right-4 z-[300] max-w-md mx-auto"
        >
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background:     'rgba(7,22,47,0.96)',
              border:         '1px solid rgba(189,239,255,0.15)',
              boxShadow:      '0 16px 48px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(30,139,255,0.15)', border: '1px solid rgba(30,139,255,0.3)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="FestiDrop" className="w-8 h-8" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-white leading-none mb-0.5">Installeer FestiDrop</p>
              <p className="text-[11px] leading-snug" style={{ color: 'rgba(189,239,255,0.5)' }}>
                Werkt ook zonder internet na installatie
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={installAndroid}
                className="px-3 py-1.5 rounded-full text-[11px] font-black text-white"
                style={{ background: 'linear-gradient(135deg, #1E8BFF, #1E8BFF99)' }}
              >
                Installeer
              </button>
              <button
                onClick={dismiss}
                className="w-6 h-6 flex items-center justify-center rounded-full"
                style={{ color: 'rgba(189,239,255,0.35)' }}
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── iOS add-to-homescreen tip ──────────────────────────── */}
      {visible && showIOS && (
        <motion.div
          key="ios-tip"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="fixed bottom-4 left-4 right-4 z-[300] max-w-md mx-auto"
        >
          <div
            className="rounded-2xl p-4"
            style={{
              background:     'rgba(7,22,47,0.96)',
              border:         '1px solid rgba(189,239,255,0.15)',
              boxShadow:      '0 16px 48px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.svg" alt="FestiDrop" className="w-10 h-10 rounded-xl" />
                <div>
                  <p className="text-[13px] font-black text-white">Installeer FestiDrop</p>
                  <p className="text-[11px]" style={{ color: 'rgba(189,239,255,0.45)' }}>Werkt offline na installatie</p>
                </div>
              </div>
              <button onClick={dismiss} style={{ color: 'rgba(189,239,255,0.35)', fontSize: 16, lineHeight: 1 }}>✕</button>
            </div>

            {/* iOS instruction steps */}
            <div className="space-y-2">
              {[
                { icon: '⬆️', text: 'Tik op het Deel-icoon onderaan je browser' },
                { icon: '➕', text: 'Kies "Zet op beginscherm"' },
                { icon: '✅', text: 'De app werkt daarna ook zonder internet' },
              ].map(({ icon, text }, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-base shrink-0">{icon}</span>
                  <p className="text-[11px]" style={{ color: 'rgba(189,239,255,0.6)' }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
