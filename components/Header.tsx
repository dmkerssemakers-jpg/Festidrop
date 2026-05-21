import { FestiDropLogo } from './Logo';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-page/80 backdrop-blur-md border-b border-[rgba(189,239,255,0.35)]" />
      <div className="relative flex items-center justify-between px-5 py-4 max-w-md mx-auto">
        <FestiDropLogo size="md" />
        <a
          href="#hoe-het-werkt"
          className="hidden sm:flex text-xs font-bold uppercase tracking-widest text-muted px-4 py-2.5 rounded-full border border-[rgba(189,239,255,0.6)] bg-white/70 backdrop-blur-sm hover:border-azure transition-colors"
        >
          Hoe het werkt
        </a>
        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex flex-col items-center justify-center gap-1.5 w-10 h-10"
          aria-label="Menu"
        >
          <span className="w-5 h-0.5 bg-navy rounded-full" />
          <span className="w-5 h-0.5 bg-navy rounded-full" />
          <span className="w-3 h-0.5 bg-navy rounded-full self-start" />
        </button>
      </div>
    </header>
  );
}
