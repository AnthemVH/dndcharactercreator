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
    const { id: questId } = await params

    // Delete the quest
    await prisma.quest.delete({
      where: {
        id: questId,
        userId: userId // Ensure user owns the quest
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Quest delete error:', error)
    return NextResponse.json({ error: 'Failed to delete quest' }, { status: 500 })
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
    const { id: questId } = await params

    // Get the quest
    const quest = await prisma.quest.findFirst({
      where: {
        id: questId,
        userId: userId
      }
    })

    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
    }

    return NextResponse.json(quest)
  } catch (error) {
    console.error('Quest fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch quest' }, { status: 500 })
  }
} 