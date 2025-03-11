import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { Env } from '../../types';
import { PageController } from './controllers/page-controller';
import { ContentController } from './controllers/content-controller';
import { RegistrationController } from './controllers/registration-controller';

// Create the pages module router
const pagesModule = new Hono<{ Bindings: Env }>();

// PUBLIC ROUTES

// Access page by shortId
pagesModule.get('/s/:shortId', async (c) => {
  const pageController = new PageController(c.env);
  return await pageController.getPublicPage(c);
});

// Submit registration
pagesModule.post('/s/:shortId/register', async (c) => {
  const registrationController = new RegistrationController(c.env);
  return await registrationController.createRegistration(c);
});

// PROTECTED ROUTES
const protectedRoutes = new Hono<{ Bindings: Env }>();
protectedRoutes.use('/*', jwt({ secret: (c) => c.env.JWT_SECRET }));

// Page CRUD operations
protectedRoutes.get('/', async (c) => {
  const pageController = new PageController(c.env);
  return await pageController.listPages(c);
});

protectedRoutes.post('/', async (c) => {
  const pageController = new PageController(c.env);
  return await pageController.createPage(c);
});

protectedRoutes.get('/:id', async (c) => {
  const pageController = new PageController(c.env);
  return await pageController.getPage(c);
});

protectedRoutes.put('/:id', async (c) => {
  const pageController = new PageController(c.env);
  return await pageController.updatePage(c);
});

protectedRoutes.delete('/:id', async (c) => {
  const pageController = new PageController(c.env);
  return await pageController.deletePage(c);
});

// Page Content operations
protectedRoutes.post('/:pageId/contents', async (c) => {
  const contentController = new ContentController(c.env);
  return await contentController.createPageContent(c);
});

protectedRoutes.get('/:pageId/contents', async (c) => {
  const contentController = new ContentController(c.env);
  return await contentController.listPageContents(c);
});

protectedRoutes.get('/:pageId/contents/:contentId', async (c) => {
  const contentController = new ContentController(c.env);
  return await contentController.getPageContent(c);
});

protectedRoutes.put('/:pageId/contents/:contentId', async (c) => {
  const contentController = new ContentController(c.env);
  return await contentController.updatePageContent(c);
});

protectedRoutes.delete('/:pageId/contents/:contentId', async (c) => {
  const contentController = new ContentController(c.env);
  return await contentController.deletePageContent(c);
});

// Registration management 
protectedRoutes.get('/:pageId/registrations', async (c) => {
  const registrationController = new RegistrationController(c.env);
  return await registrationController.listRegistrations(c);
});

protectedRoutes.get('/:pageId/registrations/export', async (c) => {
  const registrationController = new RegistrationController(c.env);
  return await registrationController.exportRegistrations(c);
});

// Page type-specific creation endpoints
protectedRoutes.post('/countdown', async (c) => {
  const pageController = new PageController(c.env);
  return await pageController.createCountdownPage(c);
});

protectedRoutes.post('/flash-sale', async (c) => {
  const pageController = new PageController(c.env);
  return await pageController.createFlashSalePage(c);
});

protectedRoutes.post('/event-registration', async (c) => {
  const pageController = new PageController(c.env);
  return await pageController.createEventRegistrationPage(c);
});

protectedRoutes.post('/limited-offer', async (c) => {
  const pageController = new PageController(c.env);
  return await pageController.createLimitedOfferPage(c);
});

// Mount protected routes
pagesModule.route('/', protectedRoutes);

export { pagesModule };