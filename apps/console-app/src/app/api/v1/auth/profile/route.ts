import { API_CONFIG } from '@/lib/config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface ValidationResponse {  
  id: string;
  email: string;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        message: 'No token provided' 
      }, { status: 401 });
    }
    
    // Extract the token from the header
    const token = authHeader.split(' ')[1];
    
    // Make a request to the actual backend service to validate the token
    // Replace with your actual backend API endpoint
    const externalApiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS.PROFILE}`;
      
    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Check if the response is successful
    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid token' 
      }, { status: 401 });
    }
    
    // Return the successful response
    const data = await response.json() as ValidationResponse;
    return NextResponse.json({ 
      success: true, 
      message: 'Token is valid',
      user: data // Pass through any user data from the backend
    });
    
  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error during validation' 
    }, { status: 500 });
  }
} 