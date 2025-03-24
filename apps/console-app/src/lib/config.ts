/**
 * Global configuration settings
 */

// API configuration
export const API_CONFIG = {
  // Base API URLs
  BASE_URL: 'http://localhost:8787',
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/v1/auth/login',
      LOGOUT: '/api/v1/auth/logout',
      REGISTER: '/api/v1/auth/register',
      FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
      RESET_PASSWORD: '/api/v1/auth/reset-password',
    },
    USERS: {
      PROFILE: '/api/v1/auth/me',
    },
  },
  
  // Request default settings
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  
  // Request timeouts (in milliseconds)
  TIMEOUT: 30000,
} 