import { Context, Next } from 'hono';
import { API_VERSIONS, LATEST_VERSION } from '../utils/versioning';
import { Env } from '../types';
import { formatError } from '../utils/api-response';

/**
 * Middleware to add version information to response headers
 * and handle deprecation warnings according to Azure API conventions
 */
export const versionMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
  // Extract version from URL path
  const path = c.req.path;
  const versionMatch = path.match(/^\/api\/(v\d+)/);
  const version = versionMatch ? versionMatch[1] : LATEST_VERSION;
  
  // Validate version exists
  if (!API_VERSIONS[version]) {
    return formatError(c,
      `API version ${version} is not supported. Please use one of: ${Object.keys(API_VERSIONS).join(', ')}`,
      'UnsupportedApiVersion',
      400
    );
  }
  
  // Add Azure-style version headers
  c.header('api-supported-versions', Object.keys(API_VERSIONS).map(v => API_VERSIONS[v].version).join(', '));
  c.header('api-version', API_VERSIONS[version].version);
  c.header('api-deprecated-versions', Object.entries(API_VERSIONS)
    .filter(([_, info]) => info.deprecated)
    .map(([v, _]) => v)
    .join(', ')
  );
  
  // Add deprecation warning if applicable
  if (API_VERSIONS[version]?.deprecated) {
    const sunsetDate = API_VERSIONS[version].sunset || 'a future date';
    c.header('Warning', `299 - "This API version is deprecated and will be removed on ${sunsetDate}. Please migrate to v${LATEST_VERSION}."`);
  }
  
  await next();
};