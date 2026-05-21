export function FestiDropIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="lensGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="18%"  stopColor="#7DEBFF" />
          <stop offset="48%"  stopColor="#1E8BFF" />
          <stop offset="78%"  stopColor="#0B4FD8" />
          <stop offset="100%" stopColor="#07162F" />
        </radialGradient>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BDEFFF" />
          <stop offset="1" stopColor="#1E8BFF" />
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="60" cy="60" r="52" stroke="#D7F4FF" strokeWidth="8" />
      {/* Middle ring — gradient */}
      <circle cx="60" cy="60" r="41" stroke="url(#ringGrad)" strokeWidth="6" />
      {/* Inner depth ring */}
      <circle cx="60" cy="60" r="33" stroke="rgba(189,239,255,0.35)" strokeWidth="2" />
      {/* Lens core */}
      <circle cx="60" cy="60" r="28" fill="url(#lensGrad)" />
      {/* White highlight */}
      <circle cx="48" cy="43" r="7" fill="white" opacity="0.88" />
      {/* Red capture accent — 1–2 o'clock on the outer ring */}
      <path
        d="M88 18 A52 52 0 0 1 98 26"
        stroke="#FF1E1E"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

type LogoSize = 'sm' | 'md' | 'lg';

export function FestiDropLogo({ size = 'md' }: { size?: LogoSize }) {
  const iconCls: Record<LogoSize, string> = { sm: 'w-7 h-7', md: 'w-10 h-10', lg: 'w-14 h-14' };
  const textCls: Record<LogoSize, string> = { sm: 'text-xl', md: 'text-2xl', lg: 'text-4xl' };
  return (
    <div className="flex items-center gap-2.5">
      <FestiDropIcon className={iconCls[size]} />
      <span className={`font-extrabold tracking-[-0.045em] ${textCls[size]}`}>
        <span className="text-navy">Festi</span>
        <span className="text-gradient-drop">Drop</span>
      </span>
    </div>
  );
}
