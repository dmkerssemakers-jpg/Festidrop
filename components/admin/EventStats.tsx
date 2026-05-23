'use client';
import { useState } from 'react';
import DashboardChart from './DashboardChart';
import type { DayData } from './DashboardChart';

type SerializedDrop = {
  id:      string;
  email:   string;
  sentAt:  string; // ISO
  eventId: string;
};

interface Props {
  drops:       SerializedDrop[];
  totalDrops:  number;
  accentColor?: string;
  chartData:   DayData[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at < 0) return email;
  const local  = email.slice(0, at);
  const domain = email.slice(at);
  return `${local.slice(0, Math.min(4, local.length))}***${domain}`;
}

function formatDropDate(iso: string): string {
  const date = new Date(iso);
  const now  = new Date();
  const mins = Math.floor((now.getTime() - date.getTime()) / 60_000);

  if (mins < 1)  return 'zojuist';
  if (mins < 60) return `${mins} min geleden`;

  const h = Math.floor(mins / 60);
  if (h < 6) return `${h}u geleden`;

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return `Vandaag ${date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Gisteren ${date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return `${date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}, ${date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

const PAGE = 15;

export default function EventStats({
  drops,
  totalDrops,
  accentColor = '#1E8BFF',
  chartData,
}: Props) {
  const [visible, setVisible] = useState(PAGE);

  const uniqueEmails = new Set(drops.map(d => d.email)).size;

  const now         = new Date();
  const startToday  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start7Days  = new Date(startToday);
  start7Days.setDate(startToday.getDate() - 7);

  const today    = drops.filter(d => new Date(d.sentAt) >= startToday).length;
  const lastWeek = drops.filter(d => new Date(d.sentAt) >= start7Days).length;

  const visibleDrops = drops.slice(0, visible);
  const hasMore      = visible < drops.length;

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.85)',
        border:     '1px solid rgba(189,239,255,0.55)',
        boxShadow:  '0 4px 16px rgba(7,22,47,0.06)',
      }}
    >
      <h2 className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-4">
        Statistieken
      </h2>

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Totaal drops" value={totalDrops} color={accentColor}
          icon={<path d="M3 8l4 4 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>}
        />
        <StatCard label="Unieke e-mails" value={uniqueEmails} color="#20D6E8"
          icon={
            <>
              <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </>
          }
        />
        <StatCard label="Vandaag" value={today} color="#00C896"
          icon={
            <>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </>
          }
        />
        <StatCard label="Afgelopen 7 dagen" value={lastWeek} color="#7B2FF7"
          icon={
            <>
              <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </>
          }
        />
      </div>

      {/* ── Activity chart ──────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-3">
          Activiteit — 7 dagen
        </p>
        <DashboardChart data={chartData} />
      </div>

      {/* ── Recent drops feed ───────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">
            Recente drops
          </p>
          {drops.length > 0 && (
            <span className="text-[10px] text-muted">
              {Math.min(visible, drops.length)} / {drops.length}
            </span>
          )}
        </div>

        {drops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(189,239,255,0.2)' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 4v5l3 3" stroke="#6C7A8D" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="9" cy="9" r="7" stroke="#6C7A8D" strokeWidth="1.5"/>
              </svg>
            </div>
            <p className="text-xs text-muted">Nog geen drops voor dit event</p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {visibleDrops.map(drop => {
                const hue = drop.email.charCodeAt(0) * 137 % 360;
                return (
                  <div
                    key={drop.id}
                    className="flex items-center gap-3 py-2 px-3 rounded-xl transition-colors hover:bg-white/60"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0"
                      style={{ background: `hsl(${hue},60%,55%)` }}
                    >
                      {drop.email[0].toUpperCase()}
                    </div>
                    <p className="text-xs text-navy font-medium truncate flex-1">
                      {maskEmail(drop.email)}
                    </p>
                    <p className="text-[10px] text-muted shrink-0 whitespace-nowrap">
                      {formatDropDate(drop.sentAt)}
                    </p>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <button
                onClick={() => setVisible(v => v + PAGE)}
                className="w-full mt-3 py-2 rounded-xl text-[11px] font-bold transition-all hover:opacity-80"
                style={{ background: 'rgba(189,239,255,0.2)', color: '#6C7A8D' }}
              >
                ↓ Meer laden ({drops.length - visible} resterend)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({
  label, value, color, icon,
}: {
  label: string;
  value: number;
  color: string;
  icon:  React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{ background: `${color}08`, border: `1px solid ${color}20` }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${color}18` }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color }}>
          {icon}
        </svg>
      </div>
      <div>
        <p className="text-[22px] font-black leading-none mb-0.5" style={{ color, letterSpacing: '-0.03em' }}>
          {value}
        </p>
        <p className="text-[10px] text-muted font-medium">{label}</p>
      </div>
    </div>
  );
}
