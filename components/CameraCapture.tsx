'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressStrip from './ProgressStrip';
import { DEFAULT_DESIGN } from '@/lib/polaroid-design';
import type { PolaroidDesign } from '@/lib/polaroid-design';
import { applyPolaroidFilter } from '@/lib/polaroid-renderer';

const MAX = 10;
const FRAME_SIZE   = 600;
const POLAROID_BTM = 150;

type Props = {
  onComplete:   (photos: string[]) => void;
  maxPhotos?:   number;
  eventId?:     string;
  logoUrl?:     string | null;
  eventName?:   string;
  accentColor?: string;
  topOffset?:   string;
  design?:      PolaroidDesign;
};

// Convert hex color to individual R,G,B values for mixing
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export default function CameraCapture({
  onComplete,
  maxPhotos   = MAX,
  logoUrl,
  eventName,
  accentColor = '#1E8BFF',
  topOffset   = 'pt-24',
  design: designProp,
}: Props) {
  const d = { ...DEFAULT_DESIGN, ...designProp }; // merged design config
  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const photosRef     = useRef<string[]>([]);
  const logoImgRef    = useRef<HTMLImageElement | null>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Pre-load logo
  useEffect(() => {
    if (!logoUrl) { logoImgRef.current = null; return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => { logoImgRef.current = img; };
    img.onerror = () => { logoImgRef.current = null; };
    img.src = logoUrl;
  }, [logoUrl]);

  const [count,          setCount]          = useState(0);
  const [flashing,       setFlashing]       = useState(false);
  const [countdown,      setCountdown]      = useState<number | null>(null);
  const [permission,     setPermission]     = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [deniedReason,   setDeniedReason]   = useState<'blocked' | 'unavailable'>('blocked');
  const [facingMode,     setFacingMode]     = useState<'environment' | 'user'>('environment');
  const [switching,      setSwitching]      = useState(false);
  const [countdownSecs,  setCountdownSecs]  = useState<0 | 2 | 5>(2);
  // Memory note modal
  const [pendingPhoto,   setPendingPhoto]   = useState<string | null>(null);
  const [noteText,       setNoteText]       = useState('');
  const pendingIsLastRef = useRef(false);

  const remaining  = maxPhotos - count;
  const isComplete = count >= maxPhotos;

  // Derive a card background with a subtle tint of the accent color
  const [ar, ag, ab] = accentColor.startsWith('#') ? hexToRgb(accentColor) : [7, 22, 47];
  const cardBg = `rgba(${Math.round(7 + ar * 0.04)}, ${Math.round(22 + ag * 0.04)}, ${Math.round(47 + ab * 0.04)}, 0.92)`;

  // ── Start camera ────────────────────────────────────────────────
  const startCamera = useCallback(async (mode: 'environment' | 'user' = 'environment') => {
    setPermission('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setPermission('granted');
        setFacingMode(mode);
      }
    } catch (err: unknown) {
      const name = (err instanceof Error) ? err.name : '';
      setDeniedReason(name === 'NotFoundError' || name === 'OverconstrainedError' ? 'unavailable' : 'blocked');
      setPermission('denied');
    }
  }, []);

  // ── Switch front / back camera ───────────────────────────────────
  const switchCamera = useCallback(async () => {
    if (permission !== 'granted' || switching || flashing) return;
    setSwitching(true);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: newMode }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setFacingMode(newMode);
      }
    } catch {
      // device might only have one camera — restart with original mode
      await startCamera(facingMode);
    } finally {
      setSwitching(false);
    }
  }, [permission, switching, flashing, facingMode, startCamera]);

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  // ── Auto-start camera on mount ───────────────────────────────────
  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (!hasAutoStarted.current) {
      hasAutoStarted.current = true;
      startCamera();
    }
  }, [startCamera]);

  // ── Delete last photo (undo) ─────────────────────────────────────
  const deleteLastPhoto = useCallback(() => {
    if (photosRef.current.length === 0) return;
    photosRef.current = photosRef.current.slice(0, -1);
    setCount(photosRef.current.length);
  }, []);

  // ── Capture photo ────────────────────────────────────────────────
  const shoot = useCallback(() => {
    if (isComplete || flashing || permission !== 'granted') return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setFlashing(true);
    if (navigator.vibrate) navigator.vibrate(80);

    const W = FRAME_SIZE, H = FRAME_SIZE + POLAROID_BTM;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = d.frameColor;
    ctx.fillRect(0, 0, W, H);

    const pad = 20, img = W - pad * 2;
    const vw = video.videoWidth || 640, vh = video.videoHeight || 480;
    let sx = 0, sy = 0, sw = vw, sh = vh;
    if (vw / vh > 1) { sw = vh; sx = (vw - sw) / 2; }
    else             { sh = vw; sy = (vh - sh) / 2; }
    ctx.drawImage(video, sx, sy, sw, sh, pad, pad, img, img);

    applyPolaroidFilter(ctx, pad, pad, img, img, d.filterStrength);

    // ── Event name watermark ──────────────────────────────────────────
    if (d.watermark && eventName) {
      ctx.save();
      const wm     = eventName.toUpperCase();
      const wmSize = wm.length > 16 ? 28 : wm.length > 10 ? 34 : 40;
      ctx.font        = `900 ${wmSize}px Inter, ui-sans-serif, sans-serif`;
      ctx.textAlign   = 'center';
      ctx.globalAlpha = d.watermarkOpacity / 100;
      ctx.fillStyle   = d.watermarkColor;
      ctx.fillText(wm, W / 2, pad + img - 16, img - 40);
      ctx.restore();
    }

    // ── Date/time stamp ───────────────────────────────────────────────
    if (d.dateStamp) {
      const now = new Date();
      const dd  = String(now.getDate()).padStart(2, '0');
      const mm  = String(now.getMonth() + 1).padStart(2, '0');
      const yy  = String(now.getFullYear()).slice(2);
      const hh  = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const x   = d.dateStampPosition === 'right' ? pad + img - 10 : pad + 10;

      ctx.save();
      ctx.textAlign   = d.dateStampPosition === 'right' ? 'right' : 'left';
      ctx.font        = 'bold 17px "Courier New", monospace';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur  = 6;
      ctx.fillStyle   = d.dateStampColor;
      ctx.fillText(`${dd} ${mm} '${yy}`, x, pad + img - 22);
      ctx.fillText(`${hh}:${min}`,       x, pad + img - 5);
      ctx.restore();
    }

    // ── Save interim (no label yet — added after note modal) ─────────
    const interimDataUrl = canvas.toDataURL('image/jpeg', 0.92);

    setTimeout(() => {
      setFlashing(false);
      pendingIsLastRef.current = (photosRef.current.length + 1) >= maxPhotos;
      setPendingPhoto(interimDataUrl);
    }, 160);
  }, [isComplete, flashing, permission, maxPhotos]);

  // ── Finalize polaroid (after note modal) ─────────────────────────
  const finalizePolaroid = useCallback(async (note: string) => {
    const interim = pendingPhoto;
    if (!interim) return;
    setPendingPhoto(null);
    setNoteText('');

    // Ensure Caveat is loaded for canvas use
    try { await document.fonts.load('700 24px Caveat'); } catch { /* use fallback */ }

    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    const W      = FRAME_SIZE;

    // Load interim image back onto canvas
    await new Promise<void>(resolve => {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0); resolve(); };
      img.src = interim;
    });

    // Clear label area and redraw
    ctx.fillStyle = d.labelBg;
    ctx.fillRect(0, FRAME_SIZE, W, POLAROID_BTM);

    const noteClean = note.trim();
    if (noteClean) {
      // Memory text — large handwriting font, hero of the label area
      const fontSize = noteClean.length > 26 ? 32 : noteClean.length > 16 ? 38 : 44;
      ctx.font       = `700 ${fontSize}px Caveat, var(--font-caveat), cursive`;
      ctx.fillStyle  = d.labelTextColor;
      ctx.textAlign  = 'center';
      ctx.fillText(noteClean, W / 2, FRAME_SIZE + 68, W - 48);

      ctx.font      = '700 20px Caveat, cursive';
      ctx.fillStyle = '#C0392B';
      ctx.fillText('♥', W / 2, FRAME_SIZE + 98);

      ctx.font      = '500 10px Inter, ui-sans-serif, sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.20)';
      ctx.textAlign = 'center';
      ctx.fillText((eventName ?? 'FestiDrop').toUpperCase(), W / 2, FRAME_SIZE + 136);
    } else {
      // No note — show logo or event name based on design config
      const logoImg   = logoImgRef.current;
      const labelMidY = FRAME_SIZE + POLAROID_BTM / 2;

      if (logoImg && d.logoPosition !== 'hidden') {
        if (d.logoPosition === 'center') {
          const maxW = 220, maxH = 70;
          const r  = Math.min(maxW / logoImg.naturalWidth, maxH / logoImg.naturalHeight, 1);
          const lw = logoImg.naturalWidth * r, lh = logoImg.naturalHeight * r;
          ctx.drawImage(logoImg, W / 2 - lw / 2, labelMidY - lh / 2, lw, lh);
        } else {
          const maxW = 160, maxH = 40;
          const r  = Math.min(maxW / logoImg.naturalWidth, maxH / logoImg.naturalHeight, 1);
          const lw = logoImg.naturalWidth * r, lh = logoImg.naturalHeight * r;
          ctx.globalAlpha = 0.65;
          ctx.drawImage(logoImg, W / 2 - lw / 2, FRAME_SIZE + POLAROID_BTM - lh - 12, lw, lh);
          ctx.globalAlpha = 1;
        }
      } else if (d.logoPosition !== 'hidden') {
        if (eventName) {
          ctx.font      = '700 22px Inter, ui-sans-serif, sans-serif';
          ctx.fillStyle = d.labelTextColor;
          ctx.textAlign = 'center';
          ctx.fillText(eventName, W / 2, labelMidY + 8, W - 60);
        } else {
          ctx.font      = '700 15px Inter, ui-sans-serif, sans-serif';
          ctx.fillStyle = '#8A94A6';
          ctx.textAlign = 'center';
          ctx.fillText('FestiDrop', W / 2, labelMidY + 6);
        }
      }
    }

    const finalDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    photosRef.current = [...photosRef.current, finalDataUrl];
    const nextCount = photosRef.current.length;
    setCount(nextCount);

    if (pendingIsLastRef.current) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      const allPhotos = photosRef.current.slice();
      setTimeout(() => onCompleteRef.current(allPhotos), 350);
    }
  }, [pendingPhoto, eventName]);

  // ── Countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) { setCountdown(null); shoot(); return; }
    const t = setTimeout(() => setCountdown(c => c !== null ? c - 1 : null), 1000);
    return () => clearTimeout(t);
  }, [countdown, shoot]);

  const handleShutterPress = useCallback(() => {
    if (isComplete || flashing || permission !== 'granted' || countdown !== null || pendingPhoto !== null) return;
    if (countdownSecs === 0) {
      shoot();
    } else {
      setCountdown(countdownSecs);
    }
  }, [isComplete, flashing, permission, countdown, countdownSecs, pendingPhoto, shoot]);

  const statusText =
    count === 0       ? 'Richt de camera en druk op de knop 📸'
    : remaining === 1 ? 'Laatste foto — maak hem speciaal! ✨'
    : `Nog ${remaining} te gaan — ga door!`;

  // ── Render ───────────────────────────────────────────────────────
  return (
    <section id="camera" className={`px-4 pb-16 max-w-md mx-auto ${topOffset}`}>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-[28px] overflow-hidden"
        style={{
          background:          cardBg,
          border:              `1px solid ${accentColor}30`,
          boxShadow:           `0 32px 80px rgba(7,22,47,0.30), 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px ${accentColor}30`,
          backdropFilter:      'blur(24px)',
          WebkitBackdropFilter:'blur(24px)',
        }}
      >
        {/* Flash overlay */}
        <AnimatePresence>
          {flashing && (
            <motion.div key="flash"
              initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.13 }}
              className="absolute inset-0 bg-white z-20 pointer-events-none rounded-[28px]"
            />
          )}
        </AnimatePresence>

        {/* ── Event branded header ─────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 pt-5 pb-4"
          style={{ borderBottom: `1px solid ${accentColor}20` }}
        >
          {/* Event identity — always text, never logo img in small header */}
          <div className="flex items-center gap-3 min-w-0">
            {eventName ? (
              <>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, ${accentColor}BB)`,
                    fontSize: '10px', fontWeight: 900,
                    boxShadow: `0 4px 12px ${accentColor}50`,
                  }}
                >
                  ✦
                </div>
                <span
                  className="font-black text-sm truncate"
                  style={{ color: accentColor }}
                >
                  {eventName}
                </span>
              </>
            ) : (
              <span className="text-[11px] font-black uppercase tracking-[0.12em] text-white/30">
                FestiDrop Camera
              </span>
            )}
          </div>

          {/* Live indicator + count */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-red-ping bg-red-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/25">Live</span>
            </div>
            <div
              className="px-2.5 py-1 rounded-full text-[10px] font-black"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.40)' }}
            >
              {count}/{maxPhotos}
            </div>
          </div>
        </div>

        {/* ── Viewfinder ──────────────────────────────────────── */}
        <div className="mx-4 mt-4 rounded-2xl overflow-hidden aspect-square relative"
          style={{ background: '#000' }}>

          {/* Permission: idle */}
          {permission === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6">
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}30` }}
              >
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <rect x="2" y="10" width="32" height="22" rx="5" stroke={accentColor} strokeWidth="2"/>
                  <circle cx="18" cy="21" r="7" stroke={accentColor} strokeWidth="2"/>
                  <path d="M12 10V8.5A2.5 2.5 0 0114.5 6h7A2.5 2.5 0 0124 8.5V10"
                    stroke={accentColor} strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </motion.div>
              <div className="text-center">
                <p className="text-white/80 text-sm font-bold mb-1">Camera nodig</p>
                <p className="text-white/40 text-xs leading-relaxed">
                  FestiDrop heeft toegang tot je camera nodig om foto&apos;s te maken.
                </p>
              </div>
              <button
                onClick={() => startCamera()}
                className="px-8 py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
                  boxShadow:  `0 8px 24px ${accentColor}40`,
                }}
              >
                Camera inschakelen
              </button>
            </div>
          )}

          {/* Permission: requesting */}
          {permission === 'requesting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: `${accentColor}60`, borderTopColor: 'transparent' }}
              />
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
                    <p className="text-white/40 text-xs leading-relaxed">
                      Klik op het camera-icoon in de adresbalk en kies <strong className="text-white/60">&ldquo;Toestaan&rdquo;</strong>.
                    </p>
                  </div>
                  <button onClick={() => startCamera()}
                    className="px-5 py-2.5 rounded-full text-sm font-bold text-white border border-white/15 hover:border-white/30 transition-colors">
                    Probeer opnieuw
                  </button>
                </>
              ) : (
                <p className="text-white/50 text-sm leading-relaxed">Geen camera gevonden op dit apparaat.</p>
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
              <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 rounded-tl"
                style={{ borderColor: `${accentColor}90` }} />
              <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 rounded-tr"
                style={{ borderColor: `${accentColor}90` }} />
              <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 rounded-bl"
                style={{ borderColor: `${accentColor}90` }} />
              <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 rounded-br"
                style={{ borderColor: `${accentColor}90` }} />

              {/* Camera flip button */}
              <button
                onClick={switchCamera}
                disabled={switching}
                aria-label="Wissel camera"
                className="absolute bottom-4 right-4 w-9 h-9 rounded-full flex items-center justify-center z-10 transition-all active:scale-90 disabled:opacity-40"
                style={{
                  background: 'rgba(7,22,47,0.55)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <svg
                  width="17" height="17" viewBox="0 0 17 17" fill="none"
                  className={switching ? 'animate-spin' : ''}
                  style={{ transformOrigin: 'center' }}
                >
                  <path d="M2.5 6A6 6 0 018.5 2.5c2 0 3.8.98 4.9 2.5M14.5 11A6 6 0 018.5 14.5c-2 0-3.8-.98-4.9-2.5"
                    stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M12.5 2l2.5 3-3 .5M4.5 15l-2.5-3 3-.5"
                    stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          )}

          {/* Countdown overlay */}
          <AnimatePresence>
            {countdown !== null && countdown > 0 && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center z-10"
                style={{ background: 'rgba(7,22,47,0.6)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={countdown}
                    className="font-black text-white select-none"
                    style={{
                      fontSize: '112px',
                      lineHeight: 1,
                      textShadow: `0 0 60px ${accentColor}80, 0 4px 32px rgba(0,0,0,0.7)`,
                    }}
                    initial={{ scale: 1.8, opacity: 0 }}
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                 style={{ background: 'rgba(7,22,47,0.82)' }}>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: `${accentColor}25`, border: `2px solid ${accentColor}60` }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M5 14l7 7 11-11" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
              <p className="text-white font-black text-xl">Klaar! 🎉</p>
              <p className="text-white/50 text-sm">Je drop wordt klaargemaakt…</p>
            </div>
          )}
        </div>

        {/* ── Stats + shutter ──────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 mt-5 mb-2">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30 mb-0.5">Foto&apos;s</p>
            <p className="text-[28px] font-black leading-none tracking-[-0.04em] text-white">
              {count}
              <span className="text-sm font-bold text-white/25">/{maxPhotos}</span>
            </p>
          </div>

          <motion.button
            onClick={handleShutterPress}
            whileTap={(isComplete || permission !== 'granted' || countdown !== null || pendingPhoto !== null) ? {} : { scale: 0.86 }}
            disabled={isComplete || permission !== 'granted' || countdown !== null || pendingPhoto !== null}
            aria-label="Maak foto"
            className="w-[80px] h-[80px] rounded-full flex items-center justify-center focus:outline-none disabled:opacity-35 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(145deg, #FF3838, #C00000)',
              boxShadow:  permission === 'granted' && !isComplete
                ? '0 12px 32px rgba(255,30,30,0.45), inset 0 1px 0 rgba(255,255,255,0.18)'
                : '0 6px 16px rgba(255,30,30,0.2)',
            }}
          >
            <div className="w-[58px] h-[58px] rounded-full border-2 border-white/30 flex items-center justify-center">
              <div className="w-[40px] h-[40px] rounded-full bg-white/[0.15]" />
            </div>
          </motion.button>

          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30 mb-0.5">Te gaan</p>
            <p
              className="text-[28px] font-black leading-none tracking-[-0.04em]"
              style={remaining === 0
                ? { color: accentColor, filter: `drop-shadow(0 0 12px ${accentColor}80)` }
                : { color: '#fff' }
              }
            >
              {remaining}
            </p>
          </div>
        </div>

        {/* ── Progress + status ────────────────────────────────── */}
        <div className="px-5 pb-6">
          <ProgressStrip count={count} maxPhotos={maxPhotos} accentColor={accentColor} />

          <AnimatePresence mode="wait">
            {isComplete ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="mt-5 text-center py-3 rounded-2xl"
                style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
              >
                <p className="text-sm font-black text-white">Je FestiDrop is klaar!</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Scroll omlaag en vul je e-mail in.
                </p>
              </motion.div>
            ) : (
              <motion.div key="controls" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-4 flex items-center justify-between gap-3">

                {/* Undo last photo */}
                <AnimatePresence>
                  {count > 0 ? (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={deleteLastPhoto}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95"
                      style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.2)', color: 'rgba(255,140,140,0.9)' }}
                    >
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M2 3h7M4 3V2h3v1M4.5 5v3M6.5 5v3M2.5 3l.5 6h5l.5-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Verwijder
                    </motion.button>
                  ) : (
                    <div />
                  )}
                </AnimatePresence>

                {/* Countdown selector */}
                <div className="flex items-center gap-1">
                  {([0, 2, 5] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setCountdownSecs(s)}
                      className="px-2.5 py-1 rounded-full text-[10px] font-black transition-all"
                      style={countdownSecs === s
                        ? { background: `${accentColor}30`, color: accentColor, border: `1px solid ${accentColor}50` }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.28)', border: '1px solid transparent' }
                      }
                    >
                      {s === 0 ? '⚡' : `${s}s`}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <canvas ref={canvasRef} className="hidden" aria-hidden />
      </motion.div>

      {/* ── Memory note modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {pendingPhoto && (
          <motion.div
            key="note-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-end justify-center"
            style={{ background: 'rgba(7,22,47,0.70)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="w-full max-w-md rounded-t-[32px] overflow-hidden"
              style={{
                background:   'rgba(14,26,52,0.97)',
                border:       `1px solid ${accentColor}25`,
                borderBottom: 'none',
                boxShadow:    `0 -24px 60px rgba(7,22,47,0.5), 0 0 40px ${accentColor}18`,
              }}
            >
              {/* Top accent line */}
              <div className="h-px w-full"
                style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }} />

              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
              </div>

              <div className="px-6 pb-8 pt-2">
                {/* Header with thumbnail */}
                <div className="flex items-center gap-4 mb-5">
                  {/* Photo thumbnail */}
                  <div className="rounded-xl overflow-hidden shrink-0"
                    style={{ width: 52, height: 64, background: '#FEFDF8', boxShadow: '0 4px 16px rgba(7,22,47,0.4)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pendingPhoto} alt="" className="w-full object-cover"
                      style={{ height: 'calc(100% - 11px)' }} />
                    <div className="h-[11px] bg-[#FEFDF8]" />
                  </div>
                  <div>
                    <p className="text-white font-black text-base" style={{ letterSpacing: '-0.02em' }}>
                      Voeg een herinnering toe
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      Verschijnt op je polaroid
                    </p>
                  </div>
                </div>

                {/* Text input with handwriting font preview */}
                <div className="relative mb-3">
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value.slice(0, 40))}
                    placeholder="Best night ever ♥"
                    rows={2}
                    autoFocus
                    className="w-full px-4 py-3 rounded-2xl resize-none focus:outline-none transition-all"
                    style={{
                      background:  'rgba(255,255,255,0.06)',
                      border:      `1px solid ${noteText ? accentColor + '50' : 'rgba(255,255,255,0.10)'}`,
                      color:       '#fff',
                      fontSize:    '22px',
                      lineHeight:  1.3,
                      fontFamily:  'var(--font-caveat), Caveat, cursive',
                      caretColor:  accentColor,
                    }}
                  />
                  {/* Character counter */}
                  <span
                    className="absolute bottom-2.5 right-3 text-[10px] font-bold tabular-nums"
                    style={{ color: noteText.length > 35 ? '#FF6B35' : 'rgba(255,255,255,0.22)' }}
                  >
                    {noteText.length}/40
                  </span>
                </div>

                {/* Quick emoji / symbols bar */}
                <div className="flex gap-2 mb-5 flex-wrap">
                  {['♥', '✦', '🎵', '🎉', '📸', '⚡', '🌙', '✌️'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setNoteText(t => (t + emoji).slice(0, 40))}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all hover:scale-110 active:scale-90"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => finalizePolaroid('')}
                    className="flex-1 py-3.5 rounded-full text-sm font-bold transition-all hover:opacity-80"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border:     '1px solid rgba(255,255,255,0.10)',
                      color:      'rgba(255,255,255,0.45)',
                    }}
                  >
                    Sla over
                  </button>
                  <motion.button
                    onClick={() => finalizePolaroid(noteText)}
                    whileTap={{ scale: 0.97 }}
                    className="flex-[2] py-3.5 rounded-full text-sm font-black text-white transition-all flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
                      boxShadow:  `0 8px 24px ${accentColor}45`,
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: '18px' }}>
                      {noteText.trim() ? `"${noteText.trim().slice(0, 12)}${noteText.length > 12 ? '…' : ''}"` : 'Bewaar'}
                    </span>
                    ♥
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
