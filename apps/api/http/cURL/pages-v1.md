# Pages API Collection

## Base URL
All endpoints are prefixed with `/api/v1/pages`

## Authentication
All endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Pages API

### Create Page
```bash
curl -X POST "http://localhost:8787/api/v1/pages" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "my-page",
    "status": "draft"
  }'
```

### Get Page by ID
```bash
curl -X GET "http://localhost:8787/api/v1/pages/123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Page by Slug
```bash
curl -X GET "http://localhost:8787/api/v1/pages/slug/my-page" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Published Page by ID
```bash
curl -X GET "http://localhost:8787/api/v1/pages/123/published?languageCode=en" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Published Page by Slug
```bash
curl -X GET "http://localhost:8787/api/v1/pages/slug/my-page/published?languageCode=en" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Save Page Draft
```bash
curl -X POST "http://localhost:8787/api/v1/pages/draft" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pageId": 123,
    "content": {
      "blocks": []
    },
    "languageCode": "en"
  }'
```

### Publish Page
```bash
curl -X POST "http://localhost:8787/api/v1/pages/publish" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pageId": 123,
    "versionId": 456
  }'
```

### Delete Page
```bash
curl -X DELETE "http://localhost:8787/api/v1/pages/123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Page Expiration API

### Create Expiration Setting
```bash
curl -X POST "http://localhost:8787/api/v1/pages/expirations" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "expirationType": "datetime",
    "expiresAtDatetime": "2024-12-31T23:59:59Z",
    "expirationAction": "redirect",
    "redirectUrl": "https://example.com/expired"
  }'
```

### Get Expiration Setting
```bash
curl -X GET "http://localhost:8787/api/v1/pages/expirations/123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Expiration Setting
```bash
curl -X PUT "http://localhost:8787/api/v1/pages/expirations/123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "expirationType": "duration",
    "durationSeconds": 86400,
    "expirationAction": "hide"
  }'
```

### Delete Expiration Setting
```bash
curl -X DELETE "http://localhost:8787/api/v1/pages/expirations/123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Process Expirations (Admin Only)
```bash
curl -X POST "http://localhost:8787/api/v1/pages/admin/process-expirations" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "Error message"
  }
}
```