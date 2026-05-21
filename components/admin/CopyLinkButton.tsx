'use client';
import { useState } from 'react';

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-lg transition-all hover:opacity-70"
      style={{ background: copied ? 'rgba(0,200,150,0.15)' : 'rgba(189,239,255,0.25)' }}
      title={copied ? 'Gekopieerd!' : 'Kopieer link'}
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M2 7l3 3 6-6" stroke="#00C896" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="#07162F" strokeWidth="1.3"/>
          <path d="M3 9H2a1 1 0 01-1-1V2a1 1 0 011-1h6a1 1 0 011 1v1" stroke="#07162F" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  );
}
