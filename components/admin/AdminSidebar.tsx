'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { FestiDropLogo } from '@/components/Logo';

interface Props {
  user?: { name?: string | null; email?: string | null; image?: string | null };
}

const nav = [
  {
    href: '/admin', label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/>
      </svg>
    ),
  },
  {
    href: '/admin/events', label: 'Events',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="3" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 3V2M11 3V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M1 6h14" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
];

export default function AdminSidebar({ user }: Props) {
  const path = usePathname();

  return (
    <aside
      className="w-60 shrink-0 flex flex-col min-h-screen border-r"
      style={{
        background: '#07162F',
        borderColor: 'rgba(189,239,255,0.12)',
      }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(189,239,255,0.12)' }}>
        <FestiDropLogo size="sm" onDark />
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] mt-1.5" style={{ color: 'rgba(189,239,255,0.45)' }}>
          Dashboard
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => {
          const active = item.href === '/admin'
            ? path === '/admin'
            : path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={active
                ? { background: 'rgba(30,139,255,0.18)', color: '#1E8BFF' }
                : { color: 'rgba(189,239,255,0.55)' }
              }
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 pb-5 border-t pt-4" style={{ borderColor: 'rgba(189,239,255,0.12)' }}>
        <div className="flex items-center gap-3 mb-3">
          {user?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.name}</p>
            <p className="text-[10px] truncate" style={{ color: 'rgba(189,239,255,0.45)' }}>{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-xs py-2 rounded-xl font-semibold transition-all"
          style={{ background: 'rgba(189,239,255,0.08)', color: 'rgba(189,239,255,0.55)' }}
        >
          Uitloggen
        </button>
      </div>
    </aside>
  );
}
