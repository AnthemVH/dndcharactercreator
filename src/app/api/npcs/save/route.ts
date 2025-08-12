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
    const { npc } = body

    if (!npc) {
      return NextResponse.json({ error: 'No NPC data provided' }, { status: 400 })
    }

    // Save the NPC to the database
    try {
      const savedNPC = await autoSaveContent({
        type: 'npc',
        data: npc,
        userId: payload.userId
      })
      
      // Update with portrait URL if it exists
      if (npc.portraitUrl && savedNPC) {
        await prisma.nPC.update({
          where: { id: savedNPC.id },
          data: { portraitUrl: npc.portraitUrl }
        })
      }
      
      // Save the image to the database if it exists
      if (npc.portrait && savedNPC) {
        try {
          await saveImageToDatabase(
            npc.portrait,
            'npc',
            savedNPC.id,
            payload.userId,
            false // not auto-save
          )
          console.log('NPC image saved to database')
        } catch (imageSaveError) {
          console.error('Image save error:', imageSaveError)
          // Don't fail the save if image save fails
        }
      }
      
      console.log('NPC saved successfully')
      return NextResponse.json({ 
        success: true,
        npc: savedNPC
      })
      
    } catch (autoSaveError) {
      console.error('Auto-save error:', autoSaveError)
      return NextResponse.json(
        { error: 'Failed to save NPC. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('NPC save error:', error)
    return NextResponse.json(
      { error: 'Failed to save NPC. Please try again.' },
      { status: 500 }
    )
  }
} 