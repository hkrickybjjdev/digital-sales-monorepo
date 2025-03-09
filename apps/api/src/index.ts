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

// Create the main app
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['https://tempopages.com', 'https://console.tempopages.com', /\.tempopages\.com$/],
  credentials: true,
}));

// Health check endpoint
app.get('/', (c) => {
  return c.json({ 
    status: 'ok',
    version: '0.1.0',
    environment: c.env.ENVIRONMENT
  });
});

// Mount the modules
app.route('/auth', authModule);
app.route('/pages', pagesModule);
app.route('/products', productsModule);
app.route('/payments', paymentsModule);
app.route('/storage', storageModule);
app.route('/analytics', analyticsModule);

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