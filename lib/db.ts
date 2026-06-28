import { PrismaClient } from "@prisma/client";

// Dev-safe singleton: avoid exhausting DB connections during HMR in development.
const g = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = g.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") g.prisma = prisma;
