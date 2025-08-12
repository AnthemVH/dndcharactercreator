import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.userId
    const { id: characterId } = await params

    // Delete the character
    await prisma.character.delete({
      where: {
        id: characterId,
        userId: userId // Ensure user owns the character
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Character delete error:', error)
    return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.userId
    const { id: characterId } = await params

    // Get the character
    const character = await prisma.character.findFirst({
      where: {
        id: characterId,
        userId: userId
      }
    })

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    return NextResponse.json(character)
  } catch (error) {
    console.error('Character fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch character' }, { status: 500 })
  }
} 