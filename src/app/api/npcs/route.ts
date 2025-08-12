import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const npcs = await prisma.nPC.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ npcs })
  } catch (error) {
    console.error('Error loading NPCs:', error)
    return NextResponse.json({ error: 'Failed to load NPCs' }, { status: 500 })
  }
} 