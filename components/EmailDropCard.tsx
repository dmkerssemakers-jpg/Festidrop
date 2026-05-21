'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FestiDropIcon } from './Logo';

type Props = { photos: string[]; onSent?: () => void; slug?: string };

type State = 'idle' | 'sending' | 'sent' | 'error';

export default function EmailDropCard({ photos, onSent, slug }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || state === 'sending') return;
    setState('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/send-drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, photos, slug }),
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
    <section className="px-5 pb-20 max-w-md mx-auto">
      <motion.div
        className="glass-card rounded-[28px] p-7 text-center"
        style={{ boxShadow: '0 24px 70px rgba(30,139,255,0.12)' }}
      >
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <FestiDropIcon className="w-20 h-20" />
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {state !== 'sent' ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-[26px] font-black tracking-[-0.035em] text-navy mb-2">
                Je FestiDrop is klaar.
              </h2>
              <p className="text-muted text-sm mb-1 leading-relaxed">
                Vul je e-mailadres in en ontvang je {photos.length} polaroids direct in je inbox.
              </p>
              <p className="text-[12px] font-semibold mb-6"
                 style={{ background: 'linear-gradient(90deg,#1E8BFF,#20D6E8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                De foto's zijn alleen via je mail te zien. ✦
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jij@email.nl"
                  required
                  disabled={state === 'sending'}
                  className="w-full px-5 py-3.5 rounded-full text-sm font-medium text-navy placeholder:text-muted bg-white border border-[#E8EEF5] focus:outline-none focus:border-azure focus:ring-2 focus:ring-azure/20 transition disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={state === 'sending'}
                  className="btn-primary w-full py-4 text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {state === 'sending' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Versturen…
                    </>
                  ) : 'Verstuur mijn drop'}
                </button>
              </form>

              {state === 'error' && (
                <p className="text-[12px] text-red-500 mt-3 font-medium">{errorMsg}</p>
              )}

              <p className="text-[11px] text-muted mt-4 font-medium">
                We sturen alleen jouw foto's. Geen spam.
              </p>
            </motion.div>
          ) : (
            <motion.div key="success"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg,rgba(30,139,255,0.14),rgba(32,214,232,0.2))' }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M6 14l6 6 10-10" stroke="#1E8BFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-[26px] font-black text-navy mb-2">Verstuurd!</h2>
              <p className="text-muted text-sm leading-relaxed">
                Je FestiDrop is onderweg naar{' '}
                <strong className="text-navy font-bold">{email}</strong>.
              </p>
              <p className="text-[12px] text-muted mt-3">
                Check je inbox — de foto's wachten op je. 📸
              </p>
              <button
                onClick={() => router.push(slug ? `/${slug}` : '/')}
                className="mt-5 text-xs font-bold text-azure hover:underline"
              >
                ← Nieuwe drop maken
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
