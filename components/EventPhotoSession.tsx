'use client';
import { useRouter } from 'next/navigation';
import CameraCapture from './CameraCapture';

interface Props {
  eventId: string;
  eventName: string;
  accentColor: string;
  maxPhotos: number;
  slug: string;
  logoUrl?: string | null;
  hasSubHeader?: boolean;
}

export default function EventPhotoSession({ eventId, eventName, slug, maxPhotos, logoUrl, hasSubHeader }: Props) {
  const router = useRouter();
  const storageKey = `festidrop_photos_${slug}`;

  function handleComplete(photos: string[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(photos));
    } catch {}
    router.push(`/${slug}/send`);
  }

  return (
    <CameraCapture
      onComplete={handleComplete}
      maxPhotos={maxPhotos}
      eventId={eventId}
      logoUrl={logoUrl}
      eventName={eventName}
      topOffset={hasSubHeader ? 'pt-36' : 'pt-24'}
    />
  );
}
