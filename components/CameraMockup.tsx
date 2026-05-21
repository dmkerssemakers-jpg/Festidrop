'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FestiDropIcon } from './Logo';
import ProgressStrip from './ProgressStrip';

type Props = { onComplete?: () => void };

export default function CameraMockup({ onComplete }: Props) {
  const [count, setCount] = useState(0);
  const [flashing, setFlashing] = useState(false);
  const isComplete = count >= 10;
  const remaining = 10 - count;

  function shoot() {
    if (isComplete || flashing) return;
    setFlashing(true);
    setTimeout(() => {
      setFlashing(false);
      setCount((c) => {
        const next = Math.min(c + 1, 10);
        if (next === 10) onComplete?.();
        return next;
      });
    }, 160);
  }

  const statusText =
    count === 0
      ? 'Druk op de rode knop om je eerste foto te maken'
      : remaining === 1
      ? 'Nog 1 foto te gaan — maak hem speciaal!'
      : `Nog ${remaining} foto's te gaan`;

  return (
    <section id="camera" className="px-5 pb-16 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="relative glass-card rounded-[28px] overflow-hidden p-6"
      >
        {/* Flash overlay */}
        <AnimatePresence>
          {flashing && (
            <motion.div
              key="flash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              className="absolute inset-0 bg-white z-20 pointer-events-none rounded-[28px]"
            />
          )}
        </AnimatePresence>

        {/* Camera header bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-capture animate-red-ping" />
            <span className="text-[11px] font-black uppercase tracking-[0.1em] text-muted">
              FestiDrop Camera
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted">
              {isComplete ? 'Klaar!' : `${count}/10`}
            </span>
            {/* Battery dots */}
            <div className="flex items-end gap-0.5">
              {[3, 4, 5].map((h, i) => (
                <div
                  key={i}
                  className="w-1 rounded-sm transition-colors"
                  style={{
                    height: `${h * 3}px`,
                    background: i < 2 ? '#20D6E8' : 'rgba(189,239,255,0.3)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Lens */}
        <div className="flex justify-center items-center py-3">
          <motion.div
            animate={{
              scale: [1, 1.035, 1],
              filter: [
                'drop-shadow(0 0 14px rgba(30,139,255,0.25))',
                'drop-shadow(0 0 28px rgba(32,214,232,0.45))',
                'drop-shadow(0 0 14px rgba(30,139,255,0.25))',
              ],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <FestiDropIcon className="w-44 h-44" />
          </motion.div>
        </div>

        {/* Stats + shutter */}
        <div className="flex items-center justify-between mt-4 mb-5 px-1">
          {/* Left stat */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted mb-0.5">Foto's</p>
            <p className="text-[28px] font-black leading-none tracking-[-0.04em] text-navy">
              {count}
              <span className="text-sm font-bold text-muted">/10</span>
            </p>
          </div>

          {/* Shutter button */}
          <motion.button
            onClick={shoot}
            whileTap={isComplete ? {} : { scale: 0.87 }}
            disabled={isComplete}
            aria-label="Maak foto"
            className="relative w-[76px] h-[76px] rounded-full flex items-center justify-center focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(145deg, #FF3838, #C00000)',
              boxShadow: '0 10px 30px rgba(255,30,30,0.38), inset 0 1px 0 rgba(255,255,255,0.18)',
            }}
          >
            <div className="w-[56px] h-[56px] rounded-full border-2 border-white/35 flex items-center justify-center">
              <div className="w-[38px] h-[38px] rounded-full bg-white/18" />
            </div>
          </motion.button>

          {/* Right stat */}
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted mb-0.5">Te gaan</p>
            <p
              className="text-[28px] font-black leading-none tracking-[-0.04em]"
              style={
                remaining === 0
                  ? {
                      background: 'linear-gradient(90deg,#1E8BFF,#20D6E8)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }
                  : { color: '#07162F' }
              }
            >
              {remaining}
            </p>
          </div>
        </div>

        {/* Progress strip */}
        <ProgressStrip count={count} />

        {/* Completion / status line */}
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-center py-3 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(30,139,255,0.08), rgba(32,214,232,0.12))',
              }}
            >
              <p className="text-sm font-black text-navy">Je FestiDrop is klaar!</p>
              <p className="text-xs text-muted mt-0.5">Scroll omlaag om je foto's te ontvangen.</p>
            </motion.div>
          ) : (
            <motion.p
              key="status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-xs text-muted mt-4 font-medium"
            >
              {statusText}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
