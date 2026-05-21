import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// One-time setup route — creates database tables if they don't exist yet.
// Call once after deploy: GET /api/setup?secret=festidrop-setup-2026
// Remove or disable this route after first successful run.

const SETUP_SECRET = process.env.SETUP_SECRET ?? 'festidrop-setup-2026';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Create tables using raw SQL — idempotent (IF NOT EXISTS)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Event" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT UNIQUE NOT NULL,
        "accentColor" TEXT NOT NULL DEFAULT '#1E8BFF',
        "logoUrl" TEXT,
        "emailText" TEXT,
        "maxPhotos" INTEGER NOT NULL DEFAULT 10,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Drop" (
        "id" TEXT PRIMARY KEY,
        "eventId" TEXT NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
        "email" TEXT NOT NULL,
        "sentAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Whitelist" (
        "id" TEXT PRIMARY KEY,
        "eventId" TEXT NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
        "email" TEXT NOT NULL,
        UNIQUE("eventId", "email")
      )
    `);

    // Verify tables exist
    const events = await prisma.event.count();

    return NextResponse.json({
      success: true,
      message: 'Tabellen aangemaakt ✓',
      eventCount: events,
    });
  } catch (err) {
    console.error('[setup] Error:', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
