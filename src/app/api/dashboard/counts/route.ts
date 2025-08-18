import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.userId

    const count = async (table: string) => {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
      if (error) throw error
      return count ?? 0
    }

    const [characters, npcs, worlds, quests, campaigns] = await Promise.all([
      count('characters'),
      count('npcs'),
      count('worlds'),
      count('quests'),
      count('campaigns'),
    ])

    return NextResponse.json({
      characters,
      npcs,
      worlds,
      quests,
      campaigns
    })
  } catch (error) {
    console.error('Dashboard counts error:', error)
    return NextResponse.json({ error: 'Failed to get counts' }, { status: 500 })
  }
} 