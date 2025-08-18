import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { saveContentSingleInstance } from '@/lib/content-manager'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { campaign } = body

    if (!campaign) {
      return NextResponse.json({ error: 'No campaign data provided' }, { status: 400 })
    }

    // Use single-instance content manager
    try {
      console.log('Saving campaign with data:', {
        name: campaign.name,
        theme: campaign.theme,
        setting: campaign.setting
      })
      
      const saveResult = await saveContentSingleInstance({
        type: 'campaign',
        data: campaign,
        userId: payload.userId
      })
      
      console.log('Campaign saved with result:', saveResult)
      
      return NextResponse.json({
        id: saveResult.id,
        isNew: saveResult.isNew,
        autoSave: saveResult.autoSave,
        message: saveResult.isNew ? 'Campaign saved successfully' : 'Campaign updated successfully'
      })
      
    } catch (saveError) {
      console.error('Campaign save error:', saveError)
      return NextResponse.json({ error: 'Failed to save campaign' }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Campaign save route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 