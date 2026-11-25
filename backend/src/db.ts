import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as typeof globalThis & {
  zettosPrisma?: PrismaClient
}

export const prisma =
  globalForPrisma.zettosPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.zettosPrisma = prisma
}
