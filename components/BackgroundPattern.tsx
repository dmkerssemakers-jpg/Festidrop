'use client';
import { motion } from 'framer-motion';

interface Props {
  accentColor?: string;
}

export default function BackgroundPattern({ accentColor }: Props) {
  function toRgba(color: string, alpha: number): string {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return color;
  }

  const c = accentColor ?? '#1E8BFF';

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Large top-left accent blob */}
      <motion.div
        className="absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full"
        style={{ background: `radial-gradient(circle, ${toRgba(c, 0.38)} 0%, transparent 65%)` }}
        animate={{ x: [0, 32, -20, 0], y: [0, -24, 14, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Large bottom-right blob */}
      <motion.div
        className="absolute -bottom-60 -right-60 w-[800px] h-[800px] rounded-full"
        style={{ background: `radial-gradient(circle, ${toRgba(c, 0.28)} 0%, transparent 65%)` }}
        animate={{ x: [0, -36, 22, 0], y: [0, 20, -16, 0], scale: [1, 0.92, 1.06, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Center glow — behind the camera card */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
        style={{ background: `radial-gradient(circle, ${toRgba(c, 0.18)} 0%, transparent 60%)` }}
        animate={{ scale: [1, 1.12, 0.94, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Top-right secondary blob */}
      <motion.div
        className="absolute -top-20 -right-20 w-[380px] h-[380px] rounded-full"
        style={{ background: `radial-gradient(circle, ${toRgba(c, 0.16)} 0%, transparent 70%)` }}
        animate={{ x: [0, -20, 14, 0], y: [0, 18, -10, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
        }}
      />
    </div>
  );
}
