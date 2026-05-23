import type { PolaroidDesign, LabelStyle } from './polaroid-design';

export const FRAME_SIZE   = 600;
export const POLAROID_BTM = 150;
const PAD = 20;

// ── Colour helper ─────────────────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Label visual decoration ───────────────────────────────────────────────────
export function applyLabelStyle(
  ctx:         CanvasRenderingContext2D,
  style:       LabelStyle,
  accentColor: string,
  W:           number,
): void {
  const y = FRAME_SIZE;
  const h = POLAROID_BTM;

  switch (style) {
    case 'accent-line': {
      ctx.fillStyle = accentColor;
      ctx.fillRect(0, y, W, 5);
      break;
    }
    case 'gradient': {
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0,   hexToRgba(accentColor, 0.24));
      g.addColorStop(0.55, hexToRgba(accentColor, 0.06));
      g.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, y, W, h);
      break;
    }
    case 'duotone': {
      // Diagonal sweep from top-left in accent colour
      const g = ctx.createLinearGradient(0, y, W, y + h);
      g.addColorStop(0,    hexToRgba(accentColor, 0.30));
      g.addColorStop(0.45, hexToRgba(accentColor, 0.08));
      g.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, y, W, h);
      break;
    }
    case 'dots': {
      ctx.save();
      ctx.globalAlpha = 0.13;
      ctx.fillStyle   = accentColor;
      const spacing = 14, r = 1.5;
      for (let px = spacing / 2; px < W; px += spacing) {
        for (let py = y + spacing / 2; py < y + h; py += spacing) {
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      break;
    }
    case 'grain': {
      const imageData = ctx.getImageData(0, y, W, h);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() - 0.5) * 22;
        d[i]   = Math.max(0, Math.min(255, d[i]   + n));
        d[i+1] = Math.max(0, Math.min(255, d[i+1] + n));
        d[i+2] = Math.max(0, Math.min(255, d[i+2] + n));
      }
      ctx.putImageData(imageData, 0, y);
      break;
    }
    // 'solid': no overlay needed
  }
}

// ── Authentic Polaroid 600 film filter (parameterized strength) ───────────────
export function applyPolaroidFilter(
  ctx: CanvasRenderingContext2D,
  px: number, py: number, pw: number, ph: number,
  strength = 100,
): void {
  if (strength <= 0) return;
  const s = Math.min(1, strength / 100);

  const imageData = ctx.getImageData(px, py, pw, ph);
  const d = imageData.data;

  const R = new Uint8ClampedArray(256);
  const G = new Uint8ClampedArray(256);
  const B = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) {
    const n  = i / 255;
    const f  = n * 0.90 + 0.05;
    const sc = f - 0.5;
    const c  = Math.max(0, Math.min(1, 0.5 + sc * (1 + 0.22 * (1 - 4 * sc * sc))));
    const v  = c * 255;
    R[i] = Math.max(0, Math.min(255, Math.round(v + 16)));
    G[i] = Math.max(0, Math.min(255, Math.round(v + 5)));
    B[i] = Math.max(0, Math.min(255, Math.round(v - 12 + (1 - n) * 6)));
  }

  for (let i = 0; i < d.length; i += 4) {
    const oR = d[i], oG = d[i + 1], oB = d[i + 2];
    let r = R[oR], g = G[oG], b = B[oB];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    r = Math.round(r * 0.92 + lum * 0.08);
    g = Math.round(g * 0.92 + lum * 0.08);
    b = Math.round(b * 0.92 + lum * 0.08);
    const grain = (Math.random() - 0.5) * 10 * s;
    d[i]     = Math.round(oR * (1 - s) + Math.max(0, Math.min(255, r + grain))        * s);
    d[i + 1] = Math.round(oG * (1 - s) + Math.max(0, Math.min(255, g + grain * 0.88)) * s);
    d[i + 2] = Math.round(oB * (1 - s) + Math.max(0, Math.min(255, b + grain * 0.72)) * s);
  }
  ctx.putImageData(imageData, px, py);

  // Vignette
  const vig = ctx.createRadialGradient(
    px + pw / 2, py + ph / 2, pw * 0.26,
    px + pw / 2, py + ph / 2, pw * 0.70,
  );
  vig.addColorStop(0,   'rgba(0,0,0,0)');
  vig.addColorStop(0.5, `rgba(0,0,0,${+(0.04 * s).toFixed(3)})`);
  vig.addColorStop(1,   `rgba(0,0,0,${+(0.52 * s).toFixed(3)})`);
  ctx.fillStyle = vig;
  ctx.fillRect(px, py, pw, ph);

  // Light leak
  const leak = ctx.createRadialGradient(
    px + pw * 0.84, py + ph * 0.04, 0,
    px + pw * 0.84, py + ph * 0.04, pw * 0.52,
  );
  leak.addColorStop(0,    `rgba(255,135,35,${+(0.30 * s).toFixed(3)})`);
  leak.addColorStop(0.38, `rgba(255,80,12,${+(0.10 * s).toFixed(3)})`);
  leak.addColorStop(1,    'rgba(255,45,0,0)');
  ctx.fillStyle = leak;
  ctx.fillRect(px, py, pw, ph);
}

