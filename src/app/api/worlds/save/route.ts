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
    const { world } = body

    if (!world) {
      return NextResponse.json({ error: 'No world data provided' }, { status: 400 })
    }

    // Save the world to the database
    try {
      const savedWorld = await autoSaveContent({
        type: 'world',
        data: world,
        userId: payload.userId
      })
      
      console.log('World saved successfully')
      return NextResponse.json({ 
        success: true,
        world: savedWorld
      })
      
    } catch (autoSaveError) {
      console.error('Auto-save error:', autoSaveError)
      return NextResponse.json(
        { error: 'Failed to save world. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('World save error:', error)
    return NextResponse.json(
      { error: 'Failed to save world. Please try again.' },
      { status: 500 }
    )
  }
} 