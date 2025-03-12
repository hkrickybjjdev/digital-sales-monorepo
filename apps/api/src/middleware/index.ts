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
      status: 500
    }
  );
};
