'use client';
import { useState, useTransition } from 'react';
import { addWhitelist, addWhitelistBulk, removeWhitelist } from '@/lib/actions';
import type { Whitelist } from '@prisma/client';

interface Props {
  eventId:   string;
  whitelist: Whitelist[];
}

export default function WhitelistManager({ eventId, whitelist: initial }: Props) {
  const [email,      setEmail]      = useState('');
  const [bulkOpen,   setBulkOpen]   = useState(false);
  const [bulkText,   setBulkText]   = useState('');
  const [isPending,  startTransition] = useTransition();

  // ── Single add ────────────────────────────────────────────────────────────
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    startTransition(() => addWhitelist(eventId, email));
    setEmail('');
  };

  // ── Bulk add ──────────────────────────────────────────────────────────────
  const handleBulkAdd = () => {
    // Split on newlines, commas, semicolons and spaces
    const emails = bulkText
      .split(/[\n,;\s]+/)
      .map(e => e.trim())
      .filter(e => e.includes('@') && e.includes('.'));
    if (!emails.length) return;
    startTransition(() => addWhitelistBulk(eventId, emails));
    setBulkText('');
    setBulkOpen(false);
  };

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.85)',
        border:     '1px solid rgba(189,239,255,0.55)',
        boxShadow:  '0 4px 16px rgba(7,22,47,0.06)',
      }}
    >
      <div className="flex items-start justify-between mb-0.5">
        <h2 className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Whitelist</h2>
        <button
          onClick={() => setBulkOpen(v => !v)}
          className="text-[10px] font-bold transition-colors hover:opacity-70"
          style={{ color: '#1E8BFF' }}
        >
          {bulkOpen ? '× Sluiten' : '+ Bulk toevoegen'}
        </button>
      </div>
      <p className="text-[11px] text-muted mb-4">E-mails die de rate-limit omzeilen</p>

      {/* ── Bulk import panel ─────────────────────────────────── */}
      {bulkOpen && (
        <div
          className="mb-4 p-3 rounded-xl"
          style={{ background: 'rgba(30,139,255,0.05)', border: '1px solid rgba(30,139,255,0.15)' }}
        >
          <p className="text-[10px] font-bold text-muted mb-2">
            Plak e-mails — gescheiden door enter, komma of spatie
          </p>
          <textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            rows={4}
            placeholder={'jan@voorbeeld.nl\npiet@voorbeeld.nl\nklaas@voorbeeld.nl'}
            className="w-full rounded-xl px-3 py-2.5 text-xs outline-none resize-none"
            style={{
              background:  'rgba(247,251,255,0.9)',
              border:      '1px solid rgba(189,239,255,0.6)',
              color:       '#07162F',
              fontFamily:  'monospace',
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted">
              {bulkText.split(/[\n,;\s]+/).filter(e => e.includes('@')).length} e-mails herkend
            </span>
            <button
              type="button"
              onClick={handleBulkAdd}
              disabled={isPending || !bulkText.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)' }}
            >
              {isPending
                ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5h6M5 2l3 3-3 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
              }
              Allemaal toevoegen
            </button>
          </div>
        </div>
      )}

      {/* ── Single add form ───────────────────────────────────── */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email@voorbeeld.nl"
          className="flex-1 rounded-xl px-3 py-2.5 text-xs outline-none transition-colors"
          style={{
            background: 'rgba(247,251,255,0.8)',
            border:     '1px solid rgba(189,239,255,0.6)',
            color:      '#07162F',
          }}
          onFocus={e => (e.target.style.borderColor = '#1E8BFF')}
          onBlur={e  => (e.target.style.borderColor = 'rgba(189,239,255,0.6)')}
        />
        <button
          type="submit"
          disabled={isPending || !email.trim()}
          className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </form>

      {/* ── List ─────────────────────────────────────────────── */}
      {initial.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(189,239,255,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5" r="3" stroke="#6C7A8D" strokeWidth="1.4"/>
              <path d="M2 13c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#6C7A8D" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-xs text-muted">Nog geen entries</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {initial.map(entry => {
            const hue = entry.email.charCodeAt(0) * 137 % 360;
            return (
              <div
                key={entry.id}
                className="flex items-center gap-2.5 py-2 px-3 rounded-xl transition-colors hover:bg-white/60"
                style={{ background: 'rgba(189,239,255,0.08)' }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0"
                  style={{ background: `hsl(${hue},55%,58%)` }}
                >
                  {entry.email.substring(0, 2).toUpperCase()}
                </div>
                <p className="text-xs text-navy truncate flex-1 font-medium">{entry.email}</p>
                <button
                  onClick={() => startTransition(() => removeWhitelist(entry.id, eventId))}
                  disabled={isPending}
                  className="w-5 h-5 rounded-md flex items-center justify-center disabled:opacity-40 transition-all hover:scale-110"
                  style={{ background: 'rgba(255,30,30,0.1)', color: '#CC1010' }}
                  title="Verwijder"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
