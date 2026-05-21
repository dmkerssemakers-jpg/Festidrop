'use client';
import { useState, useTransition } from 'react';
import { addWhitelist, removeWhitelist } from '@/lib/actions';
import type { Whitelist } from '@prisma/client';

interface Props {
  eventId: string;
  whitelist: Whitelist[];
}

export default function WhitelistManager({ eventId, whitelist: initial }: Props) {
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    startTransition(() => addWhitelist(eventId, email));
    setEmail('');
  };

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.85)',
        border: '1px solid rgba(189,239,255,0.55)',
        boxShadow: '0 4px 16px rgba(7,22,47,0.06)',
      }}
    >
      <h2 className="text-sm font-black uppercase tracking-[0.1em] text-muted mb-1">Whitelist</h2>
      <p className="text-xs text-muted mb-4">E-mails die de rate-limit omzeilen</p>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@voorbeeld.nl"
          className="flex-1 rounded-xl px-3 py-2 text-xs border outline-none transition-colors focus:border-azure"
          style={{
            background: 'rgba(247,251,255,0.8)',
            border: '1px solid rgba(189,239,255,0.6)',
            color: '#07162F',
          }}
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)' }}
        >
          +
        </button>
      </form>

      {/* List */}
      {initial.length === 0 ? (
        <p className="text-xs text-muted text-center py-2">Geen whitelist entries</p>
      ) : (
        <div className="space-y-1.5">
          {initial.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-2">
              <p className="text-xs text-navy truncate">{entry.email}</p>
              <button
                onClick={() => startTransition(() => removeWhitelist(entry.id, eventId))}
                disabled={isPending}
                className="text-[10px] font-bold px-2 py-1 rounded-lg disabled:opacity-40"
                style={{ background: 'rgba(255,30,30,0.1)', color: '#FF1E1E' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
