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

    const { data, error } = await supabaseAdmin
      .from('characters')
      .select('*')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Supabase error (characters):', error)
      return NextResponse.json({ error: 'Failed to load characters' }, { status: 500 })
    }
    const characters = (data || []).map((row: any) => ({
      ...row.data,
      ...row,
      portrait: row.portrait_url || row.data?.portrait || row.data?.portrait_url,
    }))

    return NextResponse.json({ characters })
  } catch (error) {
    console.error('Error loading characters:', error)
    return NextResponse.json({ error: 'Failed to load characters' }, { status: 500 })
  }
} 