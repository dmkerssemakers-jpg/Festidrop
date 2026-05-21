import { FestiDropLogo } from './Logo';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-page/80 backdrop-blur-md border-b border-[rgba(189,239,255,0.35)]" />
      <div className="relative flex items-center justify-center px-5 py-4 max-w-md mx-auto">
        <FestiDropLogo size="md" />
      </div>
    </header>
  );
}
