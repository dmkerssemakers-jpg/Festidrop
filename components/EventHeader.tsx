interface Props {
  name: string;
  logoUrl?: string | null;
  accentColor: string;
}

export default function EventHeader({ name, logoUrl, accentColor }: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-page/80 backdrop-blur-md border-b border-[rgba(189,239,255,0.35)]" />
      <div className="relative flex items-center justify-center gap-3 px-5 py-4 max-w-md mx-auto">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={name} className="h-8 object-contain" />
        ) : (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black"
              style={{ background: accentColor }}
            >
              FD
            </div>
            <span className="text-sm font-black text-navy" style={{ letterSpacing: '-0.02em' }}>
              {name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
