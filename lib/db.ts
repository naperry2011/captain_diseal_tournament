import { PrismaClient } from "@prisma/client";

// TODO(deploy): Prisma 7 requires a driver adapter at runtime, e.g.
//   new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
// Without it, instantiation throws. Add when wiring Vercel Postgres.

// Dev-safe singleton: avoid exhausting DB connections during HMR in development.
const g = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = g.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") g.prisma = prisma;
