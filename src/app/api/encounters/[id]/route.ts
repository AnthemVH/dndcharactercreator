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
    const { id: encounterId } = await params

    const { error } = await supabaseAdmin
      .from('encounters')
      .delete()
      .eq('id', encounterId)
      .eq('user_id', userId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Encounter delete error:', error)
    return NextResponse.json({ error: 'Failed to delete encounter' }, { status: 500 })
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
    const { id: encounterId } = await params

    const { data: encounter, error } = await supabaseAdmin
      .from('encounters')
      .select('*')
      .eq('id', encounterId)
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error

    if (!encounter) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 })
    }

    const merged = {
      ...(encounter as any).data,
      ...(encounter as any),
      portrait: (encounter as any).portrait_url || (encounter as any).data?.portrait || (encounter as any).data?.portrait_url,
    }
    return NextResponse.json(merged)
  } catch (error) {
    console.error('Encounter fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch encounter' }, { status: 500 })
  }
} 