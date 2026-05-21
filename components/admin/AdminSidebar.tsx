'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { FestiDropLogo } from '@/components/Logo';

interface Props {
  user?: { name?: string | null; email?: string | null; image?: string | null };
}

const nav = [
  { href: '/admin', label: 'Dashboard', icon: '▤' },
  { href: '/admin/events', label: 'Events', icon: '◈' },
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
        <FestiDropLogo size="sm" />
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
              <span style={{ fontSize: '15px' }}>{item.icon}</span>
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
