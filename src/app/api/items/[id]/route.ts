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
    const { id: itemId } = await params

    // Delete the item
    await prisma.item.delete({
      where: {
        id: itemId,
        userId: userId // Ensure user owns the item
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Item delete error:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
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
    const { id: itemId } = await params

    // Get the item
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        userId: userId
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Item fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 })
  }
} 