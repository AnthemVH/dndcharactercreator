import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export function middleware(request: NextRequest) {
  // Get token from cookie
  const token = request.cookies.get('auth-token')?.value

  // Protected routes that require authentication
  const protectedRoutes = ['/creator', '/dashboard', '/profile']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If token exists, verify it
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string
        email: string
        subscriptionTier: string
      }

      // Add user info to request headers for API routes
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('user-id', decoded.userId)
      requestHeaders.set('user-email', decoded.email)
      requestHeaders.set('subscription-tier', decoded.subscriptionTier)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      // Invalid token, clear cookie and redirect to login for protected routes
      if (isProtectedRoute) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('auth-token')
        return response
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}