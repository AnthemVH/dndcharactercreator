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
    const { id } = await params

    // Delete the NPC
    await prisma.nPC.delete({
      where: {
        id: id,
        userId: userId // Ensure user owns the NPC
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('NPC delete error:', error)
    return NextResponse.json({ error: 'Failed to delete NPC' }, { status: 500 })
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

    const { id } = await params
    const npc = await prisma.nPC.findFirst({
      where: { 
        id: id,
        userId: payload.userId 
      }
    })

    if (!npc) {
      return NextResponse.json({ error: 'NPC not found' }, { status: 404 })
    }

    return NextResponse.json({ npc })
  } catch (error) {
    console.error('NPC fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch NPC' }, { status: 500 })
  }
} 