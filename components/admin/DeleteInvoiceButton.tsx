'use client';
import { useTransition } from 'react';
import { deleteInvoice } from '@/lib/actions';

export default function DeleteInvoiceButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm('Factuur definitief verwijderen? Dit kan niet ongedaan worden gemaakt.')) return;
    startTransition(async () => { await deleteInvoice(id); });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50"
      style={{ background: 'rgba(255,30,30,0.07)', color: '#CC1010', border: '1px solid rgba(255,30,30,0.14)' }}
    >
      {isPending ? (
        <>
          <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: '#CC101040', borderTopColor: '#CC1010' }} />
          Verwijderen…
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1.5 3h9M4.5 3V1.5h3V3M5 5.5v3.5M7 5.5v3.5M2.5 3l.5 7a1 1 0 001 1h4a1 1 0 001-1l.5-7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Factuur verwijderen
        </>
      )}
    </button>
  );
}
