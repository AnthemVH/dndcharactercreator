import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Clear the token cookie
    const cookieStore = await cookies()
    cookieStore.delete('token')
    
    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Error in logout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 