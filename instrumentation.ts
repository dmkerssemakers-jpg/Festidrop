export async function register() {
  // Only run in Node.js runtime (not Edge), and only server-side
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  try {
    const { prisma } = await import('./lib/prisma');

    // Idempotent schema migrations — safe to run on every cold start
    await prisma.$executeRaw`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "notes" TEXT`;
    await prisma.$executeRaw`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "clientId" TEXT`;

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

    console.log('[migration] schema up to date');
  } catch (err) {
    console.error('[migration] failed:', err);
  }
}
