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
    const { id: characterId } = await params

    const { error } = await supabaseAdmin
      .from('characters')
      .delete()
      .eq('id', characterId)
      .eq('user_id', userId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Character delete error:', error)
    return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 })
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

    const userId = payload.userId
    const { id: characterId } = await params

    const { data: character, error } = await supabaseAdmin
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    // Merge JSONB data with row and normalize portrait so the viewer gets everything
    const merged = {
      ...(character as any).data,
      ...(character as any),
      portrait: (character as any).portrait_url || (character as any).data?.portrait || (character as any).data?.portrait_url,
    }
    return NextResponse.json(merged)
  } catch (error) {
    console.error('Character fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch character' }, { status: 500 })
  }
} 