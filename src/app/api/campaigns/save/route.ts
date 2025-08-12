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

    const { campaign } = await request.json()
    const userId = payload.userId

    if (!campaign) {
      return NextResponse.json({ error: 'No campaign data provided' }, { status: 400 })
    }

    // Helper function to safely join arrays
    const safeJoin = (arr: unknown[], separator: string = '|') => {
      if (!Array.isArray(arr)) return ''
      return arr.map(item => {
        if (typeof item === 'string') return item
        if (typeof item === 'object' && item !== null) {
          return Object.values(item).join(':')
        }
        return String(item)
      }).join(separator)
    }

    // Helper function to safely get array length
    const safeLength = (arr: unknown[]) => {
      return Array.isArray(arr) ? arr.length : 0
    }

    // Save campaign to database
    const savedCampaign = await prisma.campaign.create({
      data: {
        name: campaign.name || 'Untitled Campaign',
        description: campaign.description || '',
        theme: campaign.theme || '',
        difficulty: campaign.difficulty || 'Medium',
        playerCount: campaign.playerCount || 4,
        levelRange: campaign.levelRange || '1-10',
        estimatedDuration: campaign.estimatedDuration || '3-6 months',
        setting: campaign.setting || '',
        mainPlot: campaign.mainPlot || '',
        subPlots: safeJoin(campaign.subPlots || []),
        majorNPCs: safeJoin(campaign.majorNPCs || []),
        locations: safeJoin(campaign.locations || []),
        items: safeJoin(campaign.items || []),
        quests: safeJoin(campaign.quests || []),
        encounters: safeJoin(campaign.encounters || []),
        characters: safeJoin(campaign.characters || []),
        notes: campaign.notes || '',
        status: 'active',
        campaignJson: campaign, // Store the full campaign object
        userId: userId
      }
    })

    return NextResponse.json({ 
      success: true, 
      campaign: savedCampaign 
    })
  } catch (error) {
    console.error('Campaign save error:', error)
    return NextResponse.json({ error: 'Failed to save campaign' }, { status: 500 })
  }
} 