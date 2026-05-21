'use client';
import { useTransition } from 'react';
import { duplicateEvent } from '@/lib/actions';

export default function DuplicateEventButton({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => duplicateEvent(eventId))}
      disabled={isPending}
      title="Event dupliceren"
      className="flex items-center justify-center w-8 h-8 rounded-xl transition-all hover:opacity-80 hover:scale-105 disabled:opacity-40"
      style={{ background: 'rgba(189,239,255,0.3)', color: '#07162F' }}
    >
      {isPending ? (
        <span className="w-3 h-3 border-[1.5px] border-navy/30 border-t-navy rounded-full animate-spin" />
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M10 4V2.5A1.5 1.5 0 008.5 1h-6A1.5 1.5 0 001 2.5v6A1.5 1.5 0 002.5 10H4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  );
}
