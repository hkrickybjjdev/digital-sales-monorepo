import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('health check should return 200 OK', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
  });
  
  // Add more API endpoint tests as needed
});