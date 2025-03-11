# Pages API Collection for Bruno

This collection contains API requests for managing temporary pages, their content, and registrations.

## Collection Structure

### Pages
- **List Pages**: Get all pages with optional filtering
- **Create Page**: Generic page creation endpoint
- **Get Page**: Retrieve page details by ID
- **Get Public Page**: Access public page by shortId
- **Update Page**: Modify an existing page
- **Delete Page**: Remove a page

### Page Types
- **Create Countdown Page**: Create a countdown landing page
- **Create Flash Sale Page**: Create a flash sale page
- **Create Event Registration Page**: Create an event signup page
- **Create Limited Offer Page**: Create a limited-time offer page

### Page Content
- **Create Content**: Add content to a page
- **List Contents**: Get all content for a page
- **Get Content**: Retrieve specific content details
- **Update Content**: Modify existing content
- **Delete Content**: Remove content from a page

### Registrations
- **Submit Registration**: Register for an event or offer
- **List Registrations**: View all registrations for a page
- **Export Registrations**: Download registrations as CSV

## Environment Variables

The collection uses the following environment variables:

- `baseUrl`: The base URL for the API (e.g., http://127.0.0.1:8787)
- `authToken`: JWT token for authentication (required for protected endpoints)

## Authentication

Protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer {{authToken}}
```

## Testing

Each request includes tests to verify:
- Correct response status codes
- Expected response data structure
- Data validation rules

## Usage Examples

1. Creating and Managing a Countdown Page:
   ```
   1. Use "Create Countdown Page" with countdown settings
   2. Add content using "Create Content"
   3. View page using "Get Public Page"
   4. Monitor registrations with "List Registrations"
   ```

2. Setting up an Event Registration:
   ```
   1. Use "Create Event Registration Page"
   2. Configure event details and capacity
   3. Test registration using "Submit Registration"
   4. Export attendee list using "Export Registrations"
   ```

## Notes

- All dates should be in ISO format
- Page shortIds are automatically generated
- Protected routes require authentication
- Registration exports are in CSV format