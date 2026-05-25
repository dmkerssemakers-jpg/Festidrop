import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const marketingOnly = req.nextUrl.searchParams.get('marketing') === '1';

  const [event, drops] = await Promise.all([
    prisma.event.findUnique({ where: { id }, select: { name: true, slug: true } }),
    prisma.drop.findMany({
      where:   { eventId: id, ...(marketingOnly ? { marketingConsent: true } : {}) },
      orderBy: { sentAt: 'asc' },
      select:  { email: true, sentAt: true, marketingConsent: true },
    }),
  ]);

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  type DropRow = (typeof drops)[number];

  const rows = [
    'email,datum,tijd,marketing_consent',
    ...drops.map((d: DropRow) => {
      const dt   = new Date(d.sentAt);
      const date = dt.toLocaleDateString('nl-NL');
      const time = dt.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
      return `${d.email},${date},${time},${d.marketingConsent ? 'ja' : 'nee'}`;
    }),
  ].join('\n');

  const suffix   = marketingOnly ? '-marketing' : '-drops';
  const filename = `${event.slug}${suffix}.csv`;

  return new NextResponse(rows, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
