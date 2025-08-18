/*
  One-time importer: Prisma (SQLite dev.db) -> Supabase
  - Upserts by id to avoid duplicates
  - Maps camelCase Prisma fields to snake_case Supabase columns
*/

const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')

const prisma = new PrismaClient()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

async function upsertBatch(table, rows) {
  if (!rows || rows.length === 0) return { count: 0 }
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
  if (error) throw error
  return { count: rows.length }
}

function asISO(d) {
  return d ? new Date(d).toISOString() : null
}

async function importUsers() {
  const users = await prisma.user.findMany()
  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role || 'user',
    tokens: u.tokens ?? 0,
    password: u.password || null,
    created_at: asISO(u.createdAt),
    updated_at: asISO(u.updatedAt),
  }))
  return upsertBatch('users', rows)
}

async function importCharacters() {
  const items = await prisma.character.findMany()
  const rows = items.map((c) => ({
    id: c.id,
    user_id: c.userId,
    campaign_id: c.campaignId || null,
    name: c.name,
    race: c.race || null,
    class: c.class || null,
    level: c.level ?? 1,
    portrait_url: c.portraitUrl || null,
    background: c.background || null,
    alignment: c.alignment || null,
    experience: c.experience ?? null,
    strength: c.strength ?? null,
    dexterity: c.dexterity ?? null,
    constitution: c.constitution ?? null,
    intelligence: c.intelligence ?? null,
    wisdom: c.wisdom ?? null,
    charisma: c.charisma ?? null,
    armor_class: c.armorClass ?? null,
    initiative: c.initiative ?? null,
    speed: c.speed ?? null,
    hit_points: c.hitPoints ?? null,
    hit_dice: c.hitDice || null,
    backstory: c.backstory || null,
    appearance: c.appearance || null,
    personality_traits: c.personalityTraits || null,
    ideals: c.ideals || null,
    bonds: c.bonds || null,
    flaws: c.flaws || null,
    proficiencies: c.proficiencies || null,
    features: c.features || null,
    equipment: c.equipment || null,
    abilities: c.abilities || null,
    spells: c.spells || null,
    auto_save: c.autoSave ?? false,
    expires_at: asISO(c.expiresAt),
    created_at: asISO(c.createdAt),
    updated_at: asISO(c.updatedAt),
    data: c,
  }))
  return upsertBatch('characters', rows)
}

async function importNpcs() {
  const items = await prisma.nPC.findMany()
  const rows = items.map((x) => ({
    id: x.id,
    user_id: x.userId,
    campaign_id: x.campaignId || null,
    name: x.name,
    race: x.race || null,
    role: x.role || null,
    portrait_url: x.portraitUrl || null,
    auto_save: x.autoSave ?? false,
    expires_at: asISO(x.expiresAt),
    created_at: asISO(x.createdAt),
    updated_at: asISO(x.updatedAt),
    data: x,
  }))
  return upsertBatch('npcs', rows)
}

async function importWorlds() {
  const items = await prisma.world.findMany()
  const rows = items.map((x) => ({
    id: x.id,
    user_id: x.userId,
    campaign_id: x.campaignId || null,
    name: x.name,
    theme: x.theme || null,
    land_name: x.landName || null,
    auto_save: x.autoSave ?? false,
    expires_at: asISO(x.expiresAt),
    created_at: asISO(x.createdAt),
    updated_at: asISO(x.updatedAt),
    data: x,
  }))
  return upsertBatch('worlds', rows)
}

async function importItems() {
  const items = await prisma.item.findMany()
  const rows = items.map((x) => ({
    id: x.id,
    user_id: x.userId,
    campaign_id: x.campaignId || null,
    name: x.name,
    item_type: x.itemType || null,
    theme: x.theme || null,
    rarity: x.rarity || null,
    auto_save: x.autoSave ?? false,
    expires_at: asISO(x.expiresAt),
    created_at: asISO(x.createdAt),
    updated_at: asISO(x.updatedAt),
    data: x,
  }))
  return upsertBatch('items', rows)
}

async function importQuests() {
  const items = await prisma.quest.findMany()
  const rows = items.map((x) => ({
    id: x.id,
    user_id: x.userId,
    campaign_id: x.campaignId || null,
    title: x.title,
    quest_type: x.questType || null,
    difficulty: x.difficulty || null,
    description: x.description || null,
    auto_save: x.autoSave ?? false,
    expires_at: asISO(x.expiresAt),
    created_at: asISO(x.createdAt),
    updated_at: asISO(x.updatedAt),
    data: x,
  }))
  return upsertBatch('quests', rows)
}

async function importEncounters() {
  const items = await prisma.encounter.findMany()
  const rows = items.map((x) => ({
    id: x.id,
    user_id: x.userId,
    campaign_id: x.campaignId || null,
    name: x.name || x.title || null,
    encounter_type: x.encounterType || null,
    difficulty: x.difficulty || null,
    auto_save: x.autoSave ?? false,
    expires_at: asISO(x.expiresAt),
    created_at: asISO(x.createdAt),
    updated_at: asISO(x.updatedAt),
    data: x,
  }))
  return upsertBatch('encounters', rows)
}

async function importCampaigns() {
  const items = await prisma.campaign.findMany()
  const rows = items.map((c) => ({
    id: c.id,
    user_id: c.userId,
    name: c.name || 'Untitled Campaign',
    description: c.description || null,
    character_slots: typeof c.characterSlots === 'number' ? c.characterSlots : 4,
    status: c.status || 'active',
    auto_save: c.autoSave ?? false,
    expires_at: asISO(c.expiresAt),
    created_at: asISO(c.createdAt),
    updated_at: asISO(c.updatedAt),
    data: c,
  }))
  return upsertBatch('campaigns', rows)
}

async function importTokenTransactions() {
  const items = await prisma.tokenTransaction.findMany()
  const rows = items.map((t) => ({
    id: t.id,
    user_id: t.userId,
    type: t.type,
    amount: t.amount,
    description: t.description || null,
    timestamp: asISO(t.timestamp),
  }))
  return upsertBatch('token_transactions', rows)
}

async function main() {
  try {
    console.log('Importing users...')
    const u = await importUsers()
    console.log(`Users: ${u.count}`)

    console.log('Importing characters...')
    const ch = await importCharacters()
    console.log(`Characters: ${ch.count}`)

    console.log('Importing npcs...')
    const n = await importNpcs()
    console.log(`NPCs: ${n.count}`)

    console.log('Importing worlds...')
    const w = await importWorlds()
    console.log(`Worlds: ${w.count}`)

    console.log('Importing items...')
    const i = await importItems()
    console.log(`Items: ${i.count}`)

    console.log('Importing quests...')
    const q = await importQuests()
    console.log(`Quests: ${q.count}`)

    console.log('Importing encounters...')
    const e = await importEncounters()
    console.log(`Encounters: ${e.count}`)

    console.log('Importing campaigns...')
    const ca = await importCampaigns()
    console.log(`Campaigns: ${ca.count}`)

    console.log('Importing token transactions...')
    const tt = await importTokenTransactions()
    console.log(`Token transactions: ${tt.count}`)

    console.log('Done.')
  } catch (err) {
    console.error('Import failed:', err)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()


