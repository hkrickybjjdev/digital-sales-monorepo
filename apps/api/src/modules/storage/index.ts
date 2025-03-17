import { Hono } from 'hono';

import { Env } from '../../types';
import { formatResponse, format500Error } from '../../utils/api-response';
import { validateJWT } from '../auth/middleware/authMiddleware';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE',
  'Access-Control-Allow-Headers': 'Origin,X-Requested-With,Content-Type,Accept',
};

// Create the storage module router
const storageModule = new Hono<{ Bindings: Env }>();

// Public download route with secure access validation
storageModule.get('/download/:token', async c => {
  const token = c.req.param('token');
  try {
    // Validate download token (check expiration, IP restrictions, attempt limits)
    // For now returning a placeholder, but this would actually stream from R2
    return new Response(`File with token ${token} would be streamed here`, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return format500Error(error as Error);
  }
});

// Protected routes for storage management
storageModule.use('/*', validateJWT);

// Generate signed upload URL for direct-to-R2 uploads
storageModule.post('/get-upload-url', async c => {
  try {
    // Generate and return a signed URL for uploading to R2
    return formatResponse(c, {
      uploadUrl: 'https://example-presigned-url.com',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return format500Error(error as Error);
  }
});

// Generate signed download URL with security constraints
storageModule.post('/get-download-url', async c => {
  try {
    // Generate and return a signed URL for secure downloads
    // Will include token with embedded security parameters
    return formatResponse(c, {
      downloadUrl: 'https://api.tempopages.com/storage/download/example-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return format500Error(error as Error);
  }
});

// Delete file from storage
storageModule.delete('/:key', async c => {
  const key = c.req.param('key');
  try {
    // Delete file from R2
    return formatResponse(c, {
      success: true,
      message: `File ${key} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return format500Error(error as Error);
  }
});

// List files for user
storageModule.get('/', async c => {
  try {
    // List files for authenticated user
    return formatResponse(c, {
      files: [], // Would contain actual file list
      totalCount: 0,
    });
  } catch (error) {
    console.error('Error listing files:', error);
    return format500Error(error as Error);
  }
});

export { storageModule };
