import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUserTokens } from '@/lib/tokens'

export async function GET(request: NextRequest) {
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

    // Get user's token balance
    const tokens = await getUserTokens(payload.userId)

    return NextResponse.json({
      tokens: tokens,
      userId: payload.userId
    })
  } catch (error) {
    console.error('Token balance error:', error)
    return NextResponse.json(
      { error: 'Failed to get token balance' },
      { status: 500 }
    )
  }
} 