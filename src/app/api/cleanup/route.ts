import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredContent } from '@/lib/auto-save'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check for admin users
    // const token = request.headers.get('authorization')?.replace('Bearer ', '')
    // if (!token || !isAdmin(token)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const deletedCount = await cleanupExpiredContent()
    
    return NextResponse.json({ 
      success: true, 
      deletedCount,
      message: `Cleaned up ${deletedCount} expired auto-saved items`
    })
  } catch (error) {
    console.error('Cleanup API error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup expired content' },
      { status: 500 }
    )
  }
} 