import { PrismaClient } from '@prisma/client'

// Simple singleton pattern that works in edge runtime
let prismaInstance: PrismaClient | undefined

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }
  return prismaInstance
}

export const prisma = getPrismaClient() 