import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

import { versionMiddleware } from './middleware/versionMiddleware';
import { analyticsModule } from './modules/analytics';
import { authModule } from './modules/auth';
import { authModuleV2 } from './modules/auth/v2';
import { pagesModule } from './modules/pages'; // Import the pages module
import { paymentsModule } from './modules/payments';
import { storageModule } from './modules/storage';
import { subscriptionsModule } from './modules/subscriptions'; // Import the subscriptions module
import { teamsModule } from './modules/teams'; // Import the teams module
import { Env } from './types';
import { formatResponse, formatError, format500Error } from './utils/apiResponse';
import { getAllVersions, getLatestVersion } from './utils/versioning';

// Import v2 modules

// Create the main app
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', prettyJSON());
app.use(
  '*',
  cors({
    origin: [
      'https://tempopages.com',
      'https://console.tempopages.com',
      /\.tempopages\.com$/,
    ] as string[],
    allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 86400,
    credentials: true,
  })
);

// Health check endpoint
app.get('/', c => {
  return formatResponse(c, {
    status: 'ok',
    version: '0.1.0',
    api_versions: getAllVersions(),
    current_version: getLatestVersion(),
    environment: c.env?.ENVIRONMENT || 'development',
  });
});

// API versioning documentation
app.get('/api', c => {
  return formatResponse(c, {
    message: 'TempPages API',
    versions: getAllVersions(),
    latest_version: getLatestVersion(),
    documentation: 'https://docs.tempopages.com/api',
  });
});

// Apply versioning middleware to all API routes
app.use('/api/*', versionMiddleware);

// API versioning
// v1 API routes
const v1 = new Hono<{ Bindings: Env }>();

// Mount the modules to v1
v1.route('/auth', authModule);
v1.route('/teams', teamsModule); // Mount the teams module
v1.route('/payments', paymentsModule);
v1.route('/storage', storageModule);
v1.route('/analytics', analyticsModule);
v1.route('/subscriptions', subscriptionsModule); // Mount the subscriptions module
v1.route('/pages', pagesModule); // Mount the pages module

// v2 API routes
const v2 = new Hono<{ Bindings: Env }>();

// Mount the v2 modules
// Only mount the auth module for v2 as a sample
v2.route('/auth', authModuleV2);

// For other modules, use v1 implementations until v2 versions are ready
v2.route('/teams', teamsModule); // Mount the teams module in v2 as well
v2.route('/payments', paymentsModule);
v2.route('/storage', storageModule);
v2.route('/analytics', analyticsModule);
v2.route('/subscriptions', subscriptionsModule); // Mount the subscriptions module in v2 as well
v2.route('/pages', pagesModule); // Mount the pages module in v2 as well

// Mount v1 API to /api/v1
app.route('/api/v1', v1);

// Mount v2 API to /api/v2
app.route('/api/v2', v2);

// Also mount the latest version to /api/latest for convenience
app.route(`/api/latest`, v1);

// Error handling
app.onError((err, c) => {
  console.error(`${err}`);

  // Handle known errors
  if (err.message.includes('Unauthorized')) {
    return formatError(c, 'Unauthorized access', 'Unauthorized', 401);
  }

  if (err.message.includes('Not found')) {
    return formatError(c, 'Resource not found', 'NotFound', 404);
  }

  // Default error response using format500Error
  return format500Error(err);
});

// Not found handler
app.notFound(c => {
  return formatError(c, 'Not found', 'NotFound', 404);
});

export default app;
