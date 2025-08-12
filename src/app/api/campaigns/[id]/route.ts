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
    const { id: campaignId } = await params

    // Delete the campaign
    await prisma.campaign.delete({
      where: {
        id: campaignId,
        userId: userId // Ensure user owns the campaign
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Campaign delete error:', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
} 

export async function PUT(
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
    const body = await request.json()

    // Update the campaign
    const updatedCampaign = await prisma.campaign.update({
      where: {
        id: campaignId,
        userId: userId // Ensure user owns the campaign
      },
      data: {
        name: body.name,
        theme: body.theme,
        description: body.description
      }
    })

    return NextResponse.json(updatedCampaign)
  } catch (error) {
    console.error('Campaign update error:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
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
    const { id: campaignId } = await params

    // Get the campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId: userId
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Campaign fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 })
  }
} 