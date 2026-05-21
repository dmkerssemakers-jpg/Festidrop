import type { Metadata } from 'next';
import { Inter, Caveat } from 'next/font/google';
import './globals.css';

const inter   = Inter({ subsets: ['latin'], variable: '--font-inter' });
const caveat  = Caveat({ subsets: ['latin'], variable: '--font-caveat', weight: ['400', '600', '700'] });

export const metadata: Metadata = {
  title: 'FestiDrop — Vang de sfeer. Deel de herinnering.',
  description:
    "Maak 10 polaroid-foto's van jouw festivalmomenten en ontvang ze direct in je mailbox.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${inter.variable} ${caveat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
