type Props = {
  count:      number;
  maxPhotos?: number;
  accentColor?: string;
};

export default function ProgressStrip({ count, maxPhotos = 10, accentColor = '#1E8BFF' }: Props) {
  // For very large sessions show a bar instead of too many tiny dots
  if (maxPhotos > 18) {
    const pct = Math.round((count / maxPhotos) * 100);
    return (
      <div className="mt-5 pb-1 space-y-1.5">
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}BB)` }}
          />
        </div>
        <div className="flex justify-between px-0.5">
          <span className="text-[9px] font-bold" style={{ color: `${accentColor}90` }}>{count} foto{count !== 1 ? '\'s' : ''}</span>
          <span className="text-[9px] font-bold text-white/25">{maxPhotos} max</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-5 pb-1">
      {Array.from({ length: maxPhotos }, (_, i) => {
        const filled   = i < count;
        const isLatest = i === count - 1 && count > 0;
        return (
          <div
            key={i}
            className="h-2 rounded-full transition-all duration-500 ease-out"
            style={{
              width:      isLatest ? '24px' : maxPhotos > 12 ? '6px' : '8px',
              background: filled
                ? `linear-gradient(90deg, ${accentColor}, ${accentColor}BB)`
                : 'rgba(255,255,255,0.15)',
              boxShadow:  isLatest ? `0 0 8px ${accentColor}70` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
