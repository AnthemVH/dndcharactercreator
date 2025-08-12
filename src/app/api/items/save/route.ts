import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { autoSaveContent } from '@/lib/auto-save'

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
    const { item } = body

    if (!item) {
      return NextResponse.json({ error: 'No item data provided' }, { status: 400 })
    }

    // Save the item to the database
    try {
      const savedItem = await autoSaveContent({
        type: 'item',
        data: item,
        userId: payload.userId
      })
      
      console.log('Item saved successfully')
      return NextResponse.json({ 
        success: true,
        item: savedItem
      })
      
    } catch (autoSaveError) {
      console.error('Auto-save error:', autoSaveError)
      return NextResponse.json(
        { error: 'Failed to save item. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Item save error:', error)
    return NextResponse.json(
      { error: 'Failed to save item. Please try again.' },
      { status: 500 }
    )
  }
} 