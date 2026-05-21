import BackgroundPattern from '@/components/BackgroundPattern';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import PhotoSessionManager from '@/components/PhotoSessionManager';

export default function Home() {
  return (
    <main className="min-h-screen bg-page relative">
      <BackgroundPattern />
      <Header />
      <Hero />
      <PhotoSessionManager />

      <footer className="px-5 pb-12 text-center">
        <p className="text-xs text-muted">
          © 2026&nbsp;FestiDrop&nbsp;·&nbsp;
          <span className="text-gradient-drop font-semibold">
            Vang de sfeer. Deel de herinnering.
          </span>
        </p>
      </footer>
    </main>
  );
}
