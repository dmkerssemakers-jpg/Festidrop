'use client';
import { useId } from 'react';

/**
 * Tiny inline trend chart (line + soft area fill) that stretches to the
 * container width. Stroke stays crisp under non-uniform scaling via
 * vector-effect. Renders nothing for fewer than 2 points.
 */
export default function Sparkline({
  series,
  color  = '#1E8BFF',
  height = 30,
}: {
  series: number[];
  color?: string;
  height?: number;
}) {
  const gradId = useId();
  if (!series || series.length < 2) return null;

  const W   = 100;                         // viewBox width — scaled to container
  const pad = 3;
  const max = Math.max(...series);
  const min = Math.min(...series);
  const range = max - min || 1;
  const stepX = W / (series.length - 1);

  const pts = series.map((v, i) => {
    const x = i * stepX;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${W},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      className="w-full block"
      style={{ height, overflow: 'visible' }}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
