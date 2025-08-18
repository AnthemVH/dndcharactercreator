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
    const { id: questId } = await params

    const { error } = await supabaseAdmin
      .from('quests')
      .delete()
      .eq('id', questId)
      .eq('user_id', userId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Quest delete error:', error)
    return NextResponse.json({ error: 'Failed to delete quest' }, { status: 500 })
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
    const { id: questId } = await params

    const { data: quest, error } = await supabaseAdmin
      .from('quests')
      .select('*')
      .eq('id', questId)
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error

    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
    }

    const merged = {
      ...(quest as any).data,
      ...(quest as any),
      portrait: (quest as any).portrait_url || (quest as any).data?.portrait || (quest as any).data?.portrait_url,
    }
    return NextResponse.json(merged)
  } catch (error) {
    console.error('Quest fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch quest' }, { status: 500 })
  }
} 