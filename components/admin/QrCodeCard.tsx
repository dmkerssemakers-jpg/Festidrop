'use client';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  slug: string;
  baseUrl: string;
  accentColor: string;
}

export default function QrCodeCard({ slug, baseUrl, accentColor }: Props) {
  const url = `${baseUrl}/${slug}`;

  const handleDownload = () => {
    const svg = document.getElementById('event-qr') as unknown as SVGSVGElement;
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // White background
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

  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{
        background: 'rgba(255,255,255,0.85)',
        border: '1px solid rgba(189,239,255,0.55)',
        boxShadow: '0 4px 16px rgba(7,22,47,0.06)',
      }}
    >
      <h2 className="text-sm font-black uppercase tracking-[0.1em] text-muted mb-4">QR Code</h2>

      <div className="flex justify-center mb-4">
        <div className="p-3 rounded-2xl" style={{ background: '#fff', border: '1px solid rgba(189,239,255,0.4)' }}>
          <QRCodeSVG
            id="event-qr"
            value={url}
            size={160}
            fgColor={accentColor}
            bgColor="#FFFFFF"
            level="M"
          />
        </div>
      </div>

      <p className="text-xs text-muted mb-4 break-all">{url}</p>

      <button
        onClick={handleDownload}
        className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)' }}
      >
        Download PNG
      </button>
    </div>
  );
}