// ── Festival gradient placeholder ────────────────────────────────────────────
// Uses a deterministic seed array so the crowd looks the same every render
const CROWD_SEED = [
  0.18, 0.32, 0.08, 0.25, 0.14, 0.29, 0.06, 0.20, 0.12, 0.28,
  0.19, 0.33, 0.10, 0.24, 0.16, 0.31, 0.09, 0.22, 0.11, 0.27,
  0.17, 0.30, 0.07, 0.26, 0.13, 0.35, 0.05, 0.23, 0.15, 0.34,
];

export function drawPlaceholderPhoto(
  ctx: CanvasRenderingContext2D,
  px: number, py: number, pw: number, ph: number,
): void {
  // Sky
  const sky = ctx.createLinearGradient(px, py, px, py + ph);
  sky.addColorStop(0,    '#160326');
  sky.addColorStop(0.30, '#5C0B73');
  sky.addColorStop(0.60, '#D44A12');
  sky.addColorStop(1,    '#F5A020');
  ctx.fillStyle = sky;
  ctx.fillRect(px, py, pw, ph);

  // Bokeh / atmosphere blobs
  const blobs: [number, number, number, string][] = [
    [0.15, 0.52, 70,  'rgba(255,180,40,0.18)'],
    [0.50, 0.38, 90,  'rgba(255,60,180,0.12)'],
    [0.80, 0.50, 60,  'rgba(40,200,255,0.14)'],
    [0.35, 0.65, 50,  'rgba(255,140,30,0.22)'],
    [0.66, 0.60, 65,  'rgba(180,50,255,0.18)'],
    [0.90, 0.25, 40,  'rgba(255,220,60,0.16)'],
  ];
  blobs.forEach(([bx, by, br, bc]) => {
    const g = ctx.createRadialGradient(
      px + pw * bx, py + ph * by, 0,
      px + pw * bx, py + ph * by, br,
    );
    g.addColorStop(0, bc);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(px, py, pw, ph);
  });

  // Stage light beams
  ctx.save();
  [[0.20, 0.12], [0.50, 0.08], [0.80, 0.12]].forEach(([bx, by]) => {
    const beam = ctx.createLinearGradient(
      px + pw * bx, py + ph * by,
      px + pw * bx, py + ph,
    );
    beam.addColorStop(0, 'rgba(255,255,255,0.14)');
    beam.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(px + pw * bx,           py + ph * by);
    ctx.lineTo(px + pw * (bx - 0.07), py + ph);
    ctx.lineTo(px + pw * (bx + 0.07), py + ph);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();

  // Ground fade
  const ground = ctx.createLinearGradient(px, py + ph * 0.54, px, py + ph);
  ground.addColorStop(0, 'rgba(8,4,18,0)');
  ground.addColorStop(1, 'rgba(8,4,18,0.94)');
  ctx.fillStyle = ground;
  ctx.fillRect(px, py, pw, ph);

  // Crowd silhouettes (deterministic)
  ctx.fillStyle = 'rgba(4,2,12,0.90)';
  for (let ci = 0; ci * 16 < pw + 16; ci++) {
    const cx  = px + ci * 16;
    const hgt = ph * (0.16 + CROWD_SEED[ci % CROWD_SEED.length] * 0.10);
    ctx.fillRect(cx, py + ph - hgt, 14, hgt);
    ctx.beginPath();
    ctx.arc(cx + 7, py + ph - hgt - 7, 5 + CROWD_SEED[(ci + 5) % CROWD_SEED.length] * 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Full single-pass polaroid render (for designer preview) ──────────────────
export interface RenderOptions {
  design:       PolaroidDesign;
  eventName?:   string;
  logoImg?:     HTMLImageElement | null;
  photoEl?:     HTMLVideoElement | HTMLImageElement | null;
  sampleDate?:  Date;
  accentColor?: string;   // used by label style patterns
}

export async function renderPolaroid(
  canvas: HTMLCanvasElement,
  {
    design,
    eventName,
    logoImg      = null,
    photoEl      = null,
    sampleDate   = new Date(),
    accentColor  = '#1E8BFF',
  }: RenderOptions,
): Promise<void> {
  const W   = FRAME_SIZE;
  const H   = FRAME_SIZE + POLAROID_BTM;
  const pad = PAD;
  const img = W - pad * 2; // 560

  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── Polaroid background ───────────────────────────────────────────
  ctx.fillStyle = design.frameColor;
  ctx.fillRect(0, 0, W, H);

  // ── Photo area ────────────────────────────────────────────────────
  if (photoEl) {
    const vw = (photoEl instanceof HTMLVideoElement ? photoEl.videoWidth  : photoEl.naturalWidth)  || 640;
    const vh = (photoEl instanceof HTMLVideoElement ? photoEl.videoHeight : photoEl.naturalHeight) || 480;
    let sx = 0, sy = 0, sw = vw, sh = vh;
    if (vw / vh > 1) { sw = vh; sx = (vw - sw) / 2; }
    else             { sh = vw; sy = (vh - sh) / 2; }
    ctx.drawImage(photoEl, sx, sy, sw, sh, pad, pad, img, img);
  } else {
    drawPlaceholderPhoto(ctx, pad, pad, img, img);
  }

  // ── Film filter ───────────────────────────────────────────────────
  applyPolaroidFilter(ctx, pad, pad, img, img, design.filterStrength);

  // ── Event name watermark (centered on photo, away from date stamp) ──
  if (design.watermark && eventName) {
    ctx.save();
    const wm     = eventName.toUpperCase();
    const wmSize = wm.length > 16 ? 28 : wm.length > 10 ? 34 : 40;
    ctx.font        = `900 ${wmSize}px Inter, ui-sans-serif, sans-serif`;
    ctx.textAlign   = 'center';
    ctx.globalAlpha = design.watermarkOpacity / 100;
    ctx.fillStyle   = design.watermarkColor;
    // Vertical center of the photo — stays clear of the bottom date stamp
    ctx.fillText(wm, W / 2, pad + Math.round(img * 0.52), img - 40);
    ctx.restore();
  }

  // ── Date/time stamp ───────────────────────────────────────────────
  if (design.dateStamp) {
    const dd  = String(sampleDate.getDate()).padStart(2, '0');
    const mm  = String(sampleDate.getMonth() + 1).padStart(2, '0');
    const yy  = String(sampleDate.getFullYear()).slice(2);
    const hh  = String(sampleDate.getHours()).padStart(2, '0');
    const min = String(sampleDate.getMinutes()).padStart(2, '0');
    const x   = design.dateStampPosition === 'right' ? pad + img - 10 : pad + 10;

    ctx.save();
    ctx.textAlign   = design.dateStampPosition === 'right' ? 'right' : 'left';
    ctx.font        = 'bold 17px "Courier New", monospace';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur  = 6;
    ctx.fillStyle   = design.dateStampColor;
    ctx.fillText(`${dd} ${mm} '${yy}`, x, pad + img - 22);
    ctx.fillText(`${hh}:${min}`,       x, pad + img - 5);
    ctx.restore();
  }

  // ── Label background ──────────────────────────────────────────────
  ctx.fillStyle = design.labelBg;
  ctx.fillRect(0, FRAME_SIZE, W, POLAROID_BTM);

  // ── Label style decoration ────────────────────────────────────────
  applyLabelStyle(ctx, design.labelStyle, accentColor, W);

  // ── Label content — logo or event name ───────────────────────────
  const hasTagline    = design.labelTagline.trim().length > 0;
  const contentBottom = FRAME_SIZE + POLAROID_BTM - (hasTagline ? 22 : 10);
  const usableH       = contentBottom - FRAME_SIZE;
  const labelMidY     = FRAME_SIZE + usableH / 2;

  if (logoImg && design.logoPosition !== 'hidden') {
    if (design.logoPosition === 'center') {
      const maxW = 220, maxH = 64;
      const r  = Math.min(maxW / logoImg.naturalWidth, maxH / logoImg.naturalHeight, 1);
      const lw = logoImg.naturalWidth * r, lh = logoImg.naturalHeight * r;
      ctx.drawImage(logoImg, W / 2 - lw / 2, labelMidY - lh / 2, lw, lh);
    } else {
      const maxW = 160, maxH = 38;
      const r  = Math.min(maxW / logoImg.naturalWidth, maxH / logoImg.naturalHeight, 1);
      const lw = logoImg.naturalWidth * r, lh = logoImg.naturalHeight * r;
      ctx.globalAlpha = 0.65;
      ctx.drawImage(logoImg, W / 2 - lw / 2, contentBottom - lh - 4, lw, lh);
      ctx.globalAlpha = 1;
    }
  } else if (design.logoPosition !== 'hidden') {
    if (eventName) {
      ctx.font      = '700 22px Inter, ui-sans-serif, sans-serif';
      ctx.fillStyle = design.labelTextColor;
      ctx.textAlign = 'center';
      ctx.fillText(eventName, W / 2, labelMidY + 8, W - 60);
    } else {
      ctx.font      = '700 15px Inter, ui-sans-serif, sans-serif';
      ctx.fillStyle = '#8A94A6';
      ctx.textAlign = 'center';
      ctx.fillText('FestiDrop', W / 2, labelMidY + 6);
    }
  }

  // ── Tagline (persistent, bottom of label) ────────────────────────
  if (hasTagline) {
    ctx.font      = '600 10px Inter, ui-sans-serif, sans-serif';
    ctx.fillStyle = hexToRgba(design.labelTextColor, 0.38);
    ctx.textAlign = 'center';
    ctx.fillText(
      design.labelTagline.trim().toUpperCase(),
      W / 2,
      FRAME_SIZE + POLAROID_BTM - 10,
      W - 48,
    );
  }
}
