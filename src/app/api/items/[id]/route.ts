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
    const { id: itemId } = await params

    const { error } = await supabaseAdmin
      .from('items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Item delete error:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
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
    const { id: itemId } = await params

    const { data: item, error } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('id', itemId)
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const merged = {
      ...(item as any).data,
      ...(item as any),
      portrait: (item as any).portrait_url || (item as any).data?.portrait || (item as any).data?.portrait_url,
    }
    return NextResponse.json(merged)
  } catch (error) {
    console.error('Item fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 })
  }
} 