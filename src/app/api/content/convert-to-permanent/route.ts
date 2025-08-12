import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { convertToPermanent } from '@/lib/auto-save'

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
    const { type, id } = body

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and ID are required' },
        { status: 400 }
      )
    }

    // Convert the content to permanent
    await convertToPermanent(id, type)
    
    return NextResponse.json({ 
      success: true,
      message: 'Content converted to permanent successfully'
    })
  } catch (error) {
    console.error('Convert to permanent error:', error)
    return NextResponse.json(
      { error: 'Failed to convert content to permanent' },
      { status: 500 }
    )
  }
} 