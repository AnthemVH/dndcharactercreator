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
    const { encounter } = body

    if (!encounter) {
      return NextResponse.json({ error: 'No encounter data provided' }, { status: 400 })
    }

    // Use single-instance content manager
    try {
      console.log('Saving encounter with data:', {
        name: encounter.name,
        type: encounter.type,
        difficulty: encounter.difficulty
      })
      
      const saveResult = await saveContentSingleInstance({
        type: 'encounter',
        data: encounter,
        userId: payload.userId
      })
      
      console.log('Encounter saved with result:', saveResult)
      
      return NextResponse.json({
        id: saveResult.id,
        isNew: saveResult.isNew,
        autoSave: saveResult.autoSave,
        message: saveResult.isNew ? 'Encounter saved successfully' : 'Encounter updated successfully'
      })
      
    } catch (saveError) {
      console.error('Encounter save error:', saveError)
      return NextResponse.json({ error: 'Failed to save encounter' }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Encounter save route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 