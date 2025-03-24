import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { API_CONFIG } from '@/lib/config';

interface LoginRequestBody {
  email: string;
  password: string;
}

interface AuthResponse {  
  token?: string;
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
  expiresAt: number
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json() as LoginRequestBody;
    
    // Validate request body
    if (!body.email || !body.password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email and password are required' 
      }, { status: 400 });
    }
    
    // Make a request to the actual backend service to authenticate the user
    // Replace with your actual backend API endpoint
    const externalApiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`;
    
    const response = await fetch(externalApiUrl, {
      method: 'POST',
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password
      })
    });
    
    // Get response data
    const data = await response.json() as AuthResponse;
    
    // Check if the login was successful
    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid email or password' 
      }, { status: 401 });
    }
    
    // Create the response
    const authToken = data.token;
    
    if (!authToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'No token received from authentication service' 
      }, { status: 500 });
    }
    
    // Create response object
    const res = NextResponse.json({ 
      success: true, 
      message: 'Login successful',
      user: data.user 
    });
    
    // Set auth token in HTTP-only cookie
    // Set cookie options
    // - httpOnly: Prevents JavaScript from reading the cookie
    // - secure: Cookie is only sent over HTTPS (in production)
    // - sameSite: Strict to prevent CSRF attacks
    // - path: Cookie is available on all paths
    // - maxAge: Cookie expires after 7 days (in seconds)
    res.cookies.set({
      name: 'auth-token',
      value: authToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: data.expiresAt ? Math.floor((data.expiresAt - Date.now()) / 1000) : 60 * 60 * 24, // 24 hours default
    });
    
    return res;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error during login' 
    }, { status: 500 });
  }
} 