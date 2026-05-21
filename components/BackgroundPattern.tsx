'use client';
import { motion } from 'framer-motion';

export default function BackgroundPattern() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Top-left aqua blob */}
      <motion.div
        className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(32,214,232,0.28) 0%, transparent 70%)' }}
        animate={{ x: [0, 28, -18, 0], y: [0, -22, 12, 0], scale: [1, 1.06, 0.96, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Bottom-right blue blob */}
      <motion.div
        className="absolute -bottom-40 -right-40 w-[640px] h-[640px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(30,139,255,0.22) 0%, transparent 70%)' }}
        animate={{ x: [0, -30, 20, 0], y: [0, 18, -14, 0], scale: [1, 0.94, 1.04, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Subtle mid-page accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(32,214,232,0.12) 0%, transparent 65%)' }}
      />
    </div>
  );
}
