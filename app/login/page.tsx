'use client';
import { signIn } from 'next-auth/react';
import { FestiDropLogo } from '@/components/Logo';
import BackgroundPattern from '@/components/BackgroundPattern';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-page relative flex items-center justify-center px-5">
      <BackgroundPattern />
      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div
          className="rounded-3xl p-8 text-center"
          style={{
            background: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(189,239,255,0.55)',
            boxShadow: '0 24px 80px rgba(7,22,47,0.08)',
          }}
        >
          <div className="flex justify-center mb-6">
            <FestiDropLogo size="md" />
          </div>

          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted mb-2">
            Dashboard
          </p>
          <h1 className="text-2xl font-black text-navy mb-1" style={{ letterSpacing: '-0.03em' }}>
            Welkom terug
          </h1>
          <p className="text-sm text-muted mb-8">
            Log in om jouw events te beheren
          </p>

          <button
            onClick={() => signIn('google', { callbackUrl: '/admin' })}
            className="w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 px-5 font-bold text-sm transition-all active:scale-95"
            style={{
              background: '#07162F',
              color: '#fff',
              boxShadow: '0 8px 24px rgba(7,22,47,0.18)',
            }}
          >
            {/* Google icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Inloggen met Google
          </button>
        </div>
      </div>
    </main>
  );
}
