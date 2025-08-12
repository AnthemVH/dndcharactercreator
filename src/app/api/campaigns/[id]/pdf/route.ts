import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { id: campaignId } = await params

    // Get the campaign with all related content
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId: userId
      },
      include: {
        campaignCharacters: true,
        campaignNpcs: true,
        campaignWorlds: true,
        campaignItems: true,
        campaignQuests: true,
        campaignEncounters: true
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // For now, return a simple JSON response with all content including portraits
    // In a real implementation, you would generate a PDF here
    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        theme: campaign.theme,
        difficulty: campaign.difficulty,
        playerCount: campaign.playerCount,
        levelRange: campaign.levelRange,
        estimatedDuration: campaign.estimatedDuration,
        setting: campaign.setting,
        mainPlot: campaign.mainPlot,
        subPlots: campaign.subPlots,
        majorNPCs: campaign.majorNPCs,
        locations: campaign.locations,
        items: campaign.items,
        quests: campaign.quests,
        encounters: campaign.encounters,
        characters: campaign.characters,
        notes: campaign.notes,
        status: campaign.status,
        createdAt: campaign.createdAt
      },
      content: {
        characters: campaign.campaignCharacters,
        npcs: campaign.campaignNpcs,
        worlds: campaign.campaignWorlds,
        items: campaign.campaignItems,
        quests: campaign.campaignQuests,
        encounters: campaign.campaignEncounters
      }
    })
  } catch (error) {
    console.error('Campaign PDF error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
} 