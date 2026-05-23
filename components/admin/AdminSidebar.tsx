'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { FestiDropLogo, FestiDropIcon } from '@/components/Logo';

interface Props {
  user?: { name?: string | null; email?: string | null; image?: string | null };
}

const nav = [
  {
    href: '/admin', label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
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
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect x="1" y="3" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 3V2M11 3V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M1 6h14" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: '/admin/clients', label: 'Klanten',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M1 14c0-3 2.2-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M11 7.5c1.7 0 3 1.3 3 3v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M13 3.5a2 2 0 010 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/admin/invoices', label: 'Facturen',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect x="2" y="1" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const EXPANDED = 240;
const COLLAPSED = 64;

export default function AdminSidebar({ user }: Props) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (localStorage.getItem('sidebar-collapsed') === 'true') setCollapsed(true);
    } catch {}
  }, []);

  const toggle = () => {
    setCollapsed(c => {
      const next = !c;
      try { localStorage.setItem('sidebar-collapsed', String(next)); } catch {}
      return next;
    });
  };

  const w = mounted ? (collapsed ? COLLAPSED : EXPANDED) : EXPANDED;

  return (
    <aside
      className="shrink-0 flex flex-col min-h-screen border-r overflow-hidden"
      style={{
        width: w,
        background: '#07162F',
        borderColor: 'rgba(189,239,255,0.12)',
        transition: mounted ? 'width 240ms cubic-bezier(0.4,0,0.2,1)' : 'none',
      }}
    >
      {/* Logo */}
      <div
        className="border-b flex items-center"
        style={{
          borderColor: 'rgba(189,239,255,0.12)',
          minHeight: 72,
          padding: collapsed ? '0 0' : '20px 24px',
          justifyContent: 'center',
        }}
      >
        {collapsed ? (
          <FestiDropIcon className="w-7 h-7" />
        ) : (
          <div className="w-full">
            <FestiDropLogo size="sm" onDark />
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em] mt-1.5 whitespace-nowrap"
              style={{ color: 'rgba(189,239,255,0.45)' }}
            >
              Dashboard
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav
        className="flex-1 space-y-0.5"
        style={{ padding: collapsed ? '16px 8px' : '16px 12px' }}
      >
        {nav.map((item) => {
          const active = item.href === '/admin'
            ? path === '/admin'
            : path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className="flex items-center rounded-xl text-sm font-semibold transition-colors"
              style={{
                gap: collapsed ? 0 : 12,
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                whiteSpace: 'nowrap',
                ...(active
                  ? { background: 'rgba(30,139,255,0.18)', color: '#1E8BFF' }
                  : { color: 'rgba(189,239,255,0.55)' }),
              }}
            >
              {item.icon}
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div style={{ padding: collapsed ? '0 8px 12px' : '0 12px 12px' }}>
        <button
          onClick={toggle}
          className="w-full flex items-center rounded-xl transition-colors"
          style={{
            color: 'rgba(189,239,255,0.35)',
            background: 'rgba(189,239,255,0.06)',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8,
            padding: collapsed ? '9px 0' : '9px 12px',
          }}
          title={collapsed ? 'Uitklappen' : 'Inklappen'}
        >
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{
              flexShrink: 0,
              transform: collapsed ? 'rotate(180deg)' : 'none',
              transition: 'transform 240ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!collapsed && (
            <span className="text-xs font-semibold whitespace-nowrap">Inklappen</span>
          )}
        </button>
      </div>

      {/* User */}
      <div
        className="border-t"
        style={{
          borderColor: 'rgba(189,239,255,0.12)',
          padding: collapsed ? '16px 8px 20px' : '16px 16px 20px',
        }}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="w-8 h-8 rounded-full"
                title={user.name ?? undefined}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(30,139,255,0.2)', color: '#1E8BFF' }}
                title={user?.name ?? undefined}
              >
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: 'rgba(189,239,255,0.08)', color: 'rgba(189,239,255,0.55)' }}
              title="Uitloggen"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              {user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'rgba(30,139,255,0.2)', color: '#1E8BFF' }}
                >
                  {user?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] truncate" style={{ color: 'rgba(189,239,255,0.45)' }}>{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full text-xs py-2 rounded-xl font-semibold transition-colors"
              style={{ background: 'rgba(189,239,255,0.08)', color: 'rgba(189,239,255,0.55)' }}
            >
              Uitloggen
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
