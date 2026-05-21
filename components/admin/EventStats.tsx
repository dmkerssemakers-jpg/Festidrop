import type { Drop } from '@prisma/client';

interface Props {
  drops: Drop[];
  totalDrops: number;
}

export default function EventStats({ drops, totalDrops }: Props) {
  const uniqueEmails = new Set(drops.map((d) => d.email)).size;

  const last24h = drops.filter(
    (d) => new Date(d.sentAt) > new Date(Date.now() - 86400_000)
  ).length;

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.85)',
        border: '1px solid rgba(189,239,255,0.55)',
        boxShadow: '0 4px 16px rgba(7,22,47,0.06)',
      }}
    >
      <h2 className="text-sm font-black uppercase tracking-[0.1em] text-muted mb-5">Statistieken</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Drops" value={totalDrops} color="#1E8BFF" />
        <Stat label="Uniek" value={uniqueEmails} color="#20D6E8" />
        <Stat label="Afgelopen 24u" value={last24h} color="#7B2FF7" />
      </div>

      {/* Recent list */}
      {drops.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted mb-2">Recente drops</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {drops.slice(0, 10).map((drop) => (
              <div key={drop.id} className="flex items-center justify-between">
                <p className="text-xs text-navy font-medium truncate mr-2">{drop.email}</p>
                <p className="text-[10px] text-muted shrink-0">
                  {new Date(drop.sentAt).toLocaleString('nl-NL', {
                    day: '2-digit', month: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {drops.length === 0 && (
        <p className="text-xs text-muted text-center py-4">Nog geen drops voor dit event</p>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className="text-2xl font-black" style={{ color, letterSpacing: '-0.03em' }}>{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  );
}
