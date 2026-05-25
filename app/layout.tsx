import type { Metadata, Viewport } from 'next';
import { Inter, Caveat } from 'next/font/google';
import './globals.css';
import PWASetup from '@/components/PWASetup';

const inter   = Inter({ subsets: ['latin'], variable: '--font-inter' });
const caveat  = Caveat({ subsets: ['latin'], variable: '--font-caveat', weight: ['400', '600', '700'] });

export const viewport: Viewport = {
  themeColor:        '#07162F',
  width:             'device-width',
  initialScale:      1,
  maximumScale:      1,
  userScalable:      false,
};

export const metadata: Metadata = {
  title:       'FestiDrop — Vang de sfeer. Deel de herinnering.',
  description: "Maak 10 polaroid-foto's van jouw festivalmomenten en ontvang ze direct in je mailbox.",
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:          true,
    statusBarStyle:   'black-translucent',
    title:            'FestiDrop',
  },
  icons: {
    icon:  '/icon.svg',
    apple: '/icon.svg',    // replace with /apple-touch-icon.png (180×180 PNG) for best iOS support
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${inter.variable} ${caveat.variable}`}>
      <body>
        {children}
        <PWASetup />
      </body>
    </html>
  );
}
