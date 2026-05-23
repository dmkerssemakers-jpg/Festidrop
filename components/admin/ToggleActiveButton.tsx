'use client';
import { useTransition, useState, useEffect } from 'react';
import { toggleEventActive } from '@/lib/actions';

export default function ToggleActiveButton({
  eventId,
  isActive,
  accentColor,
}: {
  eventId:     string;
  isActive:    boolean;
  accentColor: string;
}) {
  const [isPending,   startTransition] = useTransition();
  const [optimistic,  setOptimistic]   = useState(isActive);

  // Sync when server sends fresh data after revalidation
  useEffect(() => { setOptimistic(isActive); }, [isActive]);

  function handleClick() {
    const next = !optimistic;
    setOptimistic(next);
    startTransition(() => toggleEventActive(eventId, next));
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={optimistic ? 'Deactiveren' : 'Activeren'}
      className="flex items-center justify-center rounded-xl transition-all hover:opacity-80 disabled:opacity-40"
      style={{ background: 'rgba(189,239,255,0.3)', padding: '6px 8px' }}
    >
      {isPending ? (
        <span
          className="block rounded-full border-[1.5px] animate-spin"
          style={{ width: 14, height: 14, borderColor: 'rgba(7,22,47,0.2)', borderTopColor: '#07162F' }}
        />
      ) : (
        /* Mini toggle switch */
        <div
          className="relative rounded-full transition-colors duration-200"
          style={{
            width:      28,
            height:     16,
            background: optimistic ? accentColor : 'rgba(0,0,0,0.18)',
          }}
        >
          <div
            className="absolute top-[2px] rounded-full bg-white shadow-sm"
            style={{
              width:      12,
              height:     12,
              left:       optimistic ? '14px' : '2px',
              transition: 'left 150ms cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </div>
      )}
    </button>
  );
}
