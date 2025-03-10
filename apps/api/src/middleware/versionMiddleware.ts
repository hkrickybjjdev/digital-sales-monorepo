import { Context, Next } from 'hono';
import { API_VERSIONS, LATEST_VERSION } from '../utils/versioning';
import { Env } from '../types';

/**
 * Middleware to add version information to response headers
 * and handle deprecation warnings
 */
export const versionMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
  // Extract version from URL path
  const path = c.req.path;
  const versionMatch = path.match(/^\/api\/(v\d+)/);
  const version = versionMatch ? versionMatch[1] : LATEST_VERSION;
  
  // Add version headers
  c.header('X-API-Version', API_VERSIONS[version]?.version || 'unknown');
  c.header('X-API-Latest-Version', API_VERSIONS[LATEST_VERSION].version);
  
  // Add deprecation warning if applicable
  if (API_VERSIONS[version]?.deprecated) {
    c.header('Warning', `299 - "This API version is deprecated and will be removed on ${API_VERSIONS[version].sunset || 'a future date'}. Please migrate to the latest version."`);
  }
  
  await next();
}; 