'use client';
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{ background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
    >
      Afdrukken / PDF
    </button>
  );
}
