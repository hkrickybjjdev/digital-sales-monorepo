import { Hono } from 'hono';
import { Env } from '../../types';
import { validateJWT } from '../auth/middleware/authMiddleware';
import * as pageHandlers from './controllers/pageHandlers';
import * as contentHandlers from './controllers/contentHandlers';
import * as registrationHandlers from './controllers/registrationHandlers';

// Create the pages module router
const pagesModule = new Hono<{ Bindings: Env }>();

// PUBLIC ROUTES

// Access page by shortId
pagesModule.get('/s/:shortId', pageHandlers.getPublicPage);

// Submit registration
pagesModule.post('/s/:shortId/register', registrationHandlers.createRegistration);

// PROTECTED ROUTES
const protectedRoutes = new Hono<{ Bindings: Env }>();
protectedRoutes.use('/*', validateJWT);

// Page CRUD operations
protectedRoutes.get('/', pageHandlers.listPages);
protectedRoutes.post('/', pageHandlers.createPage);
protectedRoutes.get('/:id', pageHandlers.getPage);
protectedRoutes.put('/:id', pageHandlers.updatePage);
protectedRoutes.delete('/:id', pageHandlers.deletePage);

// Page Content operations
protectedRoutes.post('/:pageId/contents', contentHandlers.createPageContent);
protectedRoutes.get('/:pageId/contents', contentHandlers.listPageContents);
protectedRoutes.get('/:pageId/contents/:contentId', contentHandlers.getPageContent);
protectedRoutes.put('/:pageId/contents/:contentId', contentHandlers.updatePageContent);
protectedRoutes.delete('/:pageId/contents/:contentId', contentHandlers.deletePageContent);

// Registration management 
protectedRoutes.get('/:pageId/registrations', registrationHandlers.listRegistrations);
protectedRoutes.get('/:pageId/registrations/export', registrationHandlers.exportRegistrations);

// Mount protected routes
pagesModule.route('/', protectedRoutes);

export { pagesModule };