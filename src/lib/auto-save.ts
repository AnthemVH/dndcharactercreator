import { prisma } from '@/lib/prisma'
import { cleanupExpiredImages } from './image-storage'
import { Prisma } from '@prisma/client'

export interface AutoSaveContent {
  type: 'character' | 'npc' | 'item' | 'quest' | 'encounter' | 'world' | 'campaign'
  data: Record<string, any>
  userId: string
}

/**
 * Auto-saves generated content with 30-day expiration
 */
export async function autoSaveContent({ type, data, userId }: AutoSaveContent) {
  try {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

    const commonData = {
      userId: userId,
      autoSave: true,
      expiresAt,
      data: data as Prisma.InputJsonValue,
    }

    switch (type) {
      case 'character':
        return await prisma.character.create({
          data: {
            ...commonData,
            name: data.name,
            race: data.race,
            class: data.class,
            level: data.level,
            portraitUrl: data.portraitUrl,
          },
        })

      case 'npc':
        return await prisma.nPC.create({
          data: {
            ...commonData,
            name: data.name,
            race: data.race,
            role: data.role,
            portraitUrl: data.portraitUrl,
          },
        })

      case 'world':
        return await prisma.world.create({
          data: {
            ...commonData,
            name: data.name,
            theme: data.theme,
            landName: data.landName,
          },
        })

      case 'item':
        return await prisma.item.create({
          data: {
            ...commonData,
            name: data.name,
            itemType: data.itemType,
            theme: data.theme,
            rarity: data.rarity,
          },
        })

      case 'quest':
        return await prisma.quest.create({
          data: {
            ...commonData,
            title: data.title,
          },
        })

      case 'encounter':
        return await prisma.encounter.create({
          data: {
            ...commonData,
            name: data.name,
          },
        })

      case 'campaign':
        return await prisma.campaign.create({
          data: {
            ...commonData,
            name: data.name,
            description: data.description,
            characterSlots: data.characterSlots,
            status: data.status,
          },
        })

      default:
        throw new Error(`Unknown content type: ${type}`)
    }
  } catch (error) {
    console.error('Auto-save error:', error)
    throw error
  }
}

/**
 * Cleans up expired auto-saved content
 */
export async function cleanupExpiredContent() {
  try {
    const now = new Date()

    // Delete expired auto-saved content from all tables
    const results = await Promise.all([
      prisma.character.deleteMany({
        where: {
          autoSave: true,
          expiresAt: {
            lt: now,
          },
        },
      }),
      prisma.nPC.deleteMany({
        where: {
          autoSave: true,
          expiresAt: {
            lt: now,
          },
        },
      }),
      prisma.world.deleteMany({
        where: {
          autoSave: true,
          expiresAt: {
            lt: now,
          },
        },
      }),
      prisma.item.deleteMany({
        where: {
          autoSave: true,
          expiresAt: {
            lt: now,
          },
        },
      }),
      prisma.quest.deleteMany({
        where: {
          autoSave: true,
          expiresAt: {
            lt: now,
          },
        },
      }),
      prisma.encounter.deleteMany({
        where: {
          autoSave: true,
          expiresAt: {
            lt: now,
          },
        },
      }),
      prisma.campaign.deleteMany({
        where: {
          autoSave: true,
          expiresAt: {
            lt: now,
          },
        },
      }),
    ])

    const totalDeleted = results.reduce((sum, result) => sum + result.count, 0)
    console.log(`Cleaned up ${totalDeleted} expired auto-saved items`)
    
    // Also cleanup expired images
    const expiredImages = await cleanupExpiredImages()
    console.log(`Cleaned up ${expiredImages} expired images`)
    
    return totalDeleted
  } catch (error) {
    console.error('Cleanup error:', error)
    throw error
  }
}

/**
 * Converts auto-saved content to permanent content
 */
export async function convertToPermanent(id: string, type: string) {
  try {
    switch (type) {
      case 'character':
        return await prisma.character.update({
          where: { id },
          data: {
            autoSave: false,
            expiresAt: null,
          },
        })

      case 'npc':
        return await prisma.nPC.update({
          where: { id },
          data: {
            autoSave: false,
            expiresAt: null,
          },
        })

      case 'world':
        return await prisma.world.update({
          where: { id },
          data: {
            autoSave: false,
            expiresAt: null,
          },
        })

      case 'item':
        return await prisma.item.update({
          where: { id },
          data: {
            autoSave: false,
            expiresAt: null,
          },
        })

      case 'quest':
        return await prisma.quest.update({
          where: { id },
          data: {
            autoSave: false,
            expiresAt: null,
          },
        })

      case 'encounter':
        return await prisma.encounter.update({
          where: { id },
          data: {
            autoSave: false,
            expiresAt: null,
          },
        })

      case 'campaign':
        return await prisma.campaign.update({
          where: { id },
          data: {
            autoSave: false,
            expiresAt: null,
          },
        })

      default:
        throw new Error(`Unknown content type: ${type}`)
    }
  } catch (error) {
    console.error('Convert to permanent error:', error)
    throw error
  }
} 