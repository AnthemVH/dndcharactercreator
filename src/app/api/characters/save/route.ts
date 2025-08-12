import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { autoSaveContent } from '@/lib/auto-save'
import { saveImageToDatabase } from '@/lib/image-storage'
import { prisma } from '@/lib/prisma'

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

    // Save the character to the database
    try {
      console.log('Saving character with data:', {
        name: character.name,
        hasPortrait: !!character.portrait,
        hasPortraitUrl: !!character.portraitUrl,
        portrait: character.portrait,
        portraitUrl: character.portraitUrl
      })
      
      const savedCharacter = await autoSaveContent({
        type: 'character',
        data: character,
        userId: payload.userId
      })
      
      console.log('Character auto-saved with ID:', savedCharacter.id)
      
      // Update with portrait URL if it exists
      if (character.portraitUrl && savedCharacter) {
        await prisma.character.update({
          where: { id: savedCharacter.id },
          data: { portraitUrl: character.portraitUrl }
        })
        console.log('Updated character with portraitUrl:', character.portraitUrl)
      }
      
      // Save the image to the database if it exists
      if (character.portrait && savedCharacter) {
        try {
          await saveImageToDatabase(
            character.portrait,
            'character',
            savedCharacter.id,
            payload.userId,
            false // not auto-save
          )
          console.log('Character image saved to database')
        } catch (imageSaveError) {
          console.error('Image save error:', imageSaveError)
          // Don't fail the save if image save fails
        }
      }
      
      console.log('Character saved successfully')
      return NextResponse.json({ 
        success: true,
        character: savedCharacter
      })
      
    } catch (autoSaveError) {
      console.error('Auto-save error:', autoSaveError)
      return NextResponse.json(
        { error: 'Failed to save character. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Character save error:', error)
    return NextResponse.json(
      { error: 'Failed to save character. Please try again.' },
      { status: 500 }
    )
  }
} 