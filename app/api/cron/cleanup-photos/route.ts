import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 30 * 86_400_000);

  const photos = await prisma.photo.findMany({
    where:  { createdAt: { lt: cutoff } },
    select: { id: true, url: true },
  });

  let deleted = 0;
  const errors: string[] = [];

  for (const photo of photos) {
    // Delete from Vercel Blob first, then remove DB record regardless
    try {
      await del(photo.url);
    } catch (err) {
      errors.push(`blob:${photo.id}: ${String(err)}`);
    }

    try {
      await prisma.photo.delete({ where: { id: photo.id } });
      deleted++;
    } catch (err) {
      errors.push(`db:${photo.id}: ${String(err)}`);
    }
  }

  // Drop records are intentionally kept for statistics
  console.log(`[cleanup-photos] found=${photos.length} deleted=${deleted} errors=${errors.length}`);
  return NextResponse.json({ found: photos.length, deleted, errors });
}
