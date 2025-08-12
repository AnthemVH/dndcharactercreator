import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Check for your existing token cookie
  const token = request.cookies.get('token')?.value
  
  console.log('🔍 Middleware - Path:', request.nextUrl.pathname)
  console.log('🔍 Middleware - Token exists:', !!token)

  // Only protect dashboard routes, not API routes
  const protectedRoutes = ['/dashboard']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  console.log('🔍 Middleware - Is protected route:', isProtectedRoute)

  if (isProtectedRoute) {
    if (!token) {
      const returnTo = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)
      console.log('🔍 Middleware - No token, redirecting to login with returnTo:', returnTo)
      return NextResponse.redirect(new URL(`/login?returnTo=${returnTo}`, request.url))
    }

    console.log('🔍 Middleware - Token exists, allowing access to dashboard')
  }

  // Auth routes (redirect if already logged in)
  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  console.log('🔍 Middleware - Is auth route:', isAuthRoute)

  if (isAuthRoute && token) {
    // If user has a token and tries to access auth pages, redirect to dashboard
    console.log('🔍 Middleware - Auth route with token, redirecting to /dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  console.log('🔍 Middleware - Continuing to next()')
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
  ],
} 