import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const results: string[] = [];

  try {
    // Add notes column to Event
    await prisma.$executeRaw`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "notes" TEXT`;
    results.push('✓ Event.notes');
  } catch (e) { results.push(`✗ Event.notes: ${e}`); }

  try {
    // Create Client table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Client" (
        "id"            TEXT NOT NULL,
        "name"          TEXT NOT NULL,
        "contactPerson" TEXT,
        "email"         TEXT,
        "phone"         TEXT,
        "website"       TEXT,
        "notes"         TEXT,
        "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
      )
    `;
    results.push('✓ Client table');
  } catch (e) { results.push(`✗ Client table: ${e}`); }

  try {
    // Add clientId column to Event
    await prisma.$executeRaw`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "clientId" TEXT`;
    results.push('✓ Event.clientId');
  } catch (e) { results.push(`✗ Event.clientId: ${e}`); }

  try {
    // Add foreign key Event -> Client (skip if already exists)
    await prisma.$executeRaw`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'Event_clientId_fkey'
        ) THEN
          ALTER TABLE "Event"
            ADD CONSTRAINT "Event_clientId_fkey"
            FOREIGN KEY ("clientId") REFERENCES "Client"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$
    `;
    results.push('✓ Event_clientId_fkey');
  } catch (e) { results.push(`✗ Event_clientId_fkey: ${e}`); }

  return NextResponse.json({ ok: true, results });
}
