/**
 * Image storage and management utilities
 */

export interface ImageMetadata {
  id: string
  url: string
  type: 'character' | 'npc' | 'item' | 'world' | 'quest' | 'encounter' | 'campaign'
  contentId: string // ID of the content this image belongs to
  userId: string
  createdAt: Date
  expiresAt?: Date
  autoSave: boolean
}

/**
 * Downloads an image from a URL and converts it to base64
 */
export async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const contentType = response.headers.get('content-type') || 'image/png'
    
    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.error('Error downloading image:', error)
    throw error
  }
}

/**
 * Saves an image URL to the database
 */
export async function saveImageToDatabase(
  imageData: string,
  contentType: 'character' | 'npc' | 'item' | 'quest' | 'encounter' | 'world' | 'campaign',
  contentId: string,
  userId: string,
  isAutoSave: boolean = false
): Promise<void> {
  try {
    // For now, we'll store the image URL directly
    // In a production environment, you might want to:
    // 1. Upload to a cloud storage service (AWS S3, Google Cloud Storage, etc.)
    // 2. Generate multiple sizes/thumbnails
    // 3. Implement image optimization and compression
    // 4. Add image metadata and EXIF data handling
    
    const { prisma } = await import('@/lib/prisma')
    
    const expiresAt = isAutoSave ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null // 30 days for auto-save
    
    switch (contentType) {
      case 'character':
        await prisma.character.update({
          where: { id: contentId },
          data: { 
            portrait: imageData,
            portraitUrl: imageData // Update both fields for consistency
          }
        })
        break
      case 'npc':
        await prisma.nPC.update({
          where: { id: contentId },
          data: { 
            portrait: imageData,
            portraitUrl: imageData // Update both fields for consistency
          }
        })
        break
      case 'item':
        await prisma.item.update({
          where: { id: contentId },
          data: { portrait: imageData }
        })
        break
      case 'world':
        await prisma.world.update({
          where: { id: contentId },
          data: { portrait: imageData }
        })
        break
      case 'quest':
        await prisma.quest.update({
          where: { id: contentId },
          data: { portrait: imageData }
        })
        break
      case 'encounter':
        await prisma.encounter.update({
          where: { id: contentId },
          data: { portrait: imageData }
        })
        break
      case 'campaign':
        await prisma.campaign.update({
          where: { id: contentId },
          data: { portrait: imageData }
        })
        break
      default:
        throw new Error(`Unknown content type: ${contentType}`)
    }
  } catch (error) {
    console.error('Error saving image to database:', error)
    throw error
  }
}

/**
 * Generates a portrait prompt for different content types
 */
export function generatePortraitPrompt(
  type: 'character' | 'npc' | 'item',
  data: Record<string, unknown>
): string {
  switch (type) {
    case 'character':
      const personalityTraits = Array.isArray(data.personalityTraits) ? data.personalityTraits.join(', ') : ''
      const quote = typeof data.quote === 'string' ? data.quote : ''
      const name = typeof data.name === 'string' ? data.name : 'Character'
      const race = typeof data.race === 'string' ? data.race : 'human'
      const charClass = typeof data.class === 'string' ? data.class : 'adventurer'
      return `Portrait of ${name}, a ${race} ${charClass}. Professional studio photography, realistic, detailed face, natural lighting. ${personalityTraits}. Quote: "${quote}". High quality portrait.`
    
    case 'npc':
      return generateNPCPortraitPrompt(data)
    
    case 'item':
      return generateItemPortraitPrompt(data)
    
    default:
      return `Professional fantasy portrait, detailed, high quality.`
  }
}

/**
 * Generates a specialized NPC portrait prompt
 */
