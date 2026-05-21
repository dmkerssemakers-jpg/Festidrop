'use client';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  slug: string;
  baseUrl: string;
  accentColor: string;
}

export default function QrCodeCard({ slug, baseUrl, accentColor }: Props) {
  const url = `${baseUrl}/${slug}`;
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const svg = document.getElementById('event-qr') as unknown as SVGSVGElement;
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement('a');
      link.download = `festidrop-qr-${slug}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{
        background: 'rgba(255,255,255,0.85)',
        border: '1px solid rgba(189,239,255,0.55)',
        boxShadow: '0 4px 16px rgba(7,22,47,0.06)',
      }}
    >
      <h2 className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-4">QR Code</h2>

      {/* QR with glow */}
      <div className="flex justify-center mb-4 relative">
        <div
          className="absolute inset-0 rounded-2xl blur-xl"
          style={{ background: `${accentColor}20` }}
        />
        <div className="relative p-4 rounded-2xl"
          style={{ background: '#fff', border: `1px solid ${accentColor}25`, boxShadow: `0 8px 30px ${accentColor}15` }}>
          <QRCodeSVG
            id="event-qr"
            value={url}
            size={152}
            fgColor={accentColor}
            bgColor="#FFFFFF"
            level="M"
          />
        </div>
      </div>

      {/* URL chip */}
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg mb-4 max-w-full"
        style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}20` }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M4.5 2H2.5A1.5 1.5 0 001 3.5v4A1.5 1.5 0 002.5 9h4A1.5 1.5 0 008 7.5V5.5" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M6 1h3m0 0v3M9 1L5.5 4.5" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-[10px] font-bold truncate" style={{ color: accentColor }}>{url}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 rounded-xl py-2.5 text-xs font-bold text-white transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)` }}
        >
          <span className="flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v7M3 6l3 3 3-3M1 10h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download PNG
          </span>
        </button>

        <button
          onClick={handleCopy}
          className="rounded-xl px-3 py-2.5 text-xs font-bold transition-all hover:scale-105 active:scale-95"
          style={{
            background: copied ? 'rgba(0,200,150,0.12)' : 'rgba(189,239,255,0.25)',
            color: copied ? '#00A878' : '#07162F',
            border: `1px solid ${copied ? 'rgba(0,200,150,0.3)' : 'rgba(189,239,255,0.5)'}`,
          }}
        >
          {copied ? '✓' : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M2 10V3a1 1 0 011-1h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
