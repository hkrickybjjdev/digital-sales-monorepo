import { Hono } from 'hono';

import { Env } from '../../types';
import { validateJWT } from '../auth/middleware/authMiddleware';

import * as expirationHandlers from './controllers/expirationHandlers';
import * as pageHandlers from './controllers/pageHandlers';

// Create the pages module router
const pagesModule = new Hono<{ Bindings: Env }>();

// Use JWT authentication for all routes
pagesModule.use('*', validateJWT);

// Page routes
pagesModule.post('/', pageHandlers.createPage);
pagesModule.get('/:id', pageHandlers.getPageById);
pagesModule.get('/slug/:slug', pageHandlers.getPageBySlug);
pagesModule.get('/:id/published', pageHandlers.getPageWithVersionById);
pagesModule.get('/slug/:slug/published', pageHandlers.getPageWithVersionBySlug);
pagesModule.post('/draft', pageHandlers.savePageDraft);
pagesModule.post('/publish', pageHandlers.publishPage);
pagesModule.delete('/:id', pageHandlers.deletePage);

// Expiration setting routes
pagesModule.post('/expirations', expirationHandlers.createExpirationSetting);
pagesModule.get('/expirations/:id', expirationHandlers.getExpirationSettingById);
pagesModule.put('/expirations/:id', expirationHandlers.updateExpirationSetting);
pagesModule.delete('/expirations/:id', expirationHandlers.deleteExpirationSetting);

// Admin routes - would typically be restricted to admin users in a real app
pagesModule.post('/admin/process-expirations', expirationHandlers.processExpirations);

export { pagesModule };
