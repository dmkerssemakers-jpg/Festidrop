'use client';
import { useRouter } from 'next/navigation';
import CameraCapture from './CameraCapture';

export default function PhotoSessionManager() {
  const router = useRouter();

  function handleComplete(photos: string[]) {
    try {
      localStorage.setItem('festidrop_photos', JSON.stringify(photos));
    } catch {
      // localStorage vol — onwaarschijnlijk maar veilig afvangen
    }
    router.push('/send');
  }

  return <CameraCapture onComplete={handleComplete} />;
}
