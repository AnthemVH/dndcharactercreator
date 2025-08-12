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
    const { encounter } = body

    if (!encounter) {
      return NextResponse.json({ error: 'No encounter data provided' }, { status: 400 })
    }

    // Save the encounter to the database
    try {
      const savedEncounter = await autoSaveContent({
        type: 'encounter',
        data: encounter,
        userId: payload.userId
      })
      
      console.log('Encounter saved successfully')
      return NextResponse.json({ 
        success: true,
        encounter: savedEncounter
      })
      
    } catch (autoSaveError) {
      console.error('Auto-save error:', autoSaveError)
      return NextResponse.json(
        { error: 'Failed to save encounter. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Encounter save error:', error)
    return NextResponse.json(
      { error: 'Failed to save encounter. Please try again.' },
      { status: 500 }
    )
  }
} 