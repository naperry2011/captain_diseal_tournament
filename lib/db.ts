import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 connects through a driver adapter. We use node-postgres (pg) against
// the pooled Neon connection string. The DATABASE_URL must be the *pooled*
// (-pooler) URL for serverless runtime; schema migrations use the direct URL.
function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Dev-safe singleton: avoid exhausting DB connections during HMR in development.
const g = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = g.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") g.prisma = prisma;
