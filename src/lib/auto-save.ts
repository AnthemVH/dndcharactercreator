import { prisma } from '@/lib/prisma'
import { cleanupExpiredImages } from './image-storage'
import { Prisma } from '@prisma/client'

export interface AutoSaveContent {
  type: 'character' | 'npc' | 'item' | 'quest' | 'encounter' | 'world' | 'campaign'
  data: Record<string, unknown>
  userId: string
}

/**
 * Serializes array fields to JSON strings for database storage
 * and filters out fields that don't exist in the database schema
 */
function serializeData(data: Record<string, unknown>, type: string): Record<string, unknown> {
  const serialized = { ...data }

  // Define valid fields for each model type based on Prisma schema
  const validFields = {
    character: [
      'name', 'race', 'class', 'level', 'background', 'alignment', 'backstory',
      'personalityTraits', 'stats', 'quote', 'uniqueTrait', 'hitPoints',
      'armorClass', 'initiative', 'speed', 'proficiencies', 'features',
      'portrait', 'portraitUrl', 'userId', 'campaignId'
    ],
    npc: [
      'name', 'race', 'role', 'personality', 'location', 'backstory',
      'personalityTraits', 'appearance', 'motivations', 'relationships',
      'secrets', 'quote', 'uniqueTrait', 'stats', 'skills', 'equipment',
      'goals', 'mood', 'portrait', 'portraitUrl', 'userId', 'campaignId'
    ],
    world: [
      'name', 'theme', 'landName', 'geography', 'politics', 'culture',
      'notableEvents', 'majorFactions', 'landmarks', 'climate', 'resources',
      'population', 'government', 'religion', 'economy', 'conflicts',
      'legends', 'quote', 'uniqueFeature', 'history', 'portrait', 'userId', 'campaignId'
    ],
    item: [
      'name', 'itemType', 'theme', 'rarity', 'description', 'properties',
      'magicalEffects', 'history', 'value', 'weight', 'requirements',
      'attunement', 'quote', 'uniqueTrait', 'craftingMaterials',
      'enchantments', 'restrictions', 'portrait', 'userId', 'campaignId'
    ],
    quest: [
      'title', 'description', 'difficulty', 'objectives', 'rewards',
      'location', 'npcs', 'timeline', 'consequences', 'questType',
      'levelRange', 'estimatedDuration', 'portrait', 'userId', 'campaignId'
    ],
    encounter: [
      'name', 'description', 'difficulty', 'location', 'enemies',
      'objectives', 'rewards', 'environment', 'specialConditions',
      'estimatedDuration', 'levelRange', 'portrait', 'userId', 'campaignId'
    ],
    campaign: [
      'name', 'description', 'theme', 'setting', 'mainPlot', 'levelRange',
      'estimatedDuration', 'locations', 'quests', 'encounters', 'items',
      'characters', 'npcs', 'subPlots', 'majorNPCs', 'portrait', 'userId'
    ]
  }

  // Filter out fields that don't exist in the database schema
  const fieldsToKeep = validFields[type as keyof typeof validFields] || []
  const filtered = Object.keys(serialized).reduce((acc, key) => {
    if (fieldsToKeep.includes(key)) {
      acc[key] = serialized[key]
    }
    return acc
  }, {} as Record<string, unknown>)

  // Array fields that need to be serialized to JSON strings
  const arrayFields = [
    'personalityTraits', 'proficiencies', 'features', 'motivations', 
    'relationships', 'secrets', 'skills', 'equipment', 'goals',
    'notableEvents', 'majorFactions', 'landmarks', 'resources', 
    'conflicts', 'legends', 'properties', 'magicalEffects', 
    'requirements', 'craftingMaterials', 'enchantments', 'restrictions',
    'objectives', 'npcs', 'subPlots', 'majorNPCs', 'locations', 
    'items', 'quests', 'encounters', 'characters'
  ]

  // Object fields that need to be serialized to JSON strings
  const objectFields = [
    'stats'
    // Add more if needed (e.g., abilities, etc.)
  ]

  arrayFields.forEach(field => {
    if (filtered[field] && Array.isArray(filtered[field])) {
      filtered[field] = JSON.stringify(filtered[field])
    }
  })

  objectFields.forEach(field => {
    if (filtered[field] && typeof filtered[field] === 'object' && !Array.isArray(filtered[field])) {
      filtered[field] = JSON.stringify(filtered[field])
    }
  })

  return filtered
}

/**
 * Auto-saves generated content with 30-day expiration
 */
export async function autoSaveContent({ type, data, userId }: AutoSaveContent) {
  try {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

    const serializedData = serializeData(data, type)

    switch (type) {
      case 'character':
        return await prisma.character.create({
          data: {
            ...serializedData,
            characterJson: data as Prisma.InputJsonValue, // Store the full character object
            userId: userId,
            autoSave: true,
            expiresAt,
          },
        })

      case 'npc':
        return await prisma.nPC.create({
          data: {
            ...serializedData,
            npcJson: data as Prisma.InputJsonValue, // Store the full NPC object
            userId: userId,
            autoSave: true,
            expiresAt,
          },
        })

      case 'world':
        return await prisma.world.create({
          data: {
            ...serializedData,
            worldJson: data as Prisma.InputJsonValue, // Store the full world object
            userId: userId,
            autoSave: true,
            expiresAt,
          },
        })

      case 'item':
        return await prisma.item.create({
          data: {
            ...serializedData,
            itemJson: data as Prisma.InputJsonValue, // Store the full item object
            userId: userId,
            autoSave: true,
            expiresAt,
          },
        })

      case 'quest':
        return await prisma.quest.create({
          data: {
            ...serializedData,
            questJson: data as Prisma.InputJsonValue, // Store the full quest object
            userId: userId,
            autoSave: true,
            expiresAt,
          },
        })

      case 'encounter':
        return await prisma.encounter.create({
          data: {
            ...serializedData,
            encounterJson: data as Prisma.InputJsonValue, // Store the full encounter object
            userId: userId,
            autoSave: true,
            expiresAt,
          },
        })

      case 'campaign':
        return await prisma.campaign.create({
          data: {
            ...serializedData,
            campaignJson: data as Prisma.InputJsonValue, // Store the full campaign object
            userId: userId,
            autoSave: true,
            expiresAt,
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