import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

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
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Supabase error (campaigns GET):', error)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }
    const campaigns = (data || []).map((row: any) => ({
      ...row.data,
      ...row,
      portrait: row.portrait_url || row.data?.portrait || row.data?.portrait_url,
    }))
    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Campaigns fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

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
    const userId = payload.userId
    const campaignData = await request.json()
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .insert({
        user_id: userId,
        name: campaignData.name,
        description: campaignData.description ?? null,
        character_slots: campaignData.characterSlots ?? 4,
        status: campaignData.status ?? 'active',
        data: campaignData,
      })
      .select('*')
      .single()
    if (error) {
      console.error('Supabase error (campaigns POST):', error)
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }
    return NextResponse.json({ campaign: data })
  } catch (error) {
    console.error('Campaign creation error:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
} 