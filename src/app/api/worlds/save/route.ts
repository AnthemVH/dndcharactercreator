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
    const { world } = body

    if (!world) {
      return NextResponse.json({ error: 'No world data provided' }, { status: 400 })
    }

    // Use single-instance content manager
    try {
      console.log('Saving world with data:', {
        name: world.name,
        type: world.type,
        theme: world.theme
      })
      
      const saveResult = await saveContentSingleInstance({
        type: 'world',
        data: world,
        userId: payload.userId
      })
      
      console.log('World saved with result:', saveResult)
      
      return NextResponse.json({
        id: saveResult.id,
        isNew: saveResult.isNew,
        autoSave: saveResult.autoSave,
        message: saveResult.isNew ? 'World saved successfully' : 'World updated successfully'
      })
      
    } catch (saveError) {
      console.error('World save error:', saveError)
      return NextResponse.json({ error: 'Failed to save world' }, { status: 500 })
    }
    
  } catch (error) {
    console.error('World save route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 