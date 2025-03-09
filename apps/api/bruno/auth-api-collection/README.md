# Auth API Collection for Bruno

This is a collection of authentication and protected resource API requests for testing with Bruno.

## Collection Structure

- **Authentication**
  - Login
  - Register
  - Refresh Token
  - Logout
- **Protected Resources**
  - Get User Profile
  - Update User Profile
  - Change Password

## Environment Variables

The collection uses the following environment variables:

- `baseUrl`: The base URL for the API
- `apiKey`: API key for authentication (if needed)
- `username`: Username for authentication
- `password`: Password for authentication
- `authToken`: JWT token received after login (set automatically)
- `refreshToken`: Refresh token received after login (set automatically)

## How to Use

1. Open the collection in Bruno
2. Select the appropriate environment (Development or Production)
3. Start with the Register request if you need to create a new user
4. Use the Login request to authenticate and get a token
5. The token will be automatically stored in the `authToken` variable
6. Use the protected resource requests with the token
7. Use Refresh Token to get a new token when it expires
8. Use Logout to invalidate the token

## Testing

Each request includes tests to verify the response. You can run these tests to ensure the API is working correctly.

## Scripts

Some requests include pre-request and post-response scripts to automate tasks like:

- Setting timestamps
- Storing tokens
- Updating environment variables

## Notes

- Make sure to update the environment variables with your actual API endpoints and credentials
- The collection is designed to work with a standard JWT authentication flow
- You can customize the requests to match your specific API requirements 