import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

// This is a simplified test - you would typically import your actual app from src/index
describe('API Endpoints', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    
    // Set up a sample route for testing
    app.get('/health', (c) => {
      return c.json({ status: 'ok' });
    });
    
    app.get('/api/v1/items', (c) => {
      return c.json({ items: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }] });
    });
    
    app.post('/api/v1/items', async (c) => {
      const body = await c.req.json();
      if (!body.name) {
        throw new HTTPException(400, { message: 'Name is required' });
      }
      return c.json({ id: 3, name: body.name }, 201);
    });
  });

  describe('GET /health', () => {
    it('should return 200 OK with status', async () => {
      const res = await app.request('/health');
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data).toEqual({ status: 'ok' });
    });
  });

  describe('GET /api/v1/items', () => {
    it('should return list of items', async () => {
      const res = await app.request('/api/v1/items');
      expect(res.status).toBe(200);
      
      const data = await res.json() as { items: Array<{id: number, name: string}> };
      expect(data.items).toHaveLength(2);
      expect(data.items[0].name).toBe('Item 1');
    });
  });

  describe('POST /api/v1/items', () => {
    it('should create a new item with valid data', async () => {
      const res = await app.request('/api/v1/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Item' }),
      });
      
      expect(res.status).toBe(201);
      const data = await res.json() as { id: number, name: string };
      expect(data.name).toBe('New Item');
    });

    it('should return 400 for invalid data', async () => {
      const res = await app.request('/api/v1/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Missing name field' }), // Missing required name
      });
      
      expect(res.status).toBe(400);
    });
  });
});