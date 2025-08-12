import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 /api/auth/me called')
    console.log('📡 Request headers:', Object.fromEntries(request.headers.entries()))
    
    // Get the token from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    
    console.log('🍪 Token from cookies:', token ? 'EXISTS' : 'NOT FOUND')
    
    if (!token) {
      console.log('❌ No token found in cookies')
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      )
    }

    // Verify the token
    const decoded = await verifyToken(token)
    console.log('🔑 Token decoded:', decoded)
    
    if (!decoded || !decoded.userId) {
      console.log('❌ Invalid token')
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    console.log('✅ Token valid, user ID:', decoded.userId)

    // Get user from database to get role
    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tokens: true
      }
    })

    console.log('👤 Database user:', user)

    if (!user) {
      console.log('❌ User not found in database')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ User found, role:', user.role)
    return NextResponse.json(user)
  } catch (error) {
    console.error('💥 Error in /api/auth/me:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
