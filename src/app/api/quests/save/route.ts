import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { autoSaveContent } from '@/lib/auto-save'

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
    const { quest } = body

    if (!quest) {
      return NextResponse.json({ error: 'No quest data provided' }, { status: 400 })
    }

    // Save the quest to the database
    try {
      const savedQuest = await autoSaveContent({
        type: 'quest',
        data: quest,
        userId: payload.userId
      })
      
      console.log('Quest saved successfully')
      return NextResponse.json({ 
        success: true,
        quest: savedQuest
      })
      
    } catch (autoSaveError) {
      console.error('Auto-save error:', autoSaveError)
      return NextResponse.json(
        { error: 'Failed to save quest. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Quest save error:', error)
    return NextResponse.json(
      { error: 'Failed to save quest. Please try again.' },
      { status: 500 }
    )
  }
} 