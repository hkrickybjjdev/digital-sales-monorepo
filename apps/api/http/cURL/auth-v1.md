# Auth v1 API Collection

## Base URL
All v1 endpoints are prefixed with `/api/v1`

## Register
Register a new user

```bash
curl -X POST http://localhost:8787/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password",
    "name": "John Doe"
  }'
```

Expected successful response (201):
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt_xyz789"
}
```

## Login
Login with email and password

```bash
curl -X POST http://localhost:8787/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'
```

Expected successful response (200):
```json
{
  "token": "jwt_xyz789",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## Get Current User
Get the profile of the currently authenticated user

```bash
curl -X GET http://localhost:8787/api/v1/auth/me \
  -H "Authorization: Bearer jwt_xyz789"
```

Expected successful response (200):
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## Logout
Log out the current user and invalidate their session

```bash
curl -X POST http://localhost:8787/api/v1/auth/logout \
  -H "Authorization: Bearer jwt_xyz789"
```

Expected successful response (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Error Responses

### Validation Error (400)
```json
{
  "error": "Invalid input",
  "type": "ValidationError"
}
```

### Authentication Error (401)
```json
{
  "error": "Invalid email or password",
  "type": "Unauthorized"
}
```

### Account Locked (403)
```json
{
  "error": "Account is locked",
  "type": "AccountLocked"
}
```

### Not Found (404)
```json
{
  "error": "User not found",
  "type": "ResourceNotFound"
}
```

### Conflict Error (409)
```json
{
  "error": "User with this email already exists",
  "type": "ConflictError"
}
```

### Server Error (500)
```json
{
  "error": "Internal server error",
  "type": "ServerError"
}
```