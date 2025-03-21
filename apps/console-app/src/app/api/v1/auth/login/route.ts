import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_CONFIG } from '@/lib/config';

type LoginRequestBody = {
  email: string;
  password: string;
};

type LoginResponseData = {
  token?: string;
  expiresAt?: number;
  user?: {
    email: string;
    [key: string]: any;
  };
  message?: string;
};

export async function POST(request: Request) {
  try {
    // Get credentials from request body
    const body = await request.json() as LoginRequestBody;
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Call the actual external API
    const externalApiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`;
    
    const response = await fetch(externalApiUrl, {
      method: 'POST',
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
      },
      body: JSON.stringify({ email, password }),
    });
    
    // Get response data
    const data = await response.json() as LoginResponseData;
    
    // If external API returns an error
    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Login failed' },
        { status: response.status }
      );
    }
    
    // Set secure HTTP-only cookie with the token
    if (data.token) {
      // Create a response with success data
      const responseWithCookies = NextResponse.json({ 
        success: true,
        user: data.user || { email } // Return user data if available
      });
      
      // Set HTTP-only secure cookie on the response object
      responseWithCookies.cookies.set('auth-token', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: data.expiresAt ? Math.floor((data.expiresAt - Date.now()) / 1000) : 60 * 60 * 24, // 24 hours default
        path: '/',
        sameSite: 'strict'
      });
      
      return responseWithCookies;
    }
    
    return NextResponse.json(
      { message: 'Authentication failed' },
      { status: 401 }
    );
    
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 