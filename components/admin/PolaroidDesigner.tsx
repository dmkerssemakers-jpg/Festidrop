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

export default function PolaroidDesigner({ eventId, eventName, accentColor, logoUrl, initialDesign }: Props) {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const logoImgRef    = useRef<HTMLImageElement | null>(null);
  const testImgRef    = useRef<HTMLImageElement | null>(null);

  const [design,       setDesign]       = useState<PolaroidDesign>(initialDesign);
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

  // Render whenever anything changes
  const doRender = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    await renderPolaroid(canvas, {
      design,
      eventName,
      logoImg:  logoImgRef.current,
      noteText: showNote ? previewNote : '',
      photoEl:  testImgRef.current,
    });
  }, [design, eventName, showNote, previewNote]);

  useEffect(() => { doRender(); }, [doRender, renderKey]);

  function update<K extends keyof PolaroidDesign>(key: K, value: PolaroidDesign[K]) {
    setDesign(d => ({ ...d, [key]: value }));
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

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 0px)' }}>

      {/* ── Sticky header ─────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-3.5 sticky top-0 z-20"
        style={{
          background:     'rgba(255,255,255,0.94)',
          borderBottom:   '1px solid rgba(189,239,255,0.6)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/events/${eventId}`}
            className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-navy transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Terug
          </Link>
          <div className="w-px h-4" style={{ background: 'rgba(0,0,0,0.10)' }} />
          <div>
            <span className="text-sm font-black text-navy" style={{ letterSpacing: '-0.02em' }}>
              Polaroid Designer
            </span>
            <span className="text-xs text-muted ml-2">— {eventName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveState === 'error' && (
            <span className="text-xs font-bold text-red-500">Fout bij opslaan</span>
          )}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{
              background:  saveState === 'saved'
                ? '#00C896'
                : `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
              boxShadow: `0 6px 20px ${accentColor}30`,
            }}
          >
            {isPending ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : saveState === 'saved' ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7l4 4 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 10.5h9M6.5 2v7M3.5 6l3 3 3-3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {saveState === 'saved' ? 'Opgeslagen!' : 'Opslaan'}
          </button>
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row flex-1 gap-0">

        {/* ── Controls (left) ─────────────────────────────────────── */}
        <div
          className="w-full lg:w-[360px] lg:shrink-0 p-5 space-y-3 lg:overflow-y-auto lg:sticky"
          style={{ top: '57px', maxHeight: 'calc(100vh - 57px)' }}
        >

          {/* Frame & Label */}
          <Section title="Frame & Label" icon={
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
              <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          }>
            <Row label="Frame kleur">
              <ColorPicker value={design.frameColor} onChange={v => update('frameColor', v)}
                presets={['#FEFDF8','#FFFFFF','#F5F0E8','#1A1A2E','#0D0D0D','#2C2C2C']} />
            </Row>
            <Row label="Label kleur">
              <ColorPicker value={design.labelBg} onChange={v => update('labelBg', v)}
                presets={['#FEFDF8','#FFFFFF','#F5F0E8','#1A1A2E','#0D0D0D','#2C2C2C']} />
            </Row>
            <Row label="Tekst kleur">
              <ColorPicker value={design.labelTextColor} onChange={v => update('labelTextColor', v)}
                presets={['#2C1810','#07162F','#FFFFFF','#F5F5F5','#8A94A6','#C0392B']} />
            </Row>
          </Section>

          {/* Film Filter */}
          <Section title="Film Filter" icon={
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M1 6h12M4 3V1M10 3V1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          }>
            <Row label={`Sterkte ${design.filterStrength}%`}>
              <input type="range" min={0} max={100} step={5}
                value={design.filterStrength}
                onChange={e => update('filterStrength', +e.target.value)}
                className="w-full h-1.5 rounded-full outline-none cursor-pointer"
                style={{ accentColor }}
              />
            </Row>
            <div className="flex gap-1.5 pt-1">
              {([['Uit', 0], ['Subtiel', 40], ['Medium', 70], ['Sterk', 100]] as [string, number][]).map(([label, val]) => (
                <button key={label} onClick={() => update('filterStrength', val)}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  style={design.filterStrength === val
                    ? { background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}40` }
                    : { background: 'rgba(0,0,0,0.04)', color: '#8A94A6', border: '1px solid transparent' }
                  }>
                  {label}
                </button>
              ))}
            </div>
          </Section>

          {/* Datum Stempel */}
          <Section title="Datum Stempel" icon={
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M1 6.5h12M4.5 1v3M9.5 1v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          }>
            <Row label="Tonen">
              <Toggle value={design.dateStamp} onChange={v => update('dateStamp', v)} accent={accentColor} />
            </Row>
            {design.dateStamp && (<>
              <Row label="Kleur">
                <ColorPicker value={design.dateStampColor} onChange={v => update('dateStampColor', v)}
                  presets={['#E8192C','#FFB800','#FFFFFF','#000000','#00C896','#1E8BFF']} />
              </Row>
              <Row label="Positie">
                <div className="flex gap-1.5">
                  {(['left','right'] as const).map(pos => (
                    <button key={pos} onClick={() => update('dateStampPosition', pos)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={design.dateStampPosition === pos
                        ? { background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}40` }
                        : { background: 'rgba(0,0,0,0.04)', color: '#8A94A6', border: '1px solid transparent' }
                      }>
                      {pos === 'left' ? '← Links' : 'Rechts →'}
                    </button>
                  ))}
                </div>
              </Row>
            </>)}
          </Section>

          {/* Event Watermark */}
          <Section title="Event Watermark" icon={
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 12L13 2M1 2l12 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.4"/>
              <text x="7" y="9" textAnchor="middle" fontSize="5" fontWeight="900" fill="currentColor">ABC</text>
            </svg>
          }>
            <p className="text-[11px] text-muted leading-relaxed -mt-1 mb-1">
              Jouw eventnaam als transparante overlay op de foto
            </p>
            <Row label="Tonen">
              <Toggle value={design.watermark} onChange={v => update('watermark', v)} accent={accentColor} />
            </Row>
            {design.watermark && (<>
              <Row label={`Opaciteit ${design.watermarkOpacity}%`}>
                <input type="range" min={5} max={50} step={5}
                  value={design.watermarkOpacity}
                  onChange={e => update('watermarkOpacity', +e.target.value)}
                  className="w-full h-1.5 rounded-full outline-none cursor-pointer"
                  style={{ accentColor }}
                />
              </Row>
              <Row label="Kleur">
                <div className="flex gap-1.5">
                  {([['Wit', '#FFFFFF'], ['Zwart', '#000000'], ['Accent', accentColor]] as [string,string][]).map(([lbl, col]) => (
                    <button key={lbl} onClick={() => update('watermarkColor', col)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                      style={design.watermarkColor === col
                        ? { background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}40` }
                        : { background: 'rgba(0,0,0,0.04)', color: '#8A94A6', border: '1px solid transparent' }
                      }>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: col, border: col === '#FFFFFF' ? '1px solid rgba(0,0,0,0.2)' : '1px solid rgba(0,0,0,0.1)' }} />
                      {lbl}
                    </button>
                  ))}
                </div>
              </Row>
            </>)}
          </Section>

          {/* Logo in Label */}
          <Section title="Logo in Label" icon={
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M1 11h12M4 13h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          }>
            <p className="text-[11px] text-muted leading-relaxed -mt-1 mb-2">
              Hoe het logo/naam verschijnt onderaan de polaroid
            </p>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['center', 'Centrum', '⊞'],
                ['bottom', 'Onderaan', '⊟'],
                ['hidden', 'Verborgen', '⊘'],
              ] as [PolaroidDesign['logoPosition'], string, string][]).map(([val, lbl, ico]) => (
                <button key={val} onClick={() => update('logoPosition', val)}
                  className="py-3 rounded-xl flex flex-col items-center gap-1.5 text-[10px] font-bold transition-all"
                  style={design.logoPosition === val
                    ? { background: `${accentColor}12`, color: accentColor, border: `1.5px solid ${accentColor}45` }
                    : { background: 'rgba(0,0,0,0.04)', color: '#8A94A6', border: '1.5px solid transparent' }
                  }>
                  <span className="text-base leading-none">{ico}</span>
                  {lbl}
                </button>
              ))}
            </div>
          </Section>

          {/* Reset */}
          <button
            onClick={() => setDesign({ ...DEFAULT_DESIGN })}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-muted hover:text-navy transition-colors"
            style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}
          >
            ↩ Reset naar standaard
          </button>
        </div>

        {/* ── Preview (right) ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-start p-6 lg:p-10 gap-5"
          style={{ background: 'rgba(240,245,255,0.6)' }}>

          {/* Canvas card */}
          <div
            className="rounded-2xl p-5 w-full max-w-[360px]"
            style={{
              background:  'rgba(255,255,255,0.88)',
              border:      '1px solid rgba(189,239,255,0.6)',
              boxShadow:   '0 4px 24px rgba(7,22,47,0.06)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-muted">Live preview</span>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: accentColor }} />
            </div>

            {/* The canvas — 600×750 drawn, displayed at 310px wide */}
            <div className="mx-auto overflow-hidden rounded-xl"
              style={{ width: 310, boxShadow: '0 16px 48px rgba(7,22,47,0.20), 0 4px 12px rgba(7,22,47,0.08)' }}>
              <canvas ref={canvasRef} width={600} height={750}
                style={{ display: 'block', width: 310, height: 387.5 }} />
            </div>
          </div>

          {/* Preview mode */}
          <div className="rounded-2xl p-4 w-full max-w-[360px]"
            style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(189,239,255,0.6)' }}>
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted mb-3">Preview modus</p>
            <div className="flex gap-2 mb-3">
              {[['Zonder tekst', false], ['Met herinnering', true]].map(([lbl, val]) => (
                <button key={String(val)} onClick={() => setShowNote(val as boolean)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                  style={showNote === val
                    ? { background: `${accentColor}12`, color: accentColor, border: `1px solid ${accentColor}35` }
                    : { background: 'rgba(0,0,0,0.04)', color: '#8A94A6', border: '1px solid transparent' }
                  }>
                  {lbl as string}
                </button>
              ))}
            </div>
            {showNote && (
              <input type="text" value={previewNote}
                onChange={e => setPreviewNote(e.target.value.slice(0, 40))}
                placeholder="Best night ever ♥"
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{
                  background:  'rgba(0,0,0,0.04)',
                  border:      '1px solid rgba(0,0,0,0.09)',
                  fontSize:    '22px',
                  fontFamily:  'var(--font-caveat), Caveat, cursive',
                  color:       '#07162F',
                }}
              />
            )}
          </div>

          {/* Test photo */}
          <div className="rounded-2xl p-4 w-full max-w-[360px]"
            style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(189,239,255,0.6)' }}>
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted mb-3">Test foto</p>
            <label className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.04)', border: '1px dashed rgba(0,0,0,0.14)', color: '#8A94A6' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="7" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4.5 3V2a1 1 0 011-1h3a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Upload eigen foto
              <input type="file" accept="image/*" className="hidden" onChange={handleTestPhoto} />
            </label>
            {hasTestPhoto && (
              <button onClick={() => { testImgRef.current = null; setHasTestPhoto(false); setRenderKey(k => k + 1); }}
                className="w-full mt-2 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                style={{ background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.15)', color: 'rgba(200,60,60,0.8)' }}>
                × Verwijder test foto
              </button>
            )}
            <p className="text-[10px] text-muted mt-2 leading-relaxed">
              Standaard ziet u een festivalgradient als voorbeeld foto
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ title, icon, children }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-4"
      style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(189,239,255,0.55)', boxShadow: '0 1px 6px rgba(7,22,47,0.03)' }}>
      <div className="flex items-center gap-2 mb-4 text-navy">
        {icon}
        <span className="text-xs font-black uppercase tracking-[0.1em]">{title}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-muted shrink-0 w-24">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange, accent }: { value: boolean; onChange: (v: boolean) => void; accent: string }) {
  return (
    <button onClick={() => onChange(!value)} aria-pressed={value}
      className="relative w-10 h-6 rounded-full transition-colors"
      style={{ background: value ? accent : 'rgba(0,0,0,0.14)' }}>
      <div
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
        style={{ left: value ? '22px' : '4px' }}
      />
    </button>
  );
}

function ColorPicker({ value, onChange, presets }: {
  value: string;
  onChange: (v: string) => void;
  presets: string[];
}) {
  return (
    <div className="flex items-center gap-1.5 justify-end flex-wrap">
      {presets.map(color => (
        <button key={color} onClick={() => onChange(color)}
          title={color}
          className="w-5 h-5 rounded-full transition-all hover:scale-110 shrink-0"
          style={{
            background:  color,
            border:      value === color ? '2px solid #1E8BFF' : '1.5px solid rgba(0,0,0,0.13)',
            outline:     value === color ? '2px solid rgba(30,139,255,0.25)' : 'none',
            outlineOffset: '1px',
            boxShadow:   (color === '#FFFFFF' || color === '#FEFDF8' || color === '#F5F0E8')
              ? 'inset 0 0 0 1px rgba(0,0,0,0.09)'
              : undefined,
          }}
        />
      ))}
      {/* Custom colour picker */}
      <label title="Aangepaste kleur"
        className="relative w-6 h-6 rounded-lg overflow-hidden cursor-pointer hover:scale-110 transition-all shrink-0"
        style={{
          background:   'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
          border:       '1.5px solid rgba(0,0,0,0.13)',
          borderRadius: '6px',
        }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
      </label>
    </div>
  );
}
