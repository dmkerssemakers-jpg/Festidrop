interface Props {
  name:        string;
  logoUrl?:    string | null;
  accentColor: string;
}

export default function EventSubHeader({ name, logoUrl, accentColor }: Props) {
  return (
    <div
      className="fixed left-0 right-0 z-40 flex items-center justify-center gap-2 px-5 py-2"
      style={{
        top:         '61px',
        background:  `linear-gradient(135deg, ${accentColor}22, ${accentColor}10)`,
        borderBottom:`1px solid ${accentColor}35`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} className="h-5 object-contain" />
      ) : (
        <>
          <div
            className="w-4 h-4 rounded-md flex items-center justify-center text-white"
            style={{ background: accentColor, fontSize: '7px', fontWeight: 900 }}
          >
            ✦
          </div>
          <span
            className="text-[11px] font-black tracking-[-0.01em]"
            style={{ color: accentColor }}
          >
            {name}
          </span>
        </>
      )}
    </div>
  );
}
