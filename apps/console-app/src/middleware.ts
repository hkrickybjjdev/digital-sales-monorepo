import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname
  
  // Check if the request is for a protected route (dashboard)
  const isDashboardRoute = path.startsWith('/dashboard')
  const isLoginRoute = path === '/login'
  
  // Get the authentication token from cookies
  const authToken = request.cookies.get('auth-token')?.value
  
  // If accessing dashboard without token, redirect to login
  if (isDashboardRoute && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // If accessing login with token, redirect to dashboard
  if (isLoginRoute && authToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

// This configuration specifies which paths the middleware should run on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
  ],
} 