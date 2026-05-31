'use client';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

/**
 * One-shot fullscreen confetti rain, themed around the event accent colour.
 * Portals to <body> so it escapes any clipping / backdrop-filter ancestor,
 * and renders nothing when the user prefers reduced motion.
 */
export default function Confetti({
  accentColor = '#1E8BFF',
  count       = 80,
  duration    = 2.6,
}: {
  accentColor?: string;
  count?: number;
  duration?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const palette = useMemo(
    () => [accentColor, '#FFD53D', '#FF4D88', '#20D6E8', '#7B2FF7', '#00C896', '#FFFFFF'],
    [accentColor],
  );

  const pieces = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      id:        i,
      left:      Math.random() * 100,                 // vw %
      color:     palette[i % palette.length],
      size:      6 + Math.random() * 8,
      round:     Math.random() > 0.5,
      rotate:    Math.random() * 360,
      spin:      Math.random() * 720 - 360,
      driftX:    (Math.random() * 2 - 1) * 70,         // px
      delay:     Math.random() * 0.3,
      dur:       duration * (0.7 + Math.random() * 0.6),
    })),
    [count, duration, palette],
  );

  if (!mounted) return null;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ top: '-8%', opacity: 1, rotate: p.rotate, x: 0 }}
          animate={{ top: '110%', x: p.driftX, rotate: p.rotate + p.spin, opacity: [1, 1, 0.9, 0] }}
          transition={{
            duration: p.dur,
            delay:    p.delay,
            ease:     'easeIn',
            opacity:  { duration: p.dur, delay: p.delay, times: [0, 0.7, 0.9, 1] },
          }}
          style={{
            position:     'absolute',
            left:         `${p.left}%`,
            width:        p.size,
            height:       p.round ? p.size : p.size * 0.5,
            background:    p.color,
            borderRadius: p.round ? '50%' : 2,
          }}
        />
      ))}
    </div>,
    document.body,
  );
}
