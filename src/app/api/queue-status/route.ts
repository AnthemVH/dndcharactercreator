import { NextRequest, NextResponse } from 'next/server'
import { openRouterQueue } from '@/lib/queue'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get user ID from token
    const token = request.cookies.get('token')?.value
    let userId = null
    let userPosition = 0

    if (token) {
      const payload = await verifyToken(token)
      if (payload) {
        userId = payload.userId
        userPosition = openRouterQueue.getUserPosition(userId)
      }
    }

    const queueInfo = openRouterQueue.getQueueInfo()

    return NextResponse.json({
      queueLength: queueInfo.length,
      isProcessing: queueInfo.processing,
      userPosition: userPosition,
      status: 'Queue system is running',
      queueInfo: queueInfo
    })
  } catch (error) {
    console.error('Queue status error:', error)
    return NextResponse.json(
      { error: 'Failed to get queue status' },
      { status: 500 }
    )
  }
} 