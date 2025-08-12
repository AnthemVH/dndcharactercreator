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
    const { id: worldId } = await params

    // Delete the world
    await prisma.world.delete({
      where: {
        id: worldId,
        userId: userId // Ensure user owns the world
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('World delete error:', error)
    return NextResponse.json({ error: 'Failed to delete world' }, { status: 500 })
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
    const { id: worldId } = await params

    // Get the world
    const world = await prisma.world.findFirst({
      where: {
        id: worldId,
        userId: userId
      }
    })

    if (!world) {
      return NextResponse.json({ error: 'World not found' }, { status: 404 })
    }

    return NextResponse.json(world)
  } catch (error) {
    console.error('World fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch world' }, { status: 500 })
  }
} 