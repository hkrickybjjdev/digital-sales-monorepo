import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { Env } from '../../types';

// Create the pages module router
const pagesModule = new Hono<{ Bindings: Env }>();

// Public routes for accessing pages by shortId
pagesModule.get('/s/:shortId', async (c) => {
  const shortId = c.req.param('shortId');
  // Implementation will fetch page data from database and validate expiration
  return c.json({ message: `Page ${shortId} details would be returned here` });
});

// Protected routes for page management
pagesModule.use('/*', jwt({ secret: (c) => c.env.JWT_SECRET }));

// Page CRUD operations
pagesModule.get('/', async (c) => {
  // List pages for the authenticated user
  return c.json({ message: 'List of pages would be returned here' });
});

pagesModule.post('/', async (c) => {
  // Create a new page
  return c.json({ message: 'Page created' }, 201);
});

pagesModule.get('/:id', async (c) => {
  const id = c.req.param('id');
  // Get page details
  return c.json({ message: `Page ${id} details would be returned here` });
});

pagesModule.put('/:id', async (c) => {
  const id = c.req.param('id');
  // Update page details
  return c.json({ message: `Page ${id} updated successfully` });
});

pagesModule.delete('/:id', async (c) => {
  const id = c.req.param('id');
  // Delete page
  return c.json({ message: `Page ${id} deleted successfully` });
});

// Different page type endpoints
pagesModule.post('/countdown', async (c) => {
  // Create countdown landing page
  return c.json({ message: 'Countdown page created' }, 201);
});

pagesModule.post('/flash-sale', async (c) => {
  // Create flash sale page
  return c.json({ message: 'Flash sale page created' }, 201);
});

pagesModule.post('/event-registration', async (c) => {
  // Create event registration page
  return c.json({ message: 'Event registration page created' }, 201);
});

pagesModule.post('/limited-offer', async (c) => {
  // Create limited offer page
  return c.json({ message: 'Limited offer page created' }, 201);
});

export { pagesModule };