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
    const { id: worldId } = await params

    const { error } = await supabaseAdmin
      .from('worlds')
      .delete()
      .eq('id', worldId)
      .eq('user_id', userId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('World delete error:', error)
    return NextResponse.json({ error: 'Failed to delete world' }, { status: 500 })
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
    const { id: worldId } = await params

    const { data: world, error } = await supabaseAdmin
      .from('worlds')
      .select('*')
      .eq('id', worldId)
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error

    if (!world) {
      return NextResponse.json({ error: 'World not found' }, { status: 404 })
    }

    const merged = {
      ...(world as any).data,
      ...(world as any),
      portrait: (world as any).portrait_url || (world as any).data?.portrait || (world as any).data?.portrait_url,
    }
    return NextResponse.json(merged)
  } catch (error) {
    console.error('World fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch world' }, { status: 500 })
  }
} 