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
    const { id: encounterId } = await params

    // Delete the encounter
    await prisma.encounter.delete({
      where: {
        id: encounterId,
        userId: userId // Ensure user owns the encounter
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Encounter delete error:', error)
    return NextResponse.json({ error: 'Failed to delete encounter' }, { status: 500 })
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
    const { id: encounterId } = await params

    // Get the encounter
    const encounter = await prisma.encounter.findFirst({
      where: {
        id: encounterId,
        userId: userId
      }
    })

    if (!encounter) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 })
    }

    return NextResponse.json(encounter)
  } catch (error) {
    console.error('Encounter fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch encounter' }, { status: 500 })
  }
} 