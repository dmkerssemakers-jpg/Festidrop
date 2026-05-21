'use client';
import { useRef, useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { renderPolaroid } from '@/lib/polaroid-renderer';
import { DEFAULT_DESIGN } from '@/lib/polaroid-design';
import type { PolaroidDesign } from '@/lib/polaroid-design';
import { saveEventDesign } from '@/lib/actions';

interface Props {
  eventId:       string;
  eventName:     string;
  accentColor:   string;
  logoUrl?:      string | null;
  initialDesign: PolaroidDesign;
}

// ── Canvas dimensions ─────────────────────────────────────────────────────────
const CANVAS_W  = 600;
const CANVAS_H  = 750;
const DISPLAY_W = 396;

// ── Design themes ─────────────────────────────────────────────────────────────
interface Theme {
  id:   string;
  name: string;
  /** Partial design — labelTagline is always preserved from current state */
  design: Omit<PolaroidDesign, 'labelTagline'>;
  /** Visual preview colours for the CSS thumbnail */
  preview: { frame: string; photoA: string; photoB: string; label: string; accent: string };
}

const THEMES: Theme[] = [
  {
    id: 'kodak',
    name: 'Kodak',
    design: {
      frameColor: '#FEFDF8', labelBg: '#FEFDF8', labelTextColor: '#2C1810',
      labelStyle: 'solid', noteFont: 'caveat',
      dateStamp: true, dateStampColor: '#E8192C', dateStampPosition: 'left',
      watermark: true, watermarkOpacity: 20, watermarkColor: '#FFFFFF',
      filterStrength: 85, logoPosition: 'center',
    },
    preview: { frame: '#FEFDF8', photoA: '#D4654A', photoB: '#8B3A62', label: '#FEFDF8', accent: '#E8192C' },
  },
  {
    id: 'dark',
    name: 'Dark',
    design: {
      frameColor: '#111111', labelBg: '#1A1A2E', labelTextColor: '#EEEEEE',
      labelStyle: 'accent-line', noteFont: 'uppercase',
      dateStamp: true, dateStampColor: '#FF3A5C', dateStampPosition: 'right',
      watermark: true, watermarkOpacity: 15, watermarkColor: '#FFFFFF',
      filterStrength: 50, logoPosition: 'center',
    },
    preview: { frame: '#111111', photoA: '#1A0030', photoB: '#300060', label: '#1A1A2E', accent: '#FF3A5C' },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    design: {
      frameColor: '#FFFFFF', labelBg: '#FFFFFF', labelTextColor: '#07162F',
      labelStyle: 'solid', noteFont: 'uppercase',
      dateStamp: false, dateStampColor: '#07162F', dateStampPosition: 'left',
      watermark: false, watermarkOpacity: 10, watermarkColor: '#000000',
      filterStrength: 0, logoPosition: 'center',
    },
    preview: { frame: '#FFFFFF', photoA: '#7EB5E5', photoB: '#2C5F8A', label: '#FFFFFF', accent: '#07162F' },
  },
  {
    id: 'film',
    name: 'Warm Film',
    design: {
      frameColor: '#F5F0E8', labelBg: '#F5F0E8', labelTextColor: '#3D2B1F',
      labelStyle: 'grain', noteFont: 'caveat',
      dateStamp: true, dateStampColor: '#C07030', dateStampPosition: 'left',
      watermark: false, watermarkOpacity: 15, watermarkColor: '#FFFFFF',
      filterStrength: 100, logoPosition: 'bottom',
    },
    preview: { frame: '#F5F0E8', photoA: '#D4A862', photoB: '#8B4513', label: '#F5F0E8', accent: '#C07030' },
  },
  {
    id: 'neon',
    name: 'Neon',
    design: {
      frameColor: '#0A0A0A', labelBg: '#111111', labelTextColor: '#FFFFFF',
      labelStyle: 'gradient', noteFont: 'uppercase',
      dateStamp: true, dateStampColor: '#00FFC8', dateStampPosition: 'right',
      watermark: true, watermarkOpacity: 10, watermarkColor: '#00FFC8',
      filterStrength: 30, logoPosition: 'center',
    },
    preview: { frame: '#0A0A0A', photoA: '#001420', photoB: '#002A50', label: '#111111', accent: '#00FFC8' },
  },
  {
    id: 'retro',
    name: 'Retro',
    design: {
      frameColor: '#F5F0E8', labelBg: '#E8E0D0', labelTextColor: '#4A3728',
      labelStyle: 'duotone', noteFont: 'caveat',
      dateStamp: true, dateStampColor: '#8B4513', dateStampPosition: 'left',
      watermark: true, watermarkOpacity: 25, watermarkColor: '#FFFFFF',
      filterStrength: 70, logoPosition: 'bottom',
    },
    preview: { frame: '#F5F0E8', photoA: '#C8A060', photoB: '#704020', label: '#E8E0D0', accent: '#8B4513' },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getLuma(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function brandify(d: PolaroidDesign, accent: string): PolaroidDesign {
  const isDark      = getLuma(d.frameColor) < 0.25;
  const accentLight = getLuma(accent) > 0.65;
  return {
    ...d,
    dateStamp:      true,
    dateStampColor: accent,
    labelStyle:     isDark ? 'accent-line' : (accentLight ? 'dots' : 'accent-line'),
    watermark:      true,
    watermarkColor: isDark ? accent : '#FFFFFF',
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PolaroidDesigner({
  eventId, eventName, accentColor, logoUrl, initialDesign,
}: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const logoImgRef  = useRef<HTMLImageElement | null>(null);
  const testImgRef  = useRef<HTMLImageElement | null>(null);

  const [design,       setDesign]       = useState<PolaroidDesign>(initialDesign);
  const [activeTheme,  setActiveTheme]  = useState<string | null>(null);
  const [previewNote,  setPreviewNote]  = useState('Best night ever ♥');
  const [showNote,     setShowNote]     = useState(false);
  const [hasTestPhoto, setHasTestPhoto] = useState(false);
  const [renderKey,    setRenderKey]    = useState(0);
  const [isPending,    startTransition] = useTransition();
  const [saveState,    setSaveState]    = useState<'idle' | 'saved' | 'error'>('idle');

  // Load logo
  useEffect(() => {
    if (!logoUrl) { logoImgRef.current = null; return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => { logoImgRef.current = img; setRenderKey(k => k + 1); };
    img.onerror = () => { logoImgRef.current = null; };
    img.src = logoUrl;
  }, [logoUrl]);

  // Re-render on every design change
  const doRender = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    await renderPolaroid(canvas, {
      design, eventName,
      logoImg:  logoImgRef.current,
      noteText: showNote ? previewNote : '',
      photoEl:  testImgRef.current,
      accentColor,
    });
  }, [design, eventName, showNote, previewNote, accentColor]);

  useEffect(() => { doRender(); }, [doRender, renderKey]);

  function set<K extends keyof PolaroidDesign>(key: K, val: PolaroidDesign[K]) {
    setDesign(d => ({ ...d, [key]: val }));
  }

  function applyTheme(theme: Theme) {
    setDesign(d => ({ ...DEFAULT_DESIGN, ...theme.design, labelTagline: d.labelTagline }));
    setActiveTheme(theme.id);
  }

  function applyBranding() {
    setDesign(d => brandify(d, accentColor));
  }

  function handleTestPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => { testImgRef.current = img; setHasTestPhoto(true); setRenderKey(k => k + 1); };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `${eventName.toLowerCase().replace(/\s+/g, '-')}-polaroid.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  function handleSave() {
    setSaveState('idle');
    startTransition(async () => {
      try {
        await saveEventDesign(eventId, design);
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 3000);
      } catch {
        setSaveState('error');
        setTimeout(() => setSaveState('idle'), 3000);
      }
    });
  }

  const displayH = Math.round(DISPLAY_W * (CANVAS_H / CANVAS_W));

  return (
    <div className="flex flex-col" style={{ height: '100dvh', minHeight: '100vh', overflow: 'hidden' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-5 shrink-0"
        style={{
          height: '52px',
          background: 'rgba(255,255,255,0.96)',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          backdropFilter: 'blur(12px)',
          zIndex: 30,
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/events/${eventId}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-muted hover:text-navy hover:bg-black/5 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 10L4 6l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Terug
          </Link>
          <div className="w-px h-4" style={{ background: 'rgba(0,0,0,0.09)' }} />
          <span className="text-sm font-black text-navy" style={{ letterSpacing: '-0.02em' }}>
            Polaroid Designer
          </span>
          <span className="hidden sm:inline text-xs text-muted">— {eventName}</span>
        </div>

        <div className="flex items-center gap-2.5">
          {saveState === 'error' && (
            <span className="text-xs font-semibold text-red-500">Opslaan mislukt</span>
          )}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80"
            style={{ background: 'rgba(0,0,0,0.06)', color: '#6C7A8D', border: '1px solid rgba(0,0,0,0.08)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 9.5h8M6 2v6M3.5 5.5L6 8l2.5-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{
              background: saveState === 'saved'
                ? '#00C896'
                : `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
              boxShadow: `0 4px 14px ${accentColor}30`,
            }}
          >
            {isPending ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : saveState === 'saved' ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3.5 3.5 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 9.5h8M6 2v6M3.5 5.5L6 8l2.5-2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {saveState === 'saved' ? 'Opgeslagen!' : 'Opslaan'}
          </button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Controls panel ──────────────────────────────────────── */}
        <aside
          className="shrink-0 overflow-y-auto"
          style={{ width: '316px', background: '#F4F6FA', borderRight: '1px solid rgba(0,0,0,0.07)' }}
        >
          <div className="p-4 space-y-2.5">

            {/* ── 1. THEMES ────────────────────────────────────────── */}
            <div
              className="rounded-xl p-3.5"
              style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted mb-3">
                Stijl kiezen
              </p>

              {/* Theme grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {THEMES.map(t => (
                  <ThemeCard
                    key={t.id}
                    theme={t}
                    active={activeTheme === t.id}
                    accent={accentColor}
                    onClick={() => applyTheme(t)}
                  />
                ))}
              </div>

              {/* Branded maken */}
              <button
                onClick={applyBranding}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}30)`,
                  border:     `1.5px solid ${accentColor}40`,
                  color:      accentColor,
                }}
              >
                {/* Brand swatch */}
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: accentColor, boxShadow: `0 0 0 2px ${accentColor}30` }}
                />
                Branded maken
                <span className="opacity-60 font-medium text-[10px] normal-case">
                  past merkkleur toe
                </span>
              </button>

              {/* Reset */}
              <button
                onClick={() => { setDesign({ ...DEFAULT_DESIGN }); setActiveTheme(null); }}
                className="w-full mt-1.5 py-1.5 rounded-lg text-[10px] font-bold text-muted hover:text-navy transition-colors text-center"
                style={{ background: 'rgba(0,0,0,0.04)' }}
              >
                ↩ Reset naar standaard
              </button>
            </div>

            {/* Divider label */}
            <div className="flex items-center gap-2 px-1">
              <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-muted">Handmatig aanpassen</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
            </div>

            {/* ── 2. FRAME & LABEL ─────────────────────────────────── */}
            <Card title="Frame & Label">
              <Row label="Frame">
                <Swatches value={design.frameColor} onChange={v => set('frameColor', v)}
                  presets={['#FEFDF8','#FFFFFF','#F5F0E8','#1A1A2E','#111111','#2C2C2C']} />
              </Row>
              <Row label="Label">
                <Swatches value={design.labelBg} onChange={v => set('labelBg', v)}
                  presets={['#FEFDF8','#FFFFFF','#F5F0E8','#1A1A2E','#111111','#2C2C2C']} />
              </Row>
              <Row label="Tekst">
                <Swatches value={design.labelTextColor} onChange={v => set('labelTextColor', v)}
                  presets={['#2C1810','#07162F','#FFFFFF','#EEEEEE','#8A94A6','#C0392B']} />
              </Row>
            </Card>

            {/* ── 3. FILM FILTER ───────────────────────────────────── */}
            <Card title="Film Filter">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-muted w-16 shrink-0">{design.filterStrength}%</span>
                <input type="range" min={0} max={100} step={5}
                  value={design.filterStrength}
                  onChange={e => set('filterStrength', +e.target.value)}
                  className="flex-1 h-1.5 rounded-full outline-none cursor-pointer"
                  style={{ accentColor }}
                />
              </div>
              <div className="grid grid-cols-4 gap-1">
                {([['Uit', 0], ['Subtiel', 40], ['Medium', 70], ['Sterk', 100]] as [string,number][]).map(([lbl, v]) => (
                  <button key={lbl} onClick={() => set('filterStrength', v)}
                    className="py-1.5 rounded-lg text-[10px] font-bold transition-all"
                    style={design.filterStrength === v
                      ? { background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}35` }
                      : { background: 'rgba(0,0,0,0.06)', color: '#8A94A6', border: '1px solid transparent' }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </Card>

            {/* ── 4. DATUM STEMPEL ─────────────────────────────────── */}
            <Card title="Datum Stempel">
              <Row label="Tonen">
                <Toggle value={design.dateStamp} onChange={v => set('dateStamp', v)} accent={accentColor} />
              </Row>
              {design.dateStamp && (<>
                <Row label="Kleur">
                  <Swatches value={design.dateStampColor} onChange={v => set('dateStampColor', v)}
                    presets={['#E8192C','#FFB800','#FFFFFF','#000000','#00C896','#1E8BFF']} />
                </Row>
                <Row label="Positie">
                  <div className="flex gap-1">
                    {(['left','right'] as const).map(p => (
                      <button key={p} onClick={() => set('dateStampPosition', p)}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                        style={design.dateStampPosition === p
                          ? { background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}35` }
                          : { background: 'rgba(0,0,0,0.06)', color: '#8A94A6', border: '1px solid transparent' }}>
                        {p === 'left' ? '← Links' : 'Rechts →'}
                      </button>
                    ))}
                  </div>
                </Row>
              </>)}
            </Card>

            {/* ── 5. WATERMARK ─────────────────────────────────────── */}
            <Card title="Event Watermark">
              <p className="text-[11px] text-muted -mt-1 mb-2 leading-snug">
                Eventnaam transparant over het midden van de foto
              </p>
              <Row label="Tonen">
                <Toggle value={design.watermark} onChange={v => set('watermark', v)} accent={accentColor} />
              </Row>
              {design.watermark && (<>
                <Row label={`Opaciteit ${design.watermarkOpacity}%`}>
                  <input type="range" min={5} max={50} step={5}
                    value={design.watermarkOpacity}
                    onChange={e => set('watermarkOpacity', +e.target.value)}
                    className="w-full h-1.5 rounded-full outline-none cursor-pointer"
                    style={{ accentColor }}
                  />
                </Row>
                <Row label="Kleur">
                  <div className="flex gap-1">
                    {([['Wit','#FFFFFF'],['Zwart','#000000'],['Accent',accentColor]] as [string,string][]).map(([lbl,col]) => (
                      <button key={lbl} onClick={() => set('watermarkColor', col)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                        style={design.watermarkColor === col
                          ? { background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}35` }
                          : { background: 'rgba(0,0,0,0.06)', color: '#8A94A6', border: '1px solid transparent' }}>
                        <span className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: col, border: col === '#FFFFFF' ? '1px solid rgba(0,0,0,0.2)' : '1px solid transparent' }} />
                        {lbl}
                      </button>
                    ))}
                  </div>
                </Row>
              </>)}
            </Card>

            {/* ── 6. LABEL DESIGN ──────────────────────────────────── */}
            <Card title="Label Design">
              <p className="text-[11px] text-muted -mt-1 mb-3 leading-snug">
                Visuele stijl — past zich aan jouw merkkleur aan
              </p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ['solid',       'Puur',       null],
                  ['accent-line', 'Accentlijn', 'line'],
                  ['gradient',    'Verloop',    'gradient'],
                  ['duotone',     'Diagonaal',  'duotone'],
                  ['dots',        'Stippen',    'dots'],
                  ['grain',       'Korrel',     'grain'],
                ] as [PolaroidDesign['labelStyle'], string, string | null][]).map(([val, lbl, pat]) => (
                  <button key={val} onClick={() => set('labelStyle', val)}
                    className="rounded-xl overflow-hidden transition-all"
                    style={{
                      border:       design.labelStyle === val ? `2px solid ${accentColor}` : '2px solid rgba(0,0,0,0.08)',
                      outline:      design.labelStyle === val ? `2px solid ${accentColor}30` : 'none',
                      outlineOffset: '1px',
                    }}>
                    <div style={{ height: '34px', background: design.labelBg, position: 'relative', overflow: 'hidden' }}>
                      {pat === 'line'     && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: accentColor }} />}
                      {pat === 'gradient' && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${accentColor}44 0%, transparent 100%)` }} />}
                      {pat === 'duotone'  && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${accentColor}44 0%, transparent 60%)` }} />}
                      {pat === 'dots'     && <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, ${accentColor}44 1px, transparent 1px)`, backgroundSize: '7px 7px' }} />}
                      {pat === 'grain'    && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.08\'/%3E%3C/svg%3E")' }} />}
                    </div>
                    <div className="py-1 text-[10px] font-bold text-center"
                      style={{ color: design.labelStyle === val ? accentColor : '#8A94A6', background: 'rgba(0,0,0,0.03)' }}>
                      {lbl}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* ── 7. LOGO POSITIE ──────────────────────────────────── */}
            <Card title="Logo in Label">
              <p className="text-[11px] text-muted -mt-1 mb-2 leading-snug">
                Logo/naam weergave (zichtbaar zonder herinnering)
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  ['center', 'Centrum',  '⊞'],
                  ['bottom', 'Onderaan', '⊟'],
                  ['hidden', 'Verborgen','⊘'],
                ] as [PolaroidDesign['logoPosition'], string, string][]).map(([val, lbl, ico]) => (
                  <button key={val} onClick={() => set('logoPosition', val)}
                    className="py-3 rounded-xl flex flex-col items-center gap-1 text-[10px] font-bold transition-all"
                    style={design.logoPosition === val
                      ? { background: `${accentColor}12`, color: accentColor, border: `1.5px solid ${accentColor}40` }
                      : { background: 'rgba(0,0,0,0.06)', color: '#8A94A6', border: '1.5px solid transparent' }}>
                    <span className="text-[15px] leading-none">{ico}</span>
                    {lbl}
                  </button>
                ))}
              </div>
            </Card>

            {/* ── 8. TAGLINE ───────────────────────────────────────── */}
            <Card title="Label Tagline">
              <p className="text-[11px] text-muted -mt-1 mb-2 leading-snug">
                Vaste tekst onderaan — bijv. eventnaam, datum of #hashtag
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={design.labelTagline}
                  onChange={e => set('labelTagline', e.target.value.slice(0, 40))}
                  placeholder="BONDGENOTEN FESTIVAL 2025"
                  maxLength={40}
                  className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                  style={{
                    background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.09)',
                    color: '#07162F', paddingRight: '36px',
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold tabular-nums"
                  style={{ color: design.labelTagline.length > 34 ? '#FF6B35' : 'rgba(0,0,0,0.25)' }}>
                  {design.labelTagline.length}/40
                </span>
              </div>
              {design.labelTagline && (
                <button onClick={() => set('labelTagline', '')}
                  className="mt-1.5 text-[10px] font-bold text-muted hover:text-navy transition-colors">
                  × Verwijder tagline
                </button>
              )}
            </Card>

            {/* ── 9. LETTERTYPE ────────────────────────────────────── */}
            <Card title="Herinnering Lettertype">
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['caveat',    'Handschrift', 'Best night ever ♥', 'var(--font-caveat), Caveat, cursive', '18px'],
                  ['uppercase', 'Strak',       'BEST NIGHT EVER',  'Inter, sans-serif',                  '10px'],
                ] as [PolaroidDesign['noteFont'], string, string, string, string][]).map(([val, lbl, preview, font, size]) => (
                  <button key={val} onClick={() => set('noteFont', val)}
                    className="rounded-xl p-2.5 flex flex-col items-center gap-1.5 transition-all"
                    style={design.noteFont === val
                      ? { background: `${accentColor}12`, border: `1.5px solid ${accentColor}45` }
                      : { background: 'rgba(0,0,0,0.05)', border: '1.5px solid transparent' }}>
                    <span style={{ fontFamily: font, fontSize: size, fontWeight: val === 'uppercase' ? 900 : 700, color: '#2C1810', lineHeight: 1.2 }}>
                      {preview}
                    </span>
                    <span className="text-[10px] font-bold"
                      style={{ color: design.noteFont === val ? accentColor : '#8A94A6' }}>
                      {lbl}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

          </div>
        </aside>

        {/* ── Preview panel ────────────────────────────────────────── */}
        <main
          className="flex-1 flex flex-col items-center justify-center overflow-hidden relative"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, #1a2540 0%, #0a0f1e 100%)' }}
        >
          {/* Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />

          {/* Canvas */}
          <div className="relative z-10" style={{ filter: 'drop-shadow(0 32px 64px rgba(0,0,0,0.70)) drop-shadow(0 8px 24px rgba(0,0,0,0.50))' }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{ display: 'block', width: DISPLAY_W, height: displayH, borderRadius: '2px' }}
            />
          </div>

          {/* Preview controls */}
          <div className="relative z-10 mt-6 flex items-center gap-3 flex-wrap justify-center px-4">
            <div className="flex rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.06)' }}>
              {[['Zonder tekst', false], ['Met herinnering', true]].map(([lbl, val]) => (
                <button key={String(val)} onClick={() => setShowNote(val as boolean)}
                  className="px-3.5 py-1.5 text-xs font-bold transition-all"
                  style={showNote === val ? { background: accentColor, color: '#fff' } : { color: 'rgba(255,255,255,0.45)' }}>
                  {lbl as string}
                </button>
              ))}
            </div>

            {showNote && (
              <input type="text" value={previewNote}
                onChange={e => setPreviewNote(e.target.value.slice(0, 40))}
                placeholder="Best night ever ♥"
                className="px-4 py-1.5 rounded-xl outline-none text-white placeholder-white/30"
                style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
                  fontFamily: 'var(--font-caveat), Caveat, cursive', fontSize: '20px', width: '220px',
                }}
              />
            )}

            <label
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.55)' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="2.5" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="6" cy="6.25" r="1.6" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4 2.5V2a1 1 0 011-1h2a1 1 0 011 1v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {hasTestPhoto ? 'Andere foto' : 'Test foto'}
              <input type="file" accept="image/*" className="hidden" onChange={handleTestPhoto} />
            </label>

            {hasTestPhoto && (
              <button
                onClick={() => { testImgRef.current = null; setHasTestPhoto(false); setRenderKey(k => k + 1); }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.20)', color: 'rgba(255,140,140,0.9)' }}>
                × Verwijder
              </button>
            )}
          </div>

          <p className="relative z-10 mt-4 text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.18)' }}>
            Exact hetzelfde als de echte polaroid
          </p>
        </main>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ThemeCard({ theme, active, accent, onClick }: {
  theme: Theme; active: boolean; accent: string; onClick: () => void;
}) {
  const { preview: p } = theme;
  const isLightFrame = getLuma(p.frame) > 0.5;

  return (
    <button
      onClick={onClick}
      className="rounded-xl overflow-hidden transition-all hover:scale-[1.03] active:scale-[0.97]"
      style={{
        border:        active ? `2px solid ${accent}` : '2px solid rgba(0,0,0,0.07)',
        outline:       active ? `2px solid ${accent}28` : 'none',
        outlineOffset: '1px',
        background:    p.frame,
      }}
    >
      {/* Mini polaroid body */}
      <div style={{ padding: '5px 5px 0 5px' }}>
        {/* Photo area */}
        <div style={{
          height: 56,
          borderRadius: '2px',
          background: `linear-gradient(145deg, ${p.photoA}, ${p.photoB})`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Vignette hint */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.35) 100%)' }} />
        </div>
        {/* Label bar */}
        <div style={{
          height: 18,
          background: p.label,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 4,
        }}>
          {/* Accent hint line at top */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: p.accent, opacity: 0.7 }} />
          {/* Stamp dot */}
          <div style={{ width: 12, height: 5, borderRadius: 1, background: p.accent, opacity: 0.8 }} />
        </div>
      </div>

      {/* Name label */}
      <div
        className="text-[9px] font-black text-center py-1.5 leading-none"
        style={{
          color:      active ? accent : (isLightFrame ? '#8A94A6' : 'rgba(255,255,255,0.45)'),
          background: active ? `${accent}10` : 'transparent',
        }}
      >
        {theme.name}
      </div>
    </button>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-3.5"
      style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted mb-3">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 min-h-[26px]">
      <span className="text-[11px] font-medium text-muted shrink-0" style={{ width: '58px' }}>{label}</span>
      <div className="flex-1 min-w-0 flex justify-end">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange, accent }: { value: boolean; onChange: (v: boolean) => void; accent: string }) {
  return (
    <button onClick={() => onChange(!value)} aria-pressed={value}
      className="relative w-9 h-5 rounded-full transition-colors shrink-0"
      style={{ background: value ? accent : 'rgba(0,0,0,0.16)' }}>
      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
        style={{ left: value ? '18px' : '2px' }} />
    </button>
  );
}

function Swatches({ value, onChange, presets }: {
  value: string; onChange: (v: string) => void; presets: string[];
}) {
  return (
    <div className="flex items-center gap-1">
      {presets.map(c => (
        <button key={c} onClick={() => onChange(c)} title={c}
          className="rounded-full transition-all hover:scale-110 shrink-0"
          style={{
            width:    value === c ? '20px' : '18px',
            height:   value === c ? '20px' : '18px',
            background: c,
            border:   value === c ? '2px solid #1E8BFF' : '1.5px solid rgba(0,0,0,0.14)',
            outline:  value === c ? '2px solid rgba(30,139,255,0.28)' : 'none',
            outlineOffset: '1px',
            boxShadow: (c === '#FFFFFF' || c === '#FEFDF8' || c === '#F5F0E8')
              ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : undefined,
          }}
        />
      ))}
      {/* Custom colour picker */}
      <label title="Eigen kleur"
        className="relative rounded-lg overflow-hidden cursor-pointer hover:scale-110 transition-all shrink-0"
        style={{ width: '22px', height: '22px', background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)', border: '1.5px solid rgba(0,0,0,0.14)' }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
      </label>
    </div>
  );
}
