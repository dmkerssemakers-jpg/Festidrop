'use client';
import { useState, useCallback } from 'react';

interface Photo {
  id:    string;
  url:   string;
  order: number;
}
interface EventInfo {
  name:        string;
  logoUrl:     string | null;
  accentColor: string;
  slug:        string;
}

// Deterministic rotation so no hydration mismatch
function rotation(idx: number) {
  return ((idx * 137) % 11) - 5; // -5 to +5 degrees
}

export default function GalleryView({ event, photos, email, oldestSentAt }: { event: EventInfo; photos: Photo[]; email: string; oldestSentAt?: string | null }) {
  const daysLeft = oldestSentAt
    ? Math.max(0, 30 - Math.floor((Date.now() - new Date(oldestSentAt).getTime()) / 86_400_000))
    : null;
  const [lightbox, setLightbox]   = useState<number | null>(null);
  const [copied,   setCopied]     = useState(false);
  const [dlAll,    setDlAll]      = useState(false);

  const openLightbox = (idx: number) => setLightbox(idx);
  const closeLightbox = () => setLightbox(null);
  const prev = () => setLightbox(i => (i != null && i > 0) ? i - 1 : i);
  const next = () => setLightbox(i => (i != null && i < photos.length - 1) ? i + 1 : i);

  const shareLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const downloadPhoto = useCallback(async (url: string, idx: number) => {
    const res  = await fetch(url);
    const blob = await res.blob();
    const obj  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = obj;
    a.download = `festidrop-${event.slug}-${String(idx + 1).padStart(2, '0')}.jpg`;
    a.click();
    URL.revokeObjectURL(obj);
  }, [event.slug]);

  const downloadAll = useCallback(async () => {
    setDlAll(true);
    for (let i = 0; i < photos.length; i++) {
      await downloadPhoto(photos[i].url, i);
      await new Promise(r => setTimeout(r, 400)); // small delay between downloads
    }
    setDlAll(false);
  }, [photos, downloadPhoto]);

  return (
    <div style={{ minHeight: '100vh', background: '#07162F', color: 'white', fontFamily: 'Inter, sans-serif' }}>

      {/* Countdown banner */}
      {daysLeft !== null && (
        <div style={{
          background: daysLeft <= 5 ? 'rgba(255,80,80,0.12)' : 'rgba(255,184,0,0.10)',
          borderBottom: `1px solid ${daysLeft <= 5 ? 'rgba(255,80,80,0.2)' : 'rgba(255,184,0,0.15)'}`,
          padding: '10px 24px',
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 600,
          color: daysLeft <= 5 ? '#FF8080' : '#E8A800',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          {daysLeft === 0
            ? '⚠️ Je filmrol wordt vandaag verwijderd — download je foto\'s nu!'
            : `⏳ Je filmrol is nog ${daysLeft} dag${daysLeft !== 1 ? 'en' : ''} beschikbaar — download ze om ze te bewaren.`}
        </div>
      )}

      {/* Top bar */}
      <div style={{ borderBottom: '1px solid rgba(189,239,255,0.08)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {event.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.logoUrl} alt={event.name} style={{ height: 32, objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: event.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎞️</div>
          )}
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'white' }}>{event.name}</p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(189,239,255,0.45)' }}>FestiDrop Gallery</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {photos.length > 0 && (
            <button
              onClick={downloadAll}
              disabled={dlAll}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(189,239,255,0.12)', color: 'rgba(189,239,255,0.7)', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {dlAll ? '⏳ Bezig…' : '⬇ Download alle'}
            </button>
          )}
          <button
            onClick={shareLink}
            style={{ background: event.accentColor + '20', border: `1px solid ${event.accentColor}40`, color: event.accentColor, borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            {copied ? '✓ Gekopieerd!' : '🔗 Deel link'}
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 32px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(189,239,255,0.1)', borderRadius: 999, padding: '4px 14px 4px 8px', marginBottom: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: event.accentColor, display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: 'rgba(189,239,255,0.5)', fontWeight: 600 }}>{email}</span>
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 40, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
          Jouw <span style={{ color: event.accentColor }}>filmrol</span>
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: 'rgba(189,239,255,0.5)' }}>
          {photos.length === 0
            ? 'Nog geen foto\'s gevonden voor dit e-mailadres'
            : `${photos.length} polaroid${photos.length !== 1 ? 's' : ''} van ${event.name}`}
        </p>
      </div>

      {/* Empty state */}
      {photos.length === 0 && (
        <div style={{ maxWidth: 420, margin: '0 auto', padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <p style={{ fontSize: 14, color: 'rgba(189,239,255,0.4)', lineHeight: 1.7 }}>
            Controleer of je het juiste e-mailadres hebt ingevoerd, of vraag een FestiDrop aan bij de fotobooth.
          </p>
          <a
            href={`/gallery/${event.slug}`}
            style={{ display: 'inline-block', marginTop: 20, background: event.accentColor, color: 'white', padding: '10px 24px', borderRadius: 12, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}
          >
            Ander e-mailadres proberen
          </a>
        </div>
      )}

      {/* Polaroid grid */}
      {photos.length > 0 && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 32, alignItems: 'start' }}>
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                onClick={() => openLightbox(idx)}
                style={{
                  background: 'white',
                  padding: '12px 12px 44px',
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
                  transform: `rotate(${rotation(idx)}deg)`,
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  willChange: 'transform',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'rotate(0deg) scale(1.04)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 48px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)';
                  (e.currentTarget as HTMLDivElement).style.zIndex = '10';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = `rotate(${rotation(idx)}deg) scale(1)`;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)';
                  (e.currentTarget as HTMLDivElement).style.zIndex = 'auto';
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`Foto ${idx + 1}`}
                  style={{ width: '100%', display: 'block', aspectRatio: '1', objectFit: 'cover' }}
                  loading="lazy"
                />
                <p style={{ margin: '10px 0 0', textAlign: 'center', fontSize: 11, color: '#bbb', fontFamily: 'Georgia, serif', letterSpacing: '0.05em' }}>
                  {event.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          onClick={closeLightbox}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* Prev */}
          {lightbox > 0 && (
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              style={{ position: 'absolute', left: 16, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: 48, height: 48, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >‹</button>
          )}

          {/* Photo */}
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', padding: '16px 16px 56px', borderRadius: 2, maxWidth: 'min(600px, 90vw)', maxHeight: '85vh', boxShadow: '0 32px 64px rgba(0,0,0,0.8)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[lightbox].url}
              alt={`Foto ${lightbox + 1}`}
              style={{ width: '100%', display: 'block', maxHeight: 'calc(85vh - 120px)', objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#999', fontFamily: 'Georgia, serif' }}>
                {lightbox + 1} / {photos.length}
              </p>
              <button
                onClick={() => downloadPhoto(photos[lightbox].url, lightbox)}
                style={{ background: event.accentColor, color: 'white', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                ⬇ Download
              </button>
            </div>
          </div>

          {/* Next */}
          {lightbox < photos.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: 48, height: 48, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >›</button>
          )}

          {/* Close */}
          <button
            onClick={closeLightbox}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: 40, height: 40, fontSize: 18, cursor: 'pointer' }}
          >×</button>
        </div>
      )}
    </div>
  );
}
