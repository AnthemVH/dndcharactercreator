import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // For now, just check if token exists
    return NextResponse.json({ 
      authenticated: true, 
      message: 'Token found'
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
} 