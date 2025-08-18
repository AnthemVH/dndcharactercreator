import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { saveContentSingleInstance } from '@/lib/content-manager'
import { saveImageToDatabase } from '@/lib/image-storage'

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
    const { npc } = body

    if (!npc) {
      return NextResponse.json({ error: 'No NPC data provided' }, { status: 400 })
    }

    // Use single-instance content manager
    try {
      console.log('Saving NPC with data:', {
        name: npc.name,
        hasPortrait: !!npc.portrait,
        hasPortraitUrl: !!npc.portraitUrl,
        portrait: npc.portrait,
        portraitUrl: npc.portraitUrl
      })
      
      const saveResult = await saveContentSingleInstance({
        type: 'npc',
        data: npc,
        userId: payload.userId
      })
      
      console.log('NPC saved with result:', saveResult)
      
      // Save the image to the database if it exists
      if (npc.portrait && saveResult.id) {
        try {
          await saveImageToDatabase(
            npc.portrait,
            saveResult.id,
            'npc',
            payload.userId
          )
          console.log('NPC portrait saved to database')
        } catch (imageError) {
          console.error('Failed to save NPC portrait:', imageError)
          // Don't fail the save if image saving fails
        }
      }
      
      return NextResponse.json({
        id: saveResult.id,
        isNew: saveResult.isNew,
        autoSave: saveResult.autoSave,
        message: saveResult.isNew ? 'NPC saved successfully' : 'NPC updated successfully'
      })
      
    } catch (saveError) {
      console.error('NPC save error:', saveError)
      return NextResponse.json({ error: 'Failed to save NPC' }, { status: 500 })
    }
    
  } catch (error) {
    console.error('NPC save route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 