function generateNPCPortraitPrompt(data: Record<string, unknown>): string {
  const name = typeof data.name === 'string' ? data.name : 'NPC'
  const race = typeof data.race === 'string' ? data.race : 'human'
  const role = typeof data.role === 'string' ? data.role : 'villager'
  const personalityTraits = Array.isArray(data.personalityTraits) ? data.personalityTraits.join(', ') : ''
  const motivations = Array.isArray(data.motivations) ? data.motivations.join(', ') : ''
  const quote = typeof data.quote === 'string' ? data.quote : ''
  
  // Create role-specific prompts
  let rolePrompt = ''
  switch (role.toLowerCase()) {
    case 'merchant':
    case 'shopkeeper':
    case 'trader':
      rolePrompt = 'dressed in fine merchant robes, confident expression, professional appearance'
      break
    case 'guard':
    case 'soldier':
    case 'warrior':
      rolePrompt = 'wearing armor, stern expression, battle-worn, authoritative stance'
      break
    case 'wizard':
    case 'mage':
    case 'sorcerer':
      rolePrompt = 'wearing flowing robes, mystical aura, wise expression, magical symbols'
      break
    case 'rogue':
    case 'thief':
    case 'assassin':
      rolePrompt = 'wearing dark leather armor, mysterious expression, stealthy appearance'
      break
    case 'noble':
    case 'lord':
    case 'lady':
      rolePrompt = 'wearing elegant noble attire, refined expression, aristocratic bearing'
      break
    case 'peasant':
    case 'farmer':
    case 'villager':
      rolePrompt = 'wearing simple clothes, weathered expression, humble appearance'
      break
    case 'priest':
    case 'cleric':
    case 'paladin':
      rolePrompt = 'wearing religious vestments, pious expression, divine aura'
      break
    default:
      rolePrompt = 'wearing appropriate attire for their role, determined expression'
  }
  
  return `Single-subject portrait of ${name}, a ${race} ${role}. ${rolePrompt}. Solo character only, no other people, centered composition, head-and-shoulders framing. Professional studio photography, realistic, detailed face, natural lighting. Personality: ${personalityTraits}. Motivations: ${motivations}. Quote: "${quote}". High quality portrait, fantasy art style, detailed features.`
}

/**
 * Generates a specialized item portrait prompt
 */
function generateItemPortraitPrompt(data: Record<string, unknown>): string {
  const name = typeof data.name === 'string' ? data.name : 'Item'
  const rarity = typeof data.rarity === 'string' ? data.rarity : 'common'
  const itemType = typeof data.itemType === 'string' ? data.itemType : 'weapon'
  const magicalEffects = Array.isArray(data.magicalEffects) ? data.magicalEffects.join(', ') : ''
  const quote = typeof data.quote === 'string' ? data.quote : ''
  
  // Create rarity-specific styling
  let rarityStyle = ''
  switch (rarity.toLowerCase()) {
    case 'common':
      rarityStyle = 'simple design, basic materials, functional appearance'
      break
    case 'uncommon':
      rarityStyle = 'quality craftsmanship, fine materials, subtle enchantments'
      break
    case 'rare':
      rarityStyle = 'exquisite craftsmanship, precious materials, visible magical aura'
      break
    case 'very rare':
      rarityStyle = 'masterwork quality, rare materials, strong magical glow, intricate details'
      break
    case 'legendary':
      rarityStyle = 'divine craftsmanship, legendary materials, powerful magical effects, awe-inspiring appearance'
      break
    default:
      rarityStyle = 'well-crafted, magical appearance'
  }
  
  // Create item type-specific prompts
  let typePrompt = ''
  switch (itemType.toLowerCase()) {
    case 'sword':
    case 'weapon':
      typePrompt = 'beautifully crafted blade, ornate hilt, sharp edge, battle-ready'
      break
    case 'armor':
    case 'shield':
      typePrompt = 'protective gear, sturdy construction, defensive design, well-fitted'
      break
    case 'staff':
    case 'wand':
      typePrompt = 'magical implement, enchanted wood, mystical symbols, arcane power'
      break
    case 'ring':
    case 'necklace':
    case 'jewelry':
      typePrompt = 'precious metal, gemstone setting, elegant design, wearable art'
      break
    case 'potion':
    case 'elixir':
      typePrompt = 'mystical liquid, glowing contents, ornate bottle, magical properties'
      break
    case 'scroll':
    case 'book':
      typePrompt = 'ancient parchment, magical runes, preserved condition, arcane knowledge'
      break
    case 'artifact':
      typePrompt = 'ancient relic, divine power, mysterious origins, legendary status'
      break
    default:
      typePrompt = 'well-crafted item, magical properties, fine materials'
  }
  
  return `Product photo of ${name}, a ${rarity} ${itemType}. ${typePrompt}. ${rarityStyle}. Magical effects: ${magicalEffects}. Quote: "${quote}". Professional product photography, detailed craftsmanship, studio lighting, high quality, fantasy art style, intricate details, magical glow.`
}

