// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://your-backend-url.com' : 'http://localhost:5001'),
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh',
      PROFILE: '/api/auth/profile'
    },
    SUBMISSIONS: {
      LIST: '/api/submissions',
      CREATE: '/api/submissions',
      UPDATE: '/api/submissions',
      DELETE: '/api/submissions'
    },
    ANALYTICS: {
      OVERVIEW: '/api/analytics/overview',
      DETAILED: '/api/analytics/detailed',
      VIDEO: '/api/analytics/video'
    },
    USER: {
      PROFILE: '/api/user/profile',
      SETTINGS: '/api/user/settings'
    },
    FEEDBACK: {
      SUBMIT: '/api/feedback/submit'
    }
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// App Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Writer Dashboard',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  FEATURES: {
    ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    FEEDBACK: import.meta.env.VITE_ENABLE_FEEDBACK === 'true'
  }
};

// Environment check
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
