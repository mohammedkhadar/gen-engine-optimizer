import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const hasDatabase = !!process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  (hasDatabase
    ? new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] })
    : (null as unknown as PrismaClient));

if (process.env.NODE_ENV !== "production" && hasDatabase) globalForPrisma.prisma = prisma;
