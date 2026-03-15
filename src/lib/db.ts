import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma() {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  // Use verify-full to avoid pg driver warning and keep strict SSL (require/prefer become weaker in future)
  if (!connectionString.includes('localhost') && connectionString.includes('postgres')) {
    if (!connectionString.includes('sslmode=')) {
      connectionString += connectionString.includes('?') ? '&' : '?';
      connectionString += 'sslmode=verify-full';
    } else {
      connectionString = connectionString.replace(/sslmode=(require|prefer|verify-ca)/i, 'sslmode=verify-full');
    }
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