/**
 * Validates if an image URL is accessible
 */
export async function validateImageUrl(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    console.error('Error validating image URL:', error)
    return false
  }
}

/**
 * Cleans up expired images (for auto-saved content)
 */
export async function cleanupExpiredImages(): Promise<number> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const now = new Date()
    
    // Find all content with expired auto-saved images
    const results = await Promise.all([
      prisma.character.findMany({
        where: {
          autoSave: true,
          expiresAt: { lt: now },
          portrait: { not: null }
        }
      }),
      prisma.nPC.findMany({
        where: {
          autoSave: true,
          expiresAt: { lt: now },
          portrait: { not: null }
        }
      }),
      prisma.item.findMany({
        where: {
          autoSave: true,
          expiresAt: { lt: now },
          portrait: { not: null }
        }
      }),
      prisma.world.findMany({
        where: {
          autoSave: true,
          expiresAt: { lt: now },
          portrait: { not: null }
        }
      }),
      prisma.quest.findMany({
        where: {
          autoSave: true,
          expiresAt: { lt: now },
          portrait: { not: null }
        }
      }),
      prisma.encounter.findMany({
        where: {
          autoSave: true,
          expiresAt: { lt: now },
          portrait: { not: null }
        }
      }),
      prisma.campaign.findMany({
        where: {
          autoSave: true,
          expiresAt: { lt: now },
          portrait: { not: null }
        }
      })
    ])
    
    // Clear portrait URLs for expired content
    const totalCleared = results.reduce((sum, items) => sum + items.length, 0)
    
    await Promise.all([
      prisma.character.updateMany({
        where: {
          autoSave: true,
          expiresAt: { lt: now },
          portrait: { not: null }
        },
        data: { portrait: null }
      }),
      prisma.nPC.updateMany({
        where: {
          autoSave: true,
          expiresAt: { lt: now },
          portrait: { not: null }
        },
        data: { portrait: null }
      }),
      prisma.item.updateMany({
        where: {
          autoSave: true,
          expiresAt: { lt: now },
          portrait: { not: null }
        },
        data: { portrait: null }
      }),
      prisma.world.updateMany({
        where: {
          autoSave: true,
          expiresAt: { lt: now },
          portrait: { not: null }
        },
        data: { portrait: null }
      }),
      prisma.quest.updateMany({
        where: {
          autoSave: true,
          expiresAt: { lt: now },
          portrait: { not: null }
        },
        data: { portrait: null }
      }),
      prisma.encounter.updateMany({
        where: {
          autoSave: true,
          expiresAt: { lt: now },
          portrait: { not: null }
        },
        data: { portrait: null }
      }),
      prisma.campaign.updateMany({
        where: {
          autoSave: true,
          expiresAt: { lt: now },
          portrait: { not: null }
        },
        data: { portrait: null }
      })
    ])
    
    console.log(`Cleaned up ${totalCleared} expired images`)
    return totalCleared
  } catch (error) {
    console.error('Error cleaning up expired images:', error)
    throw error
  }
} 