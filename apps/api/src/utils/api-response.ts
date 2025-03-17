import { Context } from 'hono';
import { JSONValue } from 'hono/utils/types';

// Helper function to format responses according to Azure API conventions
export function formatResponse<T extends JSONValue>(
  c: Context,
  data: T,
  status: number = 200
): Response {
  return c.json(data, { status });
}

// Helper function to format paginated responses according to Azure API conventions
export function formatPaginatedResponse<T extends JSONValue>(
  c: Context,
  data: T[],
  count: number,
  page: number,
  pageSize: number,
  url: URL,
  status: number = 200
): Response {
  // Create a new URLSearchParams object
  const searchParams = new URLSearchParams();

  // Preserve all existing query parameters except pagination ones
  for (const [key, value] of new URLSearchParams(url.search)) {
    if (key !== 'page' && key !== 'pageSize') {
      searchParams.append(key, value);
    }
  }

  // Add pagination parameters
  searchParams.append('pageSize', pageSize.toString());

  // Only include the page parameter in nextLink if there are more pages
  if (page * pageSize < count) {
    searchParams.append('page', (page + 1).toString());
  }

  // Build nextLink URL according to Azure REST API guidelines
  const nextLink =
    page * pageSize < count ? `${url.origin}${url.pathname}?${searchParams.toString()}` : null;

  // Format response according to Azure REST API guidelines
  const response = {
    value: data,
    count: data.length,
    nextLink,
  };

  return c.json(response, { status });
}

// Helper function to format error responses according to Azure API conventions
export function formatError(c: Context, message: string, code: string, status: number): Response {
  return c.json(
    {
      error: {
        code: code,
        message: message,
      },
    },
    { status }
  );
}

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

export const format500Error = (error: Error): Response => {
  // Following Azure API error response conventions
  return Response.json(
    {
      error: {
        code: 'InternalServerError',
        message: error.message,
        innererror: {
          code: error.name,
          stackTrace: isProduction() ? null : error.stack,
        },
      },
    },
    {
      status: 500,
    }
  );
};
