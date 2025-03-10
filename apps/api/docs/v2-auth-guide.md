# TempPages API v2 Authentication Guide

This guide demonstrates how to use the enhanced authentication features in the v2 API, including multi-factor authentication (MFA).

## API Endpoints

### Base URL

All v2 API endpoints are prefixed with `/api/v2`.

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v2/auth/login` | POST | Login with email and password, with MFA support |
| `/api/v2/auth/mfa/verify` | POST | Verify MFA code during login |
| `/api/v2/auth/me` | GET | Get current user profile |
| `/api/v2/auth/logout` | POST | Log out current user |

## Login Flow with MFA

The v2 API introduces a two-step login process when MFA is enabled for a user:

1. Initial login request with credentials
2. MFA verification with a temporary token

### Step 1: Initial Login

**Request:**

```http
POST /api/v2/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password",
  "deviceId": "device_123" // Optional device identifier
}
```

**Response (MFA required):**

```json
{
  "status": "mfa_required",
  "message": "Multi-factor authentication is required",
  "tempToken": "temp_abc123",
  "mfaMethods": ["totp", "sms"],
  "userId": "user_123"
}
```

**Response (MFA not required):**

```json
{
  "status": "success",
  "message": "Login successful",
  "token": "jwt_xyz789",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "Sample User"
  }
}
```

### Step 2: MFA Verification (if required)

**Request:**

```http
POST /api/v2/auth/mfa/verify
Content-Type: application/json

{
  "tempToken": "temp_abc123",
  "code": "123456",
  "method": "totp", // or "sms"
  "deviceId": "device_123" // Optional device identifier
}
```

**Response:**

```json
{
  "status": "success",
  "message": "MFA verification successful",
  "token": "jwt_xyz789",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "Sample User",
    "mfaEnabled": true,
    "mfaVerified": true
  },
  "deviceInfo": {
    "id": "device_123",
    "name": "Unknown Device",
    "lastLogin": "2023-03-15T12:34:56.789Z",
    "trusted": false
  }
}
```

## Using the Authentication Token

After successful authentication, use the JWT token in the `Authorization` header for all subsequent requests:

```http
GET /api/v2/auth/me
Authorization: Bearer jwt_xyz789
X-Device-ID: device_123 // Optional but recommended for security
```

## Error Handling

### Invalid Credentials

```json
{
  "error": "Authentication failed"
}
```

### Invalid MFA Code

```json
{
  "error": "Invalid verification code",
  "remainingAttempts": 2
}
```

### Unauthorized Device

```json
{
  "error": "Unauthorized device",
  "message": "This device is not authorized to access your account"
}
```

## Client Implementation Example

### JavaScript/TypeScript

```typescript
// Login function with MFA support
async function login(email: string, password: string, deviceId?: string) {
  // Step 1: Initial login
  const loginResponse = await fetch('/api/v2/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, deviceId })
  });
  
  const loginData = await loginResponse.json();
  
  // Check if MFA is required
  if (loginData.status === 'mfa_required') {
    // Store the temporary token for MFA verification
    const tempToken = loginData.tempToken;
    
    // Show MFA verification UI to the user
    // ...
    
    // When the user submits the MFA code:
    return {
      requiresMfa: true,
      tempToken,
      mfaMethods: loginData.mfaMethods
    };
  }
  
  // If MFA is not required, return the auth token
  return {
    requiresMfa: false,
    token: loginData.token,
    user: loginData.user
  };
}

// MFA verification function
async function verifyMfa(tempToken: string, code: string, method: string, deviceId?: string) {
  const mfaResponse = await fetch('/api/v2/auth/mfa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken, code, method, deviceId })
  });
  
  const mfaData = await mfaResponse.json();
  
  if (mfaResponse.ok) {
    // Store the auth token and user info
    return {
      token: mfaData.token,
      user: mfaData.user,
      deviceInfo: mfaData.deviceInfo
    };
  } else {
    throw new Error(mfaData.error || 'MFA verification failed');
  }
}
```

## Migration from v1

If you're migrating from the v1 API, here are the key differences:

1. The login flow now supports MFA and may require a second step
2. Device tracking is now supported for enhanced security
3. The JWT tokens have shorter expiration times
4. Social login providers are supported

To maintain backward compatibility, the v1 API endpoints will continue to work as before. 