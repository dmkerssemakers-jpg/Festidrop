import type { Drop } from '@prisma/client';

interface Props {
  drops: Drop[];
  totalDrops: number;
  accentColor?: string;
}

export default function EventStats({ drops, totalDrops, accentColor = '#1E8BFF' }: Props) {
  const uniqueEmails = new Set(drops.map((d) => d.email)).size;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek  = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());

  const today    = drops.filter((d) => new Date(d.sentAt) >= startOfToday).length;
  const thisWeek = drops.filter((d) => new Date(d.sentAt) >= startOfWeek).length;

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.85)',
        border: '1px solid rgba(189,239,255,0.55)',
        boxShadow: '0 4px 16px rgba(7,22,47,0.06)',
      }}
    >
      <h2 className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-4">Statistieken</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Totaal drops" value={totalDrops} color={accentColor}
          icon={<path d="M3 8l4 4 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>}
        />
        <StatCard label="Unieke e-mails" value={uniqueEmails} color="#20D6E8"
          icon={<><circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>}
        />
        <StatCard label="Vandaag" value={today} color="#00C896"
          icon={<><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>}
        />
        <StatCard label="Deze week" value={thisWeek} color="#7B2FF7"
          icon={<><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>}
        />
      </div>

      {/* Recent drops feed */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-3">Recente drops</p>

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
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {drops.slice(0, 15).map((drop) => {
              const initials = drop.email.substring(0, 2).toUpperCase();
              const hue = drop.email.charCodeAt(0) * 137 % 360;
              return (
                <div key={drop.id}
                  className="flex items-center gap-3 py-1.5 px-3 rounded-xl transition-colors hover:bg-white/60"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0"
                    style={{ background: `hsl(${hue},60%,55%)` }}
                  >
                    {initials}
                  </div>
                  <p className="text-xs text-navy font-medium truncate flex-1">{drop.email}</p>
                  <p className="text-[10px] text-muted shrink-0">
                    {new Date(drop.sentAt).toLocaleString('nl-NL', {
                      day: '2-digit', month: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, color, icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{
        background: `${color}08`,
        border: `1px solid ${color}20`,
      }}
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
