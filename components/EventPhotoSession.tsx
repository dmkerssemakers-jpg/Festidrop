'use client';
import { useRouter } from 'next/navigation';
import CameraCapture from './CameraCapture';

interface Props {
  eventId: string;
  eventName: string;
  accentColor: string;
  maxPhotos: number;
  slug: string;
}

export default function EventPhotoSession({ eventId, slug, maxPhotos }: Props) {
  const router = useRouter();
  const storageKey = `festidrop_photos_${slug}`;

  function handleComplete(photos: string[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(photos));
    } catch {}
    router.push(`/${slug}/send`);
  }

  return <CameraCapture onComplete={handleComplete} maxPhotos={maxPhotos} eventId={eventId} />;
}
