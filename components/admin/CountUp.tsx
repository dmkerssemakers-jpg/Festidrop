'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Animates a whole number from 0 → value on mount (easeOutCubic).
 * Respects prefers-reduced-motion and skips the animation for value 0.
 */
export default function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef   = useRef(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || value <= 0) { setDisplay(value); return; }

    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    startRef.current = null;

    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min(1, (ts - startRef.current) / duration);
      setDisplay(Math.round(value * ease(p)));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <>{display.toLocaleString('nl-NL')}</>;
}
