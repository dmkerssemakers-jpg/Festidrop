import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '@/auth';

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(req: NextRequest) {
  // Auth guard — only admin can upload
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Blob storage is niet geconfigureerd. Voeg BLOB_READ_WRITE_TOKEN toe in Vercel.' },
      { status: 503 }
    );
  }

  const form = await req.formData();
  const file = form.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Geen bestand meegestuurd' }, { status: 400 });
  }

  // Validate type
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Alleen afbeeldingen zijn toegestaan' }, { status: 400 });
  }

  // Validate size
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Afbeelding is te groot (max 2 MB)' }, { status: 413 });
  }

  const ext      = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const filename = `logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const blob = await put(filename, file, {
    access:      'public',
    contentType: file.type,
  });

  return NextResponse.json({ url: blob.url });
}
