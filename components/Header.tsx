import { FestiDropLogo } from './Logo';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-page/80 backdrop-blur-md border-b border-[rgba(189,239,255,0.35)]" />
      <div className="relative flex items-center justify-between px-5 py-4 max-w-md mx-auto">
        <FestiDropLogo size="md" />
        <a
          href="#hoe-het-werkt"
          className="text-xs font-bold uppercase tracking-widest text-muted px-4 py-2.5 rounded-full border border-[rgba(189,239,255,0.6)] bg-white/70 backdrop-blur-sm hover:border-azure transition-colors"
        >
          Hoe het werkt
        </a>
      </div>
    </header>
  );
}
