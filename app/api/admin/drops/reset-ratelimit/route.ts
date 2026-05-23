import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { kv } from '@vercel/kv';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { eventId?: string; email?: string };
  const { eventId, email } = body;

  if (!eventId || !email) {
    return NextResponse.json({ error: 'eventId en email zijn verplicht' }, { status: 400 });
  }

  const kvKey = `drop:${eventId}:${email.trim().toLowerCase()}`;
  await kv.del(kvKey);

  return NextResponse.json({ ok: true });
}
