import { supabaseAdmin } from '@/lib/supabase'
import { cleanupExpiredImages } from './image-storage'

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
    expiresAt.setDate(expiresAt.getDate() + 30)

    const commonData = {
      user_id: userId,
      auto_save: true,
      expires_at: expiresAt.toISOString(),
      data,
    }

    const insert = async (table: string, row: Record<string, any>) => {
      const { data: inserted, error } = await supabaseAdmin
        .from(table)
        .insert(row)
        .select('*')
        .single()
      if (error) throw error
      return inserted
    }

    switch (type) {
      case 'character':
        return await insert('characters', {
          ...commonData,
          name: data.name,
          race: data.race,
          class: data.class,
          level: data.level ?? 1,
          portrait_url: data.portraitUrl ?? null,
        })
      case 'npc':
        return await insert('npcs', {
          ...commonData,
          name: data.name,
          race: data.race,
          role: data.role,
          portrait_url: data.portraitUrl ?? null,
        })
      case 'world':
        return await insert('worlds', {
          ...commonData,
          name: data.name,
          theme: data.theme,
          land_name: data.landName,
        })
      case 'item':
        return await insert('items', {
          ...commonData,
          name: data.name,
          item_type: data.itemType,
          theme: data.theme,
          rarity: data.rarity,
        })
      case 'quest':
        return await insert('quests', {
          ...commonData,
          title: data.title,
        })
      case 'encounter':
        return await insert('encounters', {
          ...commonData,
          name: data.name,
        })
      case 'campaign':
        return await insert('campaigns', {
          ...commonData,
          name: data.name,
          description: data.description,
          character_slots: data.characterSlots,
          status: data.status ?? 'active',
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
    const nowIso = new Date().toISOString()

    const countDeleted = async (table: string) => {
      const { data, error, count } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('auto_save', true)
        .lt('expires_at', nowIso)
        .select('*', { count: 'exact' })
      if (error) throw error
      return count ?? (data?.length ?? 0)
    }

    const counts = await Promise.all([
      countDeleted('characters'),
      countDeleted('npcs'),
      countDeleted('worlds'),
      countDeleted('items'),
      countDeleted('quests'),
      countDeleted('encounters'),
      countDeleted('campaigns'),
    ])

    const totalDeleted = counts.reduce((a, b) => a + b, 0)
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
    const tableMap: Record<string, string> = {
      characters: 'characters',
      npcs: 'npcs',
      worlds: 'worlds',
      items: 'items',
      quests: 'quests',
      encounters: 'encounters',
      campaigns: 'campaigns',
    }
    const table = tableMap[type]
    if (!table) throw new Error(`Unknown content type: ${type}`)

    const { data, error } = await supabaseAdmin
      .from(table)
      .update({ auto_save: false, expires_at: null })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  } catch (error) {
    console.error('Convert to permanent error:', error)
    throw error
  }
} 