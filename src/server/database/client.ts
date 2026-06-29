import { PrismaClient } from "@prisma/client";

/**
 * A single shared Prisma client for the entire application.
 * Prisma manages a connection pool internally — always import this
 * instance rather than creating a new PrismaClient() each time.
 */
export const prisma = new PrismaClient();
