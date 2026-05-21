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

  const [event, drops] = await Promise.all([
    prisma.event.findUnique({ where: { id }, select: { name: true, slug: true } }),
    prisma.drop.findMany({
      where: { eventId: id },
      orderBy: { sentAt: 'asc' },
      select: { email: true, sentAt: true },
    }),
  ]);

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rows = [
    'email,datum,tijd',
    ...drops.map((d: { email: string; sentAt: Date }) => {
      const dt = new Date(d.sentAt);
      const date = dt.toLocaleDateString('nl-NL');
      const time = dt.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
      return `${d.email},${date},${time}`;
    }),
  ].join('\n');

  const filename = `${event.slug}-drops.csv`;

  return new NextResponse(rows, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
