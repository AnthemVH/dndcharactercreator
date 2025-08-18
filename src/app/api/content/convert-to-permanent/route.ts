import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { makeContentPermanent } from '@/lib/content-manager'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { id, type } = body

    console.log('Convert to permanent request:', { id, type, userId: payload.userId })

    if (!id || !type) {
      return NextResponse.json({ error: 'Missing id or type' }, { status: 400 })
    }

    // Use the new content manager
    await makeContentPermanent(id, type, payload.userId)

    return NextResponse.json({ 
      success: true, 
      message: 'Content converted to permanent successfully' 
    })
    
  } catch (error) {
    console.error('Convert to permanent error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to convert content to permanent' },
      { status: 500 }
    )
  }
} 