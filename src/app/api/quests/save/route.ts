import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { saveContentSingleInstance } from '@/lib/content-manager'

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

    // Use single-instance content manager
    try {
      console.log('Saving quest with data:', {
        name: quest.name,
        type: quest.type,
        difficulty: quest.difficulty
      })
      
      const saveResult = await saveContentSingleInstance({
        type: 'quest',
        data: quest,
        userId: payload.userId
      })
      
      console.log('Quest saved with result:', saveResult)
      
      return NextResponse.json({
        id: saveResult.id,
        isNew: saveResult.isNew,
        autoSave: saveResult.autoSave,
        message: saveResult.isNew ? 'Quest saved successfully' : 'Quest updated successfully'
      })
      
    } catch (saveError) {
      console.error('Quest save error:', saveError)
      return NextResponse.json({ error: 'Failed to save quest' }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Quest save route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 