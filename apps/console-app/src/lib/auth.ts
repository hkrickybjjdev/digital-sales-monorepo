import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface ValidationResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
  message?: string;
}

/**
 * Validate the auth token by calling the backend API
 * If the token is invalid, redirect to login
 */
export async function validateAuthToken() {
  // Get the auth token from cookies
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth-token')?.value;

  // If no token is present, redirect to login
  if (!authToken) {
    redirect('/login');
  }

  try {
    // Call our own API endpoint that acts as a BFF
    const response = await fetch('http://localhost:3000/api/v1/auth/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      // This ensures the function is called from the server
      cache: 'no-store',
    });

    const data = await response.json() as ValidationResponse;

    console.log('Validation response:', data);
    // If validation fails, redirect to login
    if (!data.success) {
      redirect('/login');
    }

    // Return the user data for use in the component    
    return data.user;
  } catch (error) {
    console.error('Error validating token:', error);
    redirect('/login');
  }
}

/**
 * Get the auth token from cookies
 */
export async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get('auth-token')?.value;
} 