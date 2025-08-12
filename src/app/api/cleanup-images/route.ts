import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cleanupExpiredImages } from '@/lib/image-storage'

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

    // Only allow admins to trigger cleanup
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const deletedCount = await cleanupExpiredImages()
    
    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} expired images`
    })
  } catch (error) {
    console.error('Image cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup images' },
      { status: 500 }
    )
  }
} 