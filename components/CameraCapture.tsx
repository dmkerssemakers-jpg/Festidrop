'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressStrip from './ProgressStrip';

const MAX = 10;
const FRAME_SIZE = 600;   // total canvas width (photo + side borders)
const POLAROID_BTM = 150; // thick white label area (authentic Polaroid proportions ~28%)

// ── Authentic Polaroid film filter ───────────────────────────────
// Based on real Polaroid 600 / OneStep film characteristics:
//   • Black point lifted to warm amber-brown  (~R:56 G:42 B:28)
//   • White point rolled off to warm crème    (~R:248 G:236 B:210)
//   • Flat tonality — Polaroid is NOT punchy
//   • 12% desaturation — muted, film-like palette
//   • Subtle film grain  ±8 px
//   • Medium vignette    dark edges
//   • Warm light leak    top-right

function applyPolaroidFilter(
  ctx: CanvasRenderingContext2D,
  px: number, py: number, pw: number, ph: number
): void {
  const imageData = ctx.getImageData(px, py, pw, ph);
  const d = imageData.data;

  // Per-channel LUTs
  const R = new Uint8ClampedArray(256);
  const G = new Uint8ClampedArray(256);
  const B = new Uint8ClampedArray(256);

  for (let i = 0; i < 256; i++) {
    const n = i / 255;
    // Strongly compress dynamic range → lifted blacks, compressed whites
    const f = n * 0.70 + 0.15;
    // Very gentle S-curve (flat Polaroid feel, not contrasty)
    const s = f - 0.5;
    const c = Math.max(0, Math.min(1, 0.5 + s * (1 + 0.08 * (1 - 4 * s * s))));
    const v = c * 255;
    // Warm amber-brown shadows, crème highlights
    R[i] = Math.max(0, Math.min(255, Math.round(v + 28)));                 // lift red (warm)
    G[i] = Math.max(0, Math.min(255, Math.round(v + 10)));                 // slight warm green
    B[i] = Math.max(0, Math.min(255, Math.round(v - 26 + (1 - n) * 14))); // kill blue in shadows, tiny lift in highs
  }

  // LUT + 12% desaturation + film grain in one O(n) pass
  for (let i = 0; i < d.length; i += 4) {
    let r = R[d[i]];
    let g = G[d[i + 1]];
    let b = B[d[i + 2]];
    // Slight desaturation towards warm luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    r = Math.round(r * 0.88 + lum * 0.12);
    g = Math.round(g * 0.88 + lum * 0.12);
    b = Math.round(b * 0.88 + lum * 0.12);
    // Correlated film grain (subtle)
    const grain = (Math.random() - 0.5) * 14;
    d[i]     = Math.max(0, Math.min(255, r + grain));
    d[i + 1] = Math.max(0, Math.min(255, g + grain * 0.88));
    d[i + 2] = Math.max(0, Math.min(255, b + grain * 0.72));
  }
  ctx.putImageData(imageData, px, py);

  // Vignette — medium, slightly oval
  const vig = ctx.createRadialGradient(
    px + pw / 2, py + ph / 2, pw * 0.26,
    px + pw / 2, py + ph / 2, pw * 0.70,
  );
  vig.addColorStop(0,    'rgba(0,0,0,0)');
  vig.addColorStop(0.50, 'rgba(0,0,0,0.04)');
  vig.addColorStop(1,    'rgba(0,0,0,0.52)');
  ctx.fillStyle = vig;
  ctx.fillRect(px, py, pw, ph);

  // Light leak — warm amber from top-right (subtle, authentic)
  const leak = ctx.createRadialGradient(
    px + pw * 0.84, py + ph * 0.04, 0,
    px + pw * 0.84, py + ph * 0.04, pw * 0.52,
  );
  leak.addColorStop(0,    'rgba(255,135,35,0.30)');
  leak.addColorStop(0.38, 'rgba(255,80,12,0.10)');
  leak.addColorStop(1,    'rgba(255,45,0,0)');
  ctx.fillStyle = leak;
  ctx.fillRect(px, py, pw, ph);
}

type Props = { onComplete: (photos: string[]) => void };

