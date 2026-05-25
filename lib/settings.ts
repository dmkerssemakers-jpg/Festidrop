import { prisma } from '@/lib/prisma';

export interface CompanySettings {
  name:    string;
  address: string;
  city:    string;
  kvk:     string;
  btw:     string;
  iban:    string;
  bank:    string;
  email:   string;
  website: string;
}

const COMPANY_KEYS: (keyof CompanySettings)[] = [
  'name', 'address', 'city', 'kvk', 'btw', 'iban', 'bank', 'email', 'website',
];

const ENV_FALLBACK: CompanySettings = {
  name:    process.env.COMPANY_NAME    ?? '',
  address: process.env.COMPANY_ADDRESS ?? '',
  city:    process.env.COMPANY_CITY    ?? '',
  kvk:     process.env.COMPANY_KVK    ?? '',
  btw:     process.env.COMPANY_BTW    ?? '',
  iban:    process.env.COMPANY_IBAN   ?? '',
  bank:    process.env.COMPANY_BANK   ?? '',
  email:   process.env.COMPANY_EMAIL  ?? 'info@festidrop.nl',
  website: process.env.COMPANY_WEBSITE ?? 'www.festidrop.nl',
};

/**
 * Loads company settings from the database.
 * Falls back to environment variables if a key is not yet stored.
 * Safe to call server-side; catches DB errors gracefully.
 */
export async function getCompanySettings(): Promise<CompanySettings> {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: COMPANY_KEYS.map(k => `company.${k}`) } },
    });
    const map: Record<string, string> = Object.fromEntries(
      rows.map((r: { key: string; value: string }) => [r.key.replace('company.', ''), r.value])
    );
    return COMPANY_KEYS.reduce((acc, k) => {
      acc[k] = map[k] ?? ENV_FALLBACK[k];
      return acc;
    }, {} as CompanySettings);
  } catch {
    // DB not yet ready (e.g. cold start before migration) — fall back silently
    return ENV_FALLBACK;
  }
}

export { COMPANY_KEYS };
