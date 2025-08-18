import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id: generationId } = await params
    
    const { data: generation, error } = await supabaseAdmin
      .from('generation_statuses')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', payload.userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error

    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: generation.id,
      status: generation.status,
      progress: generation.progress,
      stage: generation.stage,
      estimatedTime: generation.estimated_time,
      result: generation.result,
      error: generation.error,
      createdAt: generation.created_at,
      updatedAt: generation.updated_at
    })
  } catch (error) {
    console.error('Error fetching generation status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch generation status' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id: generationId } = await params
    const body = await request.json()
    const { status, progress, stage, estimatedTime, result, error } = body

    // Update or create generation status
    const { data: generation } = await supabaseAdmin
      .from('generation_statuses')
      .upsert({
        id: generationId,
        user_id: payload.userId,
        status,
        progress,
        stage,
        estimated_time: estimatedTime ?? 0,
        result: result ?? null,
        error: error ?? null,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    return NextResponse.json({
      id: generation.id,
      status: generation.status,
      progress: generation.progress,
      stage: generation.stage,
      estimatedTime: generation.estimated_time,
      result: generation.result ?? null,
      error: generation.error,
      createdAt: generation.created_at,
      updatedAt: generation.updated_at
    })
  } catch (error) {
    console.error('Error updating generation status:', error)
    return NextResponse.json(
      { error: 'Failed to update generation status' },
      { status: 500 }
    )
  }
} 