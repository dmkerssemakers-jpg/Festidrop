'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import EmailDropCard from '@/components/EmailDropCard';
import Header from '@/components/Header';
import BackgroundPattern from '@/components/BackgroundPattern';

export default function SendPage() {
  const [photos, setPhotos] = useState<string[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('festidrop_photos');
      if (!stored) { router.replace('/'); return; }
      const parsed = JSON.parse(stored) as string[];
      if (!Array.isArray(parsed) || parsed.length === 0) { router.replace('/'); return; }
      setPhotos(parsed);
    } catch {
      router.replace('/');
    }
  }, [router]);

  function handleSent() {
    localStorage.removeItem('festidrop_photos');
  }

  if (!photos) {
    return (
      <main className="min-h-screen bg-page flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-azure border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-page relative">
      <BackgroundPattern />
      <Header />
      <motion.div
        className="pt-28 pb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <EmailDropCard photos={photos} onSent={handleSent} />
      </motion.div>
    </main>
  );
}