export default function CameraCapture({ onComplete }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const photosRef  = useRef<string[]>([]);       // accumulates all captured base64 strings
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [count,        setCount]        = useState(0);
  const [flashing,     setFlashing]     = useState(false);
  const [countdown,    setCountdown]    = useState<number | null>(null);
  const [permission,   setPermission]   = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [deniedReason, setDeniedReason] = useState<'blocked' | 'unavailable'>('blocked');

  const remaining  = MAX - count;
  const isComplete = count >= MAX;

  // ── Start camera ────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setPermission('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setPermission('granted');
      }
    } catch (err: unknown) {
      // NotAllowedError = user denied | NotFoundError/OverconstrainedError = no camera
      const name = (err instanceof Error) ? err.name : '';
      setDeniedReason(name === 'NotFoundError' || name === 'OverconstrainedError' ? 'unavailable' : 'blocked');
      setPermission('denied');
    }
  }, []);

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  // ── Countdown → fires shoot when it hits 0 ───────────────────────
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      shoot();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c !== null ? c - 1 : null), 1000);
    return () => clearTimeout(t);
  }, [countdown, shoot]);

  // ── Start countdown on button press ─────────────────────────────
  const handleShutterPress = useCallback(() => {
    if (isComplete || flashing || permission !== 'granted' || countdown !== null) return;
    setCountdown(3);
  }, [isComplete, flashing, permission, countdown]);

  // ── Capture one photo ────────────────────────────────────────────
  const shoot = useCallback(() => {
    if (isComplete || flashing || permission !== 'granted') return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setFlashing(true);

    // Build polaroid frame on canvas
    const W = FRAME_SIZE, H = FRAME_SIZE + POLAROID_BTM;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Authentic Polaroid white frame (slightly warm white)
    ctx.fillStyle = '#FEFDF8';
    ctx.fillRect(0, 0, W, H);

    // Square-crop the video feed — pad=20 for authentic border proportions
    const pad = 20, img = W - pad * 2;
    const vw = video.videoWidth || 640, vh = video.videoHeight || 480;
    let sx = 0, sy = 0, sw = vw, sh = vh;
    if (vw / vh > 1) { sw = vh; sx = (vw - sw) / 2; }
    else             { sh = vw; sy = (vh - sh) / 2; }
    ctx.drawImage(video, sx, sy, sw, sh, pad, pad, img, img);

    // Apply Polaroid 600 film filter (grain + color grade + vignette + light leak)
    applyPolaroidFilter(ctx, pad, pad, img, img);

    // Caption centred in the bottom white label area
    // Bottom border runs from y=(pad+img) to y=H → centre = pad+img + POLAROID_BTM/2
    const n = photosRef.current.length + 1;
    const labelMidY = pad + img + POLAROID_BTM / 2; // ≈ 655
    ctx.fillStyle = '#A0A8B5';
    ctx.font = '600 15px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${n} / ${MAX}`, W / 2, labelMidY - 10);
    ctx.fillStyle = '#B0BEC8';
    ctx.font = '700 11px Inter, sans-serif';
    ctx.fillText('FestiDrop', W / 2, labelMidY + 12);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    // Delay to show flash, then update state
    setTimeout(() => {
      setFlashing(false);
      photosRef.current = [...photosRef.current, dataUrl];
      const nextCount = photosRef.current.length;
      setCount(nextCount);

      // Call onComplete outside of any setState callback
      if (nextCount === MAX) {
        const allPhotos = photosRef.current.slice();
        setTimeout(() => onCompleteRef.current(allPhotos), 350);
      }
    }, 160);
  }, [isComplete, flashing, permission]);

  // ── Status line ──────────────────────────────────────────────────
  const statusText =
    count === 0    ? 'Druk op de rode knop om je eerste foto te maken'
    : remaining === 1 ? 'Nog 1 foto — maak hem speciaal!'
    : `Nog ${remaining} foto's te gaan`;

  // ── Render ───────────────────────────────────────────────────────
  return (
    <section id="camera" className="px-5 pb-16 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative glass-card rounded-[28px] overflow-hidden"
      >
        {/* Flash overlay */}
        <AnimatePresence>
          {flashing && (
            <motion.div key="flash"
              initial={{ opacity: 0 }} animate={{ opacity: 0.88 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.13 }}
              className="absolute inset-0 bg-white z-20 pointer-events-none rounded-[28px]"
            />
          )}
        </AnimatePresence>

        {/* Header bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-capture animate-red-ping" />
            <span className="text-[11px] font-black uppercase tracking-[0.1em] text-muted">
              FestiDrop Camera
            </span>
          </div>
          <span className="text-xs font-bold text-muted">{count}/{MAX}</span>
        </div>

        {/* Viewfinder */}
        <div className="mx-5 rounded-2xl overflow-hidden bg-navy aspect-square relative">

          {/* Permission: idle */}
          {permission === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                   style={{ background: 'rgba(30,139,255,0.15)' }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="2" y="9" width="28" height="20" rx="4" stroke="#1E8BFF" strokeWidth="2"/>
                  <circle cx="16" cy="19" r="6" stroke="#1E8BFF" strokeWidth="2"/>
                  <path d="M11 9V7.5A1.5 1.5 0 0112.5 6h7A1.5 1.5 0 0121 7.5V9"
                    stroke="#1E8BFF" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-white/70 text-sm text-center leading-relaxed">
                FestiDrop heeft toegang nodig tot je camera om foto's te maken.
              </p>
              <button onClick={startCamera} className="btn-primary px-6 py-3 text-sm">
                Camera inschakelen
              </button>
            </div>
          )}

          {/* Permission: requesting */}
          {permission === 'requesting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-azure border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Permission: denied */}
          {permission === 'denied' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                   style={{ background: 'rgba(255,30,30,0.15)' }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="12" stroke="rgba(255,100,100,0.7)" strokeWidth="1.8"/>
                  <path d="M14 8v8M14 19v1.5" stroke="rgba(255,120,120,0.9)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>

              {deniedReason === 'blocked' ? (
                <>
                  <div>
                    <p className="text-white/80 text-sm font-semibold mb-1">Camera-toegang geweigerd</p>
                    <p className="text-white/50 text-xs leading-relaxed">
                      Klik op het camera-icoon in de adresbalk van je browser en kies <strong className="text-white/70">"Toestaan"</strong>.
                    </p>
                  </div>
                  <button onClick={startCamera}
                    className="px-5 py-2.5 rounded-full text-sm font-bold text-white border border-white/20 hover:border-white/40 transition-colors">
                    Probeer opnieuw
                  </button>
                </>
              ) : (
                <p className="text-white/60 text-sm leading-relaxed">
                  Geen camera gevonden op dit apparaat.
                </p>
              )}
            </div>
          )}

          {/* Live video */}
          <video ref={videoRef} autoPlay playsInline muted
            className="w-full h-full object-cover"
            style={{ display: permission === 'granted' ? 'block' : 'none' }}
          />

          {/* Viewfinder corners */}
          {permission === 'granted' && !isComplete && (
            <>
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-white/40 rounded-tl" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-white/40 rounded-tr" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-white/40 rounded-bl" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-white/40 rounded-br" />
            </>
          )}

          {/* Countdown overlay */}
          <AnimatePresence>
            {countdown !== null && countdown > 0 && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center z-10"
                style={{ background: 'rgba(7,22,47,0.55)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={countdown}
                    className="font-black text-white select-none"
                    style={{ fontSize: '108px', lineHeight: 1, textShadow: '0 0 60px rgba(30,139,255,0.7), 0 4px 32px rgba(0,0,0,0.6)' }}
                    initial={{ scale: 1.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.3, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {countdown}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Complete overlay */}
          {isComplete && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                 style={{ background: 'rgba(7,22,47,0.72)' }}>
              <p className="text-white font-black text-xl">Klaar! 🎉</p>
              <p className="text-white/60 text-sm">Je drop wordt klaargemaakt…</p>
            </div>
          )}
        </div>

        {/* Stats + shutter */}
        <div className="flex items-center justify-between px-6 mt-5 mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted mb-0.5">Foto's</p>
            <p className="text-[28px] font-black leading-none tracking-[-0.04em] text-navy">
              {count}<span className="text-sm font-bold text-muted">/10</span>
            </p>
          </div>

          <motion.button
            onClick={handleShutterPress}
            whileTap={(isComplete || permission !== 'granted' || countdown !== null) ? {} : { scale: 0.87 }}
            disabled={isComplete || permission !== 'granted' || countdown !== null}
            aria-label="Maak foto"
            className="w-[76px] h-[76px] rounded-full flex items-center justify-center focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(145deg, #FF3838, #C00000)',
              boxShadow: '0 10px 30px rgba(255,30,30,0.38), inset 0 1px 0 rgba(255,255,255,0.18)',
            }}
          >
            <div className="w-[56px] h-[56px] rounded-full border-2 border-white/35 flex items-center justify-center">
              <div className="w-[38px] h-[38px] rounded-full bg-white/[0.18]" />
            </div>
          </motion.button>

          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted mb-0.5">Te gaan</p>
            <p className="text-[28px] font-black leading-none tracking-[-0.04em]"
               style={remaining === 0 ? {
                 background: 'linear-gradient(90deg,#1E8BFF,#20D6E8)',
                 WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
               } : { color: '#07162F' }}>
              {remaining}
            </p>
          </div>
        </div>

        {/* Progress + status */}
        <div className="px-5 pb-5">
          <ProgressStrip count={count} />
          <AnimatePresence mode="wait">
            {isComplete ? (
              <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center py-3 rounded-2xl"
                style={{ background: 'linear-gradient(135deg,rgba(30,139,255,0.08),rgba(32,214,232,0.12))' }}>
                <p className="text-sm font-black text-navy">Je FestiDrop is klaar!</p>
                <p className="text-xs text-muted mt-0.5">Scroll omlaag en vul je e-mail in.</p>
              </motion.div>
            ) : (
              <motion.p key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center text-xs text-muted mt-4 font-medium">
                {statusText}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <canvas ref={canvasRef} className="hidden" aria-hidden />
      </motion.div>
    </section>
  );
}
