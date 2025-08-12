import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const userId = payload.userId

    // Get counts for all content types
    const [characters, npcs, worlds, quests, campaigns] = await Promise.all([
      prisma.character.count({ where: { userId } }),
      prisma.nPC.count({ where: { userId } }),
      prisma.world.count({ where: { userId } }),
      prisma.quest.count({ where: { userId } }),
      prisma.campaign.count({ where: { userId } })
    ])

    return NextResponse.json({
      characters,
      npcs,
      worlds,
      quests,
      campaigns
    })
  } catch (error) {
    console.error('Dashboard counts error:', error)
    return NextResponse.json({ error: 'Failed to get counts' }, { status: 500 })
  }
} 