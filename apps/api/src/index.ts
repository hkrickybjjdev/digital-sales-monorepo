import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { prettyJSON } from 'hono/pretty-json';

import { authModule } from './modules/auth';
import { pagesModule } from './modules/pages';
import { productsModule } from './modules/products';
import { paymentsModule } from './modules/payments';
import { storageModule } from './modules/storage';
import { analyticsModule } from './modules/analytics';
import { Env } from './types';
import { getAllVersions, getLatestVersion, LATEST_VERSION } from './utils/versioning';
import { versionMiddleware } from './middleware/versionMiddleware';

// Import v2 modules
import { authModuleV2 } from './modules/auth/v2';

// Create the main app
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['https://tempopages.com', 'https://console.tempopages.com', /\.tempopages\.com$/] as string[],
  credentials: true,
}));

// Health check endpoint
app.get('/', (c) => {
  return c.json({ 
    status: 'ok',
    version: '0.1.0',
    api_versions: getAllVersions(),
    current_version: getLatestVersion(),
    environment: c.env?.ENVIRONMENT || 'development'
  });
});

// API versioning documentation
app.get('/api', (c) => {
  return c.json({
    message: 'TempPages API',
    versions: getAllVersions(),
    latest_version: getLatestVersion(),
    documentation: 'https://docs.tempopages.com/api'
  });
});

// Apply versioning middleware to all API routes
app.use('/api/*', versionMiddleware);

// API versioning
// v1 API routes
const v1 = new Hono<{ Bindings: Env }>();

// Mount the modules to v1
v1.route('/auth', authModule as any);
v1.route('/pages', pagesModule as any);
v1.route('/products', productsModule as any);
v1.route('/payments', paymentsModule as any);
v1.route('/storage', storageModule as any);
v1.route('/analytics', analyticsModule as any);

// v2 API routes
const v2 = new Hono<{ Bindings: Env }>();

// Mount the v2 modules
// Only mount the auth module for v2 as a sample
v2.route('/auth', authModuleV2 as any);

// For other modules, use v1 implementations until v2 versions are ready
v2.route('/pages', pagesModule as any);
v2.route('/products', productsModule as any);
v2.route('/payments', paymentsModule as any);
v2.route('/storage', storageModule as any);
v2.route('/analytics', analyticsModule as any);

// Mount v1 API to /api/v1
app.route('/api/v1', v1 as any);

// Mount v2 API to /api/v2
app.route('/api/v2', v2 as any);

// Also mount the latest version to /api/latest for convenience
app.route(`/api/latest`, v1 as any);

// Error handling
app.onError((err, c) => {
  console.error(`${err}`);
  
  // Handle known errors
  if (err.message.includes('Unauthorized')) {
    return c.json({ error: 'Unauthorized access' }, 401);
  }
  
  if (err.message.includes('Not found')) {
    return c.json({ error: 'Resource not found' }, 404);
  }
  
  // Default error response
  return c.json({ error: 'Internal server error' }, 500);
});

// Not found handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

export default app;