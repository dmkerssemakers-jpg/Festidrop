'use client';
import { useState } from 'react';

export interface DayData {
  label: string;
  count: number;
}

export default function DashboardChart({ data }: { data: DayData[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((day, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center gap-1 relative cursor-default"
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Tooltip */}
          {hoveredIdx === i && (
            <div
              className="absolute z-10 pointer-events-none"
              style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '6px' }}
            >
              <div
                className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold text-white whitespace-nowrap"
                style={{ background: '#07162F', boxShadow: '0 4px 12px rgba(7,22,47,0.3)' }}
              >
                {day.count} drop{day.count !== 1 ? 's' : ''}
              </div>
              <div
                className="mx-auto"
                style={{
                  width: 0, height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '5px solid #07162F',
                }}
              />
            </div>
          )}

          {/* Bar */}
          <div className="w-full relative flex items-end" style={{ height: '60px' }}>
            <div
              className="w-full rounded-t-lg"
              style={{
                height: `${Math.max(4, (day.count / maxCount) * 60)}px`,
                background: day.count > 0
                  ? hoveredIdx === i
                    ? 'linear-gradient(180deg, #3D9FFF, #3DE8F5)'
                    : 'linear-gradient(180deg, #1E8BFF, #20D6E8)'
                  : hoveredIdx === i
                    ? 'rgba(189,239,255,0.45)'
                    : 'rgba(189,239,255,0.22)',
                transition: 'background 120ms, height 200ms',
              }}
            />
            {/* Count label — only show when not hovered (tooltip takes over) */}
            {day.count > 0 && hoveredIdx !== i && (
              <span
                className="absolute left-0 right-0 text-center text-[9px] font-black"
                style={{ color: '#1E8BFF', top: '-18px' }}
              >
                {day.count}
              </span>
            )}
          </div>

          <span className="text-[9px] font-medium capitalize" style={{ color: '#8A94A6' }}>
            {day.label}
          </span>
        </div>
      ))}
    </div>
  );
}
