import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

type AcceleratedPrisma = ReturnType<typeof makePrismaClient>;
const globalForPrisma = globalThis as unknown as { prisma: AcceleratedPrisma };

function makePrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  }).$extends(withAccelerate());
}

export const prisma = globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
