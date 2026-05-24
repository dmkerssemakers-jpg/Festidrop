'use client';
import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressStrip from './ProgressStrip';
import { DEFAULT_DESIGN } from '@/lib/polaroid-design';
import type { PolaroidDesign } from '@/lib/polaroid-design';
import { applyPolaroidFilter, applyLabelStyle } from '@/lib/polaroid-renderer';

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
  // Memoize merged design so callbacks see a stable object reference
  const d = useMemo(() => ({ ...DEFAULT_DESIGN, ...designProp }), [designProp]);

  const videoRef            = useRef<HTMLVideoElement>(null);
  const canvasRef           = useRef<HTMLCanvasElement>(null);
  const streamRef           = useRef<MediaStream | null>(null);
  const photosRef           = useRef<string[]>([]);
  const logoImgRef          = useRef<HTMLImageElement | null>(null);
  const onCompleteRef       = useRef(onComplete);
  // Stable ref to finalizePolaroid — prevents shoot() from having a stale closure
  const finalizePolaroidRef = useRef<((isLast: boolean) => Promise<void>) | null>(null);
  // Stable ref to flashAndShoot — used by countdown effect to avoid stale deps
  const flashAndShootRef    = useRef<(() => void) | null>(null);
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
  const [thumbnails,     setThumbnails]     = useState<string[]>([]);
  const [isLandscape,    setIsLandscape]    = useState(false);
  const [flashing,       setFlashing]       = useState(false);
  const [countdown,      setCountdown]      = useState<number | null>(null);
  // Start as 'requesting' — auto-start runs on mount, avoiding a 1-frame idle flicker
  const [permission,     setPermission]     = useState<'idle' | 'requesting' | 'granted' | 'denied'>('requesting');
  const [deniedReason,   setDeniedReason]   = useState<'blocked' | 'unavailable'>('blocked');
  const [facingMode,     setFacingMode]     = useState<'environment' | 'user'>('environment');
  const [switching,      setSwitching]      = useState(false);
  const [countdownSecs,  setCountdownSecs]  = useState<0 | 2 | 5>(0);
  const [finalizing,     setFinalizing]     = useState(false);
  // Flash state
  const [flashMode,      setFlashMode]      = useState<'off' | 'on'>('off');
  const [screenFlashing, setScreenFlashing] = useState(false); // full-screen white overlay for selfie flash

  const remaining  = maxPhotos - count;
  const isComplete = count >= maxPhotos;
  // Derived: whether the shutter button should be interactive
  const canShoot   = permission === 'granted' && !isComplete && countdown === null && !finalizing && !screenFlashing;

  // Derive a card background with a subtle tint of the accent color
  const [ar, ag, ab] = accentColor.startsWith('#') ? hexToRgb(accentColor) : [7, 22, 47];
  const cardBg = `rgba(${Math.round(7 + ar * 0.04)}, ${Math.round(22 + ag * 0.04)}, ${Math.round(47 + ab * 0.04)}, 0.92)`;

  // Landscape orientation detection — only relevant on phones (max-height: 480px)
  // Desktops are always landscape; this guard prevents blocking desktop users
  useEffect(() => {
    const mq  = window.matchMedia('(orientation: landscape) and (max-height: 480px)');
    const upd = (e: MediaQueryList | MediaQueryListEvent) => setIsLandscape(e.matches);
    upd(mq);
    mq.addEventListener('change', upd as (e: MediaQueryListEvent) => void);
    return () => mq.removeEventListener('change', upd as (e: MediaQueryListEvent) => void);
  }, []);

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
      }
      setPermission('granted');
      setFacingMode(mode);
    } catch (err: unknown) {
      const name = (err instanceof Error) ? err.name : '';
      setDeniedReason(name === 'NotFoundError' || name === 'OverconstrainedError' ? 'unavailable' : 'blocked');
      setPermission('denied');
    }
  }, []);

  // ── Switch front / back camera ───────────────────────────────────
  const switchCamera = useCallback(async () => {
    if (permission !== 'granted' || switching || flashing) return;
    // Turn off torch before switching (auto-resets when track stops, but be explicit)
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

  // ── Auto-start + cleanup in one effect so Strict Mode re-runs are safe ─────
  // cancelled flag prevents a stale getUserMedia result from overwriting state
  // after the effect cleanup has already stopped the stream.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setPermission('requesting');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setPermission('granted');
        setFacingMode('environment');
      } catch (err: unknown) {
        if (cancelled) return;
        const name = (err instanceof Error) ? err.name : '';
        setDeniedReason(name === 'NotFoundError' || name === 'OverconstrainedError' ? 'unavailable' : 'blocked');
        setPermission('denied');
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hardware torch helper (rear camera only) ─────────────────────
  const setTorch = useCallback(async (on: boolean) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      // torch is a non-standard constraint; cast to silence TypeScript
      await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
    } catch {
      // torch not supported on this device/browser — silently ignore
    }
  }, []);

  // ── Delete last photo (undo) ─────────────────────────────────────
  const deleteLastPhoto = useCallback(() => {
    if (photosRef.current.length === 0) return;
    photosRef.current = photosRef.current.slice(0, -1);
    setCount(photosRef.current.length);
    setThumbnails([...photosRef.current]);
  }, []);

  // ── Capture photo ────────────────────────────────────────────────
  const shoot = useCallback(() => {
    if (isComplete || flashing || permission !== 'granted') return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setFlashing(true);
    if (navigator.vibrate) navigator.vibrate(80);

    try {
    const W = FRAME_SIZE, H = FRAME_SIZE + POLAROID_BTM;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context niet beschikbaar');

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
      ctx.fillText(wm, W / 2, pad + Math.round(img * 0.52), img - 40);
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

    const isLast = (photosRef.current.length + 1) >= maxPhotos;

    setTimeout(() => {
      setFlashing(false);
      // Label is drawn directly on the existing canvas — no interim JPEG needed
      finalizePolaroidRef.current?.(isLast);
    }, 160);
    } catch (err) {
      console.error('[shoot] canvas fout:', err);
      setFlashing(false); // altijd deblokkeren zodat de knop bruikbaar blijft
    }
  }, [isComplete, flashing, permission, maxPhotos, d, eventName]);

  // ── Finalize polaroid — draw label on existing canvas, one JPEG encode ─────
  const finalizePolaroid = useCallback(async (isLast: boolean) => {
    setFinalizing(true);
    try {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    const W      = FRAME_SIZE;

    // Draw label
    ctx.fillStyle = d.labelBg;
    ctx.fillRect(0, FRAME_SIZE, W, POLAROID_BTM);
    applyLabelStyle(ctx, d.labelStyle, accentColor, W);

    // Logo or event name
    const logoImg    = logoImgRef.current;
    const hasTagline = d.labelTagline.trim().length > 0;
    const contentBot = FRAME_SIZE + POLAROID_BTM - (hasTagline ? 22 : 10);
    const labelMidY  = FRAME_SIZE + (contentBot - FRAME_SIZE) / 2;

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
        ctx.drawImage(logoImg, W / 2 - lw / 2, contentBot - lh - 4, lw, lh);
        ctx.globalAlpha = 1;
      }
    } else if (d.logoPosition !== 'hidden') {
      ctx.font      = '700 22px Inter, ui-sans-serif, sans-serif';
      ctx.fillStyle = d.labelTextColor;
      ctx.textAlign = 'center';
      ctx.fillText(eventName ?? 'FestiDrop', W / 2, labelMidY + 8, W - 60);
    }

    if (hasTagline) {
      ctx.font      = '600 10px Inter, ui-sans-serif, sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.textAlign = 'center';
      ctx.fillText(d.labelTagline.trim().toUpperCase(), W / 2, FRAME_SIZE + POLAROID_BTM - 10, W - 48);
    }

    const finalDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    photosRef.current = [...photosRef.current, finalDataUrl];
    setCount(photosRef.current.length);
    setThumbnails([...photosRef.current]);
    setFinalizing(false);

    if (isLast) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      const allPhotos = photosRef.current.slice();
      setTimeout(() => onCompleteRef.current(allPhotos), 350);
    }
    } catch (err) {
      console.error('[finalizePolaroid] fout:', err);
      setFinalizing(false); // altijd deblokkeren zodat de knop bruikbaar blijft
    }
  }, [eventName, accentColor, d, maxPhotos]);

  // Keep the ref in sync with the latest finalizePolaroid closure
  useEffect(() => { finalizePolaroidRef.current = finalizePolaroid; }, [finalizePolaroid]);

  // ── Flash + shoot — pre-illuminates then captures ─────────────────
  const flashAndShoot = useCallback(async () => {
    if (flashMode === 'on') {
      if (facingMode === 'user') {
        // Front camera: use the screen as a flash (bright white overlay illuminates face)
        setScreenFlashing(true);
        await new Promise<void>(r => setTimeout(r, 220)); // let camera pick up the lit frame
        shoot();
        await new Promise<void>(r => setTimeout(r, 300)); // wait past shutter flash (160ms)
        setScreenFlashing(false);
      } else {
        // Rear camera: use hardware LED torch
        await setTorch(true);
        shoot();
        await new Promise<void>(r => setTimeout(r, 400));
        await setTorch(false);
      }
    } else {
      shoot();
    }
  }, [flashMode, facingMode, shoot, setTorch]);

  // Keep ref in sync so countdown effect always calls the latest closure
  useEffect(() => { flashAndShootRef.current = flashAndShoot; }, [flashAndShoot]);

  // ── Countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) { setCountdown(null); flashAndShootRef.current?.(); return; }
    if (navigator.vibrate) navigator.vibrate(40); // subtle haptic per countdown tick
    const t = setTimeout(() => setCountdown(c => c !== null ? c - 1 : null), 1000);
    return () => clearTimeout(t);
  }, [countdown]); // flashAndShootRef is stable — no dep needed

  const handleShutterPress = useCallback(() => {
    if (isComplete || flashing || permission !== 'granted' || countdown !== null || finalizing || screenFlashing) return;
    if (countdownSecs === 0) {
      flashAndShootRef.current?.();
    } else {
      setCountdown(countdownSecs);
    }
  }, [isComplete, flashing, permission, countdown, countdownSecs, finalizing, screenFlashing]);

  const statusText =
    count === 0       ? 'Richt de camera en druk op de knop 📸'
    : remaining === 1 ? 'Laatste foto — maak hem speciaal! ✨'
    : `Nog ${remaining} te gaan — ga door!`;

  // ── Render ───────────────────────────────────────────────────────
  return (
    <section id="camera" className={`px-4 pb-16 max-w-md mx-auto ${topOffset}`}>

      {/* ── Full-screen selfie flash overlay ─────────────────────── */}
      <AnimatePresence>
        {screenFlashing && (
          <motion.div
            key="screen-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="fixed inset-0 bg-white z-[500] pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-[28px] overflow-hidden"
        style={{
          background:           cardBg,
          border:               `1px solid ${accentColor}30`,
          boxShadow:            `0 32px 80px rgba(7,22,47,0.30), 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px ${accentColor}30`,
          backdropFilter:       'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Flash overlay — shutter visual feedback */}
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

          {/* Permission: idle (shown only if auto-start is somehow skipped) */}
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

          {/* Viewfinder corners + controls */}
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

              {/* Flash toggle button — bottom left */}
              <button
                onClick={() => setFlashMode(m => m === 'off' ? 'on' : 'off')}
                aria-label={flashMode === 'on' ? 'Flits uitschakelen' : 'Flits inschakelen'}
                className="absolute bottom-4 left-4 w-9 h-9 rounded-full flex items-center justify-center z-10 transition-all active:scale-90"
                style={{
                  background:     flashMode === 'on'
                    ? 'rgba(255,220,0,0.22)'
                    : 'rgba(7,22,47,0.55)',
                  border:         flashMode === 'on'
                    ? '1px solid rgba(255,220,0,0.5)'
                    : '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  boxShadow:      flashMode === 'on' ? '0 0 12px rgba(255,220,0,0.3)' : 'none',
                }}
              >
                {flashMode === 'on' ? (
                  // Lightning bolt filled — flash ON
                  <svg width="15" height="17" viewBox="0 0 15 17" fill="none">
                    <path d="M9 1L1.5 9.5H7L5.5 16L13.5 7H8L9 1Z" fill="#FFD700"/>
                  </svg>
                ) : (
                  // Lightning bolt outline with diagonal slash — flash OFF
                  <svg width="15" height="17" viewBox="0 0 15 17" fill="none">
                    <path d="M9 1L1.5 9.5H7L5.5 16L13.5 7H8L9 1Z"
                      stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" strokeLinejoin="round"/>
                    <line x1="1.5" y1="15.5" x2="13.5" y2="1.5"
                      stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                )}
              </button>

              {/* Camera flip button — bottom right */}
              <button
                onClick={switchCamera}
                disabled={switching}
                aria-label="Wissel camera"
                className="absolute bottom-4 right-4 w-9 h-9 rounded-full flex items-center justify-center z-10 transition-all active:scale-90 disabled:opacity-40"
                style={{
                  background:     'rgba(7,22,47,0.55)',
                  border:         '1px solid rgba(255,255,255,0.15)',
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

              {/* Flash mode indicator — top center, only when flash is ON */}
              <AnimatePresence>
                {flashMode === 'on' && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full z-10"
                    style={{
                      background: 'rgba(255,220,0,0.2)',
                      border: '1px solid rgba(255,220,0,0.4)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <svg width="9" height="11" viewBox="0 0 9 11" fill="none">
                      <path d="M5.5 1L1 6H4.5L3.5 10L8 5H4.5L5.5 1Z" fill="#FFD700"/>
                    </svg>
                    <span className="text-[9px] font-black tracking-wider" style={{ color: '#FFD700' }}>
                      {facingMode === 'user' ? 'SCREEN' : 'FLASH'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
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
                      fontSize:   '112px',
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

          {/* Landscape warning */}
          {isLandscape && permission === 'granted' && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-30"
              style={{ background: 'rgba(7,22,47,0.90)', backdropFilter: 'blur(8px)' }}
            >
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <rect x="3" y="13" width="38" height="18" rx="5"
                  stroke="white" strokeWidth="1.8" strokeOpacity="0.55"/>
                <circle cx="22" cy="22" r="5"
                  stroke="white" strokeWidth="1.6" strokeOpacity="0.55"/>
                <path d="M36 17v-3l4 3-4 3v-3"
                  stroke="white" strokeWidth="1.5" strokeLinecap="round"
                  strokeLinejoin="round" strokeOpacity="0.4"/>
              </svg>
              <p className="text-white/75 text-sm font-bold">Draai je telefoon</p>
              <p className="text-white/35 text-xs text-center px-10 leading-relaxed">
                Houd je telefoon rechtop voor de beste polaroid-foto&apos;s
              </p>
            </div>
          )}

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

        {/* ── Photo thumbnails — horizontal scrollable strip ────── */}
        {thumbnails.length > 0 && (
          <div
            className="mx-4 mt-3 flex gap-2 overflow-x-auto pb-0.5"
            style={{ scrollbarWidth: 'none' }}
          >
            {thumbnails.map((src, i) => (
              <div
                key={i}
                className="shrink-0 rounded-lg overflow-hidden"
                style={{
                  width:     44,
                  height:    55,
                  background: '#fff',
                  padding:   '3px 3px 10px 3px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Foto ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 3, display: 'block' }}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Stats + shutter ──────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 mt-5 mb-2">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30 mb-0.5">Foto&apos;s</p>
            <p className="text-[28px] font-black leading-none tracking-[-0.04em] text-white">
              {count}
              <span className="text-sm font-bold text-white/25">/{maxPhotos}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleShutterPress}
            aria-label="Maak foto"
            className="w-[80px] h-[80px] rounded-full flex items-center justify-center focus:outline-none transition-transform active:scale-[0.86]"
            style={{
              background:  'linear-gradient(145deg, #FF3838, #C00000)',
              boxShadow:   canShoot
                ? '0 12px 32px rgba(255,30,30,0.45), inset 0 1px 0 rgba(255,255,255,0.18)'
                : '0 6px 16px rgba(255,30,30,0.2)',
              opacity:     canShoot ? 1 : 0.35,
              cursor:      canShoot ? 'pointer' : 'not-allowed',
              transition:  'transform 0.1s, opacity 0.2s, box-shadow 0.2s',
            }}
          >
            <div className="w-[58px] h-[58px] rounded-full border-2 border-white/30 flex items-center justify-center">
              <div className="w-[40px] h-[40px] rounded-full bg-white/[0.15]" />
            </div>
          </button>

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

          {/* Status text */}
          {!isComplete && (
            <p className="text-center text-[11px] mt-3 font-medium" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {statusText}
            </p>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" aria-hidden />
      </motion.div>

    </section>
  );
}
