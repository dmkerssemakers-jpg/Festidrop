import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'FestiDrop — Vang de sfeer. Deel de herinnering.',
  description:
    "Maak 10 polaroid-foto's van jouw festivalmomenten en ontvang ze direct in je mailbox.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
