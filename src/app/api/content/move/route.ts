import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { itemId, itemType, campaignId } = await request.json()
    const userId = payload.userId

    const tableMap: Record<string, string> = {
      character: 'characters',
      characters: 'characters',
      npc: 'npcs',
      npcs: 'npcs',
      world: 'worlds',
      worlds: 'worlds',
      item: 'items',
      items: 'items',
      quest: 'quests',
      quests: 'quests',
      encounter: 'encounters',
      encounters: 'encounters',
    }
    const table = tableMap[itemType]
    if (!table) {
      return NextResponse.json({ error: 'Invalid item type' }, { status: 400 })
    }

    // Ensure the row exists and belongs to the user
    const { data: existing, error: findErr } = await supabaseAdmin
      .from(table)
      .select('id,user_id')
      .eq('id', itemId)
      .eq('user_id', userId)
      .single()
    if (findErr) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const { error: updErr } = await supabaseAdmin
      .from(table)
      .update({ campaign_id: campaignId })
      .eq('id', itemId)
      .eq('user_id', userId)
    if (updErr) throw updErr

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Move item error:', error)
    return NextResponse.json({ error: 'Failed to move item' }, { status: 500 })
  }
} 