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

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Invoice" (
        "id"        TEXT NOT NULL,
        "number"    TEXT NOT NULL,
        "clientId"  TEXT NOT NULL,
        "status"    TEXT NOT NULL DEFAULT 'CONCEPT',
        "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dueDate"   TIMESTAMP(3),
        "notes"     TEXT,
        "vatPct"    DOUBLE PRECISION NOT NULL DEFAULT 21,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Invoice_number_key" UNIQUE ("number")
      )
    `;

    await prisma.$executeRaw`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'Invoice_clientId_fkey'
        ) THEN
          ALTER TABLE "Invoice"
            ADD CONSTRAINT "Invoice_clientId_fkey"
            FOREIGN KEY ("clientId") REFERENCES "Client"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "InvoiceLine" (
        "id"          TEXT NOT NULL,
        "invoiceId"   TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "quantity"    DOUBLE PRECISION NOT NULL DEFAULT 1,
        "unitPrice"   DOUBLE PRECISION NOT NULL DEFAULT 0,
        "sortOrder"   INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
      )
    `;

    await prisma.$executeRaw`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'InvoiceLine_invoiceId_fkey'
        ) THEN
          ALTER TABLE "InvoiceLine"
            ADD CONSTRAINT "InvoiceLine_invoiceId_fkey"
            FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Photo" (
        "id"        TEXT NOT NULL,
        "dropId"    TEXT NOT NULL,
        "url"       TEXT NOT NULL,
        "order"     INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
      )
    `;

    await prisma.$executeRaw`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'Photo_dropId_fkey'
        ) THEN
          ALTER TABLE "Photo"
            ADD CONSTRAINT "Photo_dropId_fkey"
            FOREIGN KEY ("dropId") REFERENCES "Drop"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `;

    // Marketing consent opt-in (added for app-launch funnel)
    await prisma.$executeRaw`ALTER TABLE "Drop" ADD COLUMN IF NOT EXISTS "marketingConsent" BOOLEAN NOT NULL DEFAULT false`;

    // App settings (key-value store)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Setting" (
        "key"       TEXT NOT NULL,
        "value"     TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
      )
    `;

    console.log('[migration] schema up to date');
  } catch (err) {
    console.error('[migration] failed:', err);
  }
}
