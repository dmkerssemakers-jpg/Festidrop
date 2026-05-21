'use client';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FestiDropLogo } from '@/components/Logo';

export default function QRPage() {
  const [url, setUrl] = useState('');

  useEffect(() => {
    // Point QR to root, not /qr
    setUrl(window.location.origin + '/');
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 px-8"
          style={{ background: '#07162F' }}>

      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <FestiDropLogo size="lg" />
        <p style={{ color: 'rgba(189,239,255,0.55)', fontSize: '13px', fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Festival photo experience
        </p>
      </div>

      {/* QR card */}
      <div className="rounded-[32px] p-8 flex flex-col items-center gap-6"
           style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(189,239,255,0.15)',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>

        {/* White QR background */}
        <div className="rounded-2xl p-5 bg-white">
          {url ? (
            <QRCodeSVG
              value={url}
              size={240}
              bgColor="#FFFFFF"
              fgColor="#07162F"
              level="M"
            />
          ) : (
            <div className="w-60 h-60 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#1E8BFF] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* URL */}
        <p style={{ color: 'rgba(189,239,255,0.7)', fontSize: '14px', fontWeight: 600,
                    letterSpacing: '0.02em', fontFamily: 'monospace' }}>
          {url || '…'}
        </p>
      </div>

      {/* CTA tekst */}
      <div className="text-center space-y-2 max-w-xs">
        <p style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 900,
                    letterSpacing: '-0.03em', lineHeight: 1.2 }}>
          Scan &amp; maak je polaroids
        </p>
        <p style={{ color: 'rgba(189,239,255,0.5)', fontSize: '14px', lineHeight: 1.6 }}>
          10 foto's · alleen zichtbaar via je mail
        </p>
      </div>

      {/* Subtle close hint */}
      <p style={{ position: 'fixed', bottom: '20px', color: 'rgba(189,239,255,0.2)',
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em' }}>
        {url}
      </p>
    </main>
  );
}
