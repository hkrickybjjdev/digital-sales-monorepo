import { API_CONFIG } from '@/lib/config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Clears the auth-token cookie from the response
 */
function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: 'auth-token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0), // Set expiration to epoch to clear the cookie
    path: '/',
  });
}

export async function POST(request: NextRequest) {
  try {
    // Call external backend API
    const externalApiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGOUT}`;
    const backendResponse = await fetch(externalApiUrl, {
      method: 'POST',
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': request.cookies.get('auth-token')?.value 
          ? `Bearer ${request.cookies.get('auth-token')?.value}` 
          : '',
      },
    });
    
    // Check if backend call was successful
    if (!backendResponse.ok) {
      console.error('Backend logout failed:', await backendResponse.text());
    }
    
    // Create response object - always return 200 for success as requested
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    }, { status: 200 });
    
    // Clear the auth-token cookie
    clearAuthCookie(response);
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Still return 200 as requested, but log the error
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    }, { status: 200 });
    
    // Ensure the auth-token cookie is cleared even in case of errors
    clearAuthCookie(response);
    
    return response;
  }
} 