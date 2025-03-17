import { Hono } from 'hono';

import { Env } from '../../types';
import { formatResponse, format500Error } from '../../utils/api-response';
import { validateJWT } from '../auth/middleware/authMiddleware';

// Create the products module router
const productsModule = new Hono<{ Bindings: Env }>();

// All product routes are protected
productsModule.use('/*', validateJWT);

// Product CRUD operations
productsModule.get('/', async c => {
  try {
    // List products for the authenticated user
    return formatResponse(c, {
      message: 'List of products would be returned here',
    });
  } catch (error) {
    console.error('Error listing products:', error);
    return format500Error(error as Error);
  }
});

productsModule.post('/', async c => {
  try {
    // Create a new product
    // Will handle multipart form data for file upload
    return formatResponse(
      c,
      {
        message: 'Product created',
      },
      201
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return format500Error(error as Error);
  }
});

productsModule.get('/:id', async c => {
  try {
    const id = c.req.param('id');
    // Get product details
    return formatResponse(c, {
      message: `Product ${id} details would be returned here`,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return format500Error(error as Error);
  }
});

productsModule.put('/:id', async c => {
  try {
    const id = c.req.param('id');
    // Update product details
    return formatResponse(c, {
      message: `Product ${id} updated successfully`,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return format500Error(error as Error);
  }
});

productsModule.delete('/:id', async c => {
  try {
    const id = c.req.param('id');
    // Delete product
    return formatResponse(c, {
      message: `Product ${id} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return format500Error(error as Error);
  }
});

// Get presigned URL for direct R2 upload
productsModule.get('/upload-url', async c => {
  try {
    // Generate presigned URL for direct upload to R2
    // Client will upload directly to R2, then notify backend of success
    return formatResponse(c, {
      uploadUrl: 'presigned-url-would-be-here',
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return format500Error(error as Error);
  }
});

// Confirm upload completion
productsModule.post('/confirm-upload', async c => {
  try {
    // Update product record with confirmed storage information
    return formatResponse(c, {
      message: 'Upload confirmed',
    });
  } catch (error) {
    console.error('Error confirming upload:', error);
    return format500Error(error as Error);
  }
});

export { productsModule };
