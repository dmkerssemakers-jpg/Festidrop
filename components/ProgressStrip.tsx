type Props = { count: number };

export default function ProgressStrip({ count }: Props) {
  return (
    <div className="flex items-center justify-center gap-1.5 mt-5 pb-1">
      {Array.from({ length: 10 }, (_, i) => {
        const filled = i < count;
        const isLatest = i === count - 1 && count > 0;
        return (
          <div
            key={i}
            className="h-2 rounded-full transition-all duration-500 ease-out"
            style={{
              width: isLatest ? '26px' : '8px',
              background: filled
                ? 'linear-gradient(90deg, #1E8BFF, #20D6E8)'
                : 'rgba(189,239,255,0.45)',
              border: filled ? 'none' : '1px solid rgba(30,139,255,0.18)',
            }}
          />
        );
      })}
    </div>
  );
}
