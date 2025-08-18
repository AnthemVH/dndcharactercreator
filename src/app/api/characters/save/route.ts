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
    const { character } = body

    if (!character) {
      return NextResponse.json({ error: 'No character data provided' }, { status: 400 })
    }

    // Use single-instance content manager
    try {
      console.log('Saving character with data:', {
        name: character.name,
        hasPortrait: !!character.portrait,
        hasPortraitUrl: !!character.portraitUrl,
        portrait: character.portrait,
        portraitUrl: character.portraitUrl
      })
      
      const saveResult = await saveContentSingleInstance({
        type: 'character',
        data: character,
        userId: payload.userId
      })
      
      console.log('Character saved with result:', saveResult)
      
      // Save the image to the database if it exists
      if (character.portrait && saveResult.id) {
        try {
          await saveImageToDatabase(
            character.portrait,
            saveResult.id,
            'character',
            payload.userId
          )
          console.log('Character portrait saved to database')
        } catch (imageError) {
          console.error('Failed to save character portrait:', imageError)
          // Don't fail the save if image saving fails
        }
      }
      
      return NextResponse.json({
        id: saveResult.id,
        isNew: saveResult.isNew,
        autoSave: saveResult.autoSave,
        message: saveResult.isNew ? 'Character saved successfully' : 'Character updated successfully'
      })
      
    } catch (saveError) {
      console.error('Character save error:', saveError)
      return NextResponse.json({ error: 'Failed to save character' }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Character save route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 