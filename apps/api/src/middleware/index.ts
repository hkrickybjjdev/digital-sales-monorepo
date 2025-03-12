export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Check if we're in a production environment
// In Cloudflare Workers, environment variables are accessed from env parameter
// Defaulting to development mode if we can't determine the environment
const isProduction = (): boolean => {
  try {
    // @ts-ignore - Checking if environment is accessible in runtime
    return globalThis?.ENVIRONMENT === 'production';
  } catch {
    return false; // Default to development mode for safety
  }
};

export const errorHandler = (error: Error): Response => {
  console.error('API Error:', error);
  
  // Following Azure API error response conventions
  return Response.json(
    { 
      error: {
        code: 'InternalServerError',
        message: error.message,
        innererror: {
          code: error.name,
          stackTrace: isProduction() ? null : error.stack
        }
      }
    }, 
    { 
      status: 500,
      headers: corsHeaders 
    }
  );
};

export const withCors = (handler: Function) => async (request: Request, ...args: any[]) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const response = await handler(request, ...args);
  
  // Add CORS headers to the response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
};