import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params

    const { error } = await supabaseAdmin
      .from('npcs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('NPC delete error:', error)
    return NextResponse.json({ error: 'Failed to delete NPC' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params
    const { data: npc, error } = await supabaseAdmin
      .from('npcs')
      .select('*')
      .eq('id', id)
      .eq('user_id', payload.userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error

    if (!npc) {
      return NextResponse.json({ error: 'NPC not found' }, { status: 404 })
    }

    const merged = {
      ...(npc as any).data,
      ...(npc as any),
      portrait: (npc as any).portrait_url || (npc as any).data?.portrait || (npc as any).data?.portrait_url,
    }
    return NextResponse.json(merged)
  } catch (error) {
    console.error('NPC fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch NPC' }, { status: 500 })
  }
} 