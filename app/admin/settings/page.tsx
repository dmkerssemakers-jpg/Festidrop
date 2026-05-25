import { getCompanySettings } from '@/lib/settings';
import SettingsForm from '@/components/admin/SettingsForm';

export const revalidate = 0;

export default async function SettingsPage() {
  const settings = await getCompanySettings();

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy" style={{ letterSpacing: '-0.03em' }}>Instellingen</h1>
          <p className="text-sm text-muted mt-0.5">Bedrijfsgegevens die op elke factuur verschijnen</p>
        </div>
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: 'rgba(30,139,255,0.06)', border: '1px solid rgba(30,139,255,0.15)' }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="2" stroke="#1E8BFF" strokeWidth="1.2"/>
            <path d="M6.5 1v1.2M6.5 10.8V12M1 6.5h1.2M10.8 6.5H12M2.7 2.7l.85.85M9.45 9.45l.85.85M9.45 3.55l-.85.85M3.55 9.45l-.85.85" stroke="#1E8BFF" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
          <span className="text-xs font-black" style={{ color: '#1E8BFF' }}>Bedrijfsinstellingen</span>
        </div>
      </div>

      <SettingsForm initial={settings} />
    </div>
  );
}
