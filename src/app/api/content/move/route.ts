import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { itemId, itemType, campaignId } = await request.json()
    const userId = payload.userId

    let item: unknown

    // Find the item based on type (handle both singular and plural)
    switch (itemType) {
      case 'character':
      case 'characters':
        item = await prisma.character.findFirst({
          where: { id: itemId, userId }
        })
        break
      case 'npc':
      case 'npcs':
        item = await prisma.NPC.findFirst({
          where: { id: itemId, userId }
        })
        break
      case 'world':
      case 'worlds':
        item = await prisma.world.findFirst({
          where: { id: itemId, userId }
        })
        break
      case 'item':
      case 'items':
        item = await prisma.item.findFirst({
          where: { id: itemId, userId }
        })
        break
      case 'quest':
      case 'quests':
        item = await prisma.quest.findFirst({
          where: { id: itemId, userId }
        })
        break
      case 'encounter':
      case 'encounters':
        item = await prisma.encounter.findFirst({
          where: { id: itemId, userId }
        })
        break
      default:
        return NextResponse.json({ error: 'Invalid item type' }, { status: 400 })
    }

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Update the item with campaign ID (handle both singular and plural)
    switch (itemType) {
      case 'character':
      case 'characters':
        await prisma.character.update({
          where: { id: itemId },
          data: { campaignId }
        })
        break
      case 'npc':
      case 'npcs':
        await prisma.NPC.update({
          where: { id: itemId },
          data: { campaignId }
        })
        break
      case 'world':
      case 'worlds':
        await prisma.world.update({
          where: { id: itemId },
          data: { campaignId }
        })
        break
      case 'item':
      case 'items':
        await prisma.item.update({
          where: { id: itemId },
          data: { campaignId }
        })
        break
      case 'quest':
      case 'quests':
        await prisma.quest.update({
          where: { id: itemId },
          data: { campaignId }
        })
        break
      case 'encounter':
      case 'encounters':
        await prisma.encounter.update({
          where: { id: itemId },
          data: { campaignId }
        })
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Move item error:', error)
    return NextResponse.json({ error: 'Failed to move item' }, { status: 500 })
  }
} 