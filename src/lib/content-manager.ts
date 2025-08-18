import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export interface ContentItem {
  id?: string
  type: 'character' | 'npc' | 'item' | 'quest' | 'encounter' | 'world' | 'campaign'
  data: Record<string, any>
  userId: string
}

export interface SaveResult {
  id: string
  isNew: boolean
  autoSave: boolean
}

/**
 * Single-instance content manager that prevents duplicates
 * If content exists (by matching key fields), it updates the existing record
 * If content doesn't exist, it creates a new record
 */
export async function saveContentSingleInstance({ type, data, userId }: ContentItem): Promise<SaveResult> {
  try {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.')
    }

    const commonData = {
      user_id: userId,
      data,
      updated_at: new Date().toISOString(),
    }

    // Try to find existing content by matching key fields
    let existingContent = null
    
    switch (type) {
      case 'character':
        existingContent = await findExistingCharacter(data, userId)
        break
      case 'npc':
        existingContent = await findExistingNpc(data, userId)
        break
      case 'world':
        existingContent = await findExistingWorld(data, userId)
        break
      case 'item':
        existingContent = await findExistingItem(data, userId)
        break
      case 'quest':
        existingContent = await findExistingQuest(data, userId)
        break
      case 'encounter':
        existingContent = await findExistingEncounter(data, userId)
        break
      case 'campaign':
        existingContent = await findExistingCampaign(data, userId)
        break
      default:
        throw new Error(`Unknown content type: ${type}`)
    }

    if (existingContent) {
      // Update existing content
      const { data: updated, error } = await supabaseAdmin
        .from(getTableName(type))
        .update({
          ...commonData,
          ...getTypeSpecificData(type, data),
        })
        .eq('id', existingContent.id)
        .eq('user_id', userId)
        .select('*')
        .single()

      if (error) throw error
      
      return {
        id: updated.id,
        isNew: false,
        autoSave: updated.auto_save
      }
    } else {
      // Create new content
      const { data: created, error } = await supabaseAdmin
        .from(getTableName(type))
        .insert({
          ...commonData,
          ...getTypeSpecificData(type, data),
          auto_save: true,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single()

      if (error) throw error
      
      return {
        id: created.id,
        isNew: true,
        autoSave: true
      }
    }
  } catch (error) {
    console.error('Content save error:', error)
    throw error
  }
}

/**
 * Convert temporary content to permanent (removes auto_save flag and expiration)
 */
export async function makeContentPermanent(id: string, type: string, userId: string): Promise<void> {
  try {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.')
    }

    const table = getTableName(type)
    if (!table) throw new Error(`Unknown content type: ${type}`)

    console.log(`Making content permanent: type=${type}, table=${table}, id=${id}, userId=${userId}`)

    const { error } = await supabaseAdmin
      .from(table)
      .update({
        auto_save: false,
        expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error(`Supabase error for table ${table}:`, error)
      throw error
    }

    console.log(`Successfully made content permanent in table ${table}`)
  } catch (error) {
    console.error('Make permanent error:', error)
    throw error
  }
}

// Helper functions for finding existing content
async function findExistingCharacter(data: any, userId: string) {
  const { data: existing } = await supabaseAdmin
    .from('characters')
    .select('id, auto_save')
    .eq('user_id', userId)
    .eq('name', data.name)
    .eq('race', data.race)
    .eq('class', data.class)
    .single()
  return existing
}

async function findExistingNpc(data: any, userId: string) {
  const { data: existing } = await supabaseAdmin
    .from('npcs')
    .select('id, auto_save')
    .eq('user_id', userId)
    .eq('name', data.name)
    .eq('race', data.race)
    .single()
  return existing
}

async function findExistingWorld(data: any, userId: string) {
  const { data: existing } = await supabaseAdmin
    .from('worlds')
    .select('id, auto_save')
    .eq('user_id', userId)
    .eq('name', data.name)
    .eq('theme', data.theme)
    .single()
  return existing
}

async function findExistingItem(data: any, userId: string) {
  const { data: existing } = await supabaseAdmin
    .from('items')
    .select('id, auto_save')
    .eq('user_id', userId)
    .eq('name', data.name)
    .eq('item_type', data.itemType)
    .single()
  return existing
}

async function findExistingQuest(data: any, userId: string) {
  const { data: existing } = await supabaseAdmin
    .from('quests')
    .select('id, auto_save')
    .eq('user_id', userId)
    .eq('title', data.title)
    .single()
  return existing
}

async function findExistingEncounter(data: any, userId: string) {
  const { data: existing } = await supabaseAdmin
    .from('encounters')
    .select('id, auto_save')
    .eq('user_id', userId)
    .eq('name', data.name)
    .single()
  return existing
}

async function findExistingCampaign(data: any, userId: string) {
  const { data: existing } = await supabaseAdmin
    .from('campaigns')
    .select('id, auto_save')
    .eq('user_id', userId)
    .eq('name', data.name)
    .single()
  return existing
}

function getTableName(type: string): string {
  // Handle both singular and plural types
  const tableMap: Record<string, string> = {
    // Singular types
    character: 'characters',
    npc: 'npcs',
    world: 'worlds',
    item: 'items',
    quest: 'quests',
    encounter: 'encounters',
    campaign: 'campaigns',
    // Plural types (direct mapping)
    characters: 'characters',
    npcs: 'npcs',
    worlds: 'worlds',
    items: 'items',
    quests: 'quests',
    encounters: 'encounters',
    campaigns: 'campaigns',
  }
  return tableMap[type] || type
}

function getTypeSpecificData(type: string, data: any) {
  switch (type) {
    case 'character':
      return {
        name: data.name,
        race: data.race,
        class: data.class,
        level: data.level ?? 1,
        portrait_url: data.portraitUrl ?? data.portrait ?? null,
      }
    case 'npc':
      return {
        name: data.name,
        race: data.race,
        role: data.role,
        portrait_url: data.portraitUrl ?? data.portrait ?? null,
      }
    case 'world':
      return {
        name: data.name,
        theme: data.theme,
        land_name: data.landName,
      }
    case 'item':
      return {
        name: data.name,
        item_type: data.itemType,
        theme: data.theme,
        rarity: data.rarity,
      }
    case 'quest':
      return {
        title: data.title,
      }
    case 'encounter':
      return {
        name: data.name,
      }
    case 'campaign':
      return {
        name: data.name,
        description: data.description,
        character_slots: data.characterSlots,
        status: data.status ?? 'active',
      }
    default:
      return {}
  }
}
