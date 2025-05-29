// API Configuration
const getBaseUrl = () => {
  // If environment variable is set, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // In production (deployed), use empty string for relative URLs
  if (import.meta.env.PROD) {
    return '';
  }

  // In development, use localhost
  return 'http://localhost:5001';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
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
  const fullUrl = `${API_CONFIG.BASE_URL}${endpoint}`;
  console.log('API URL:', fullUrl, {
    baseUrl: API_CONFIG.BASE_URL,
    endpoint,
    isProd: import.meta.env.PROD,
    envVar: import.meta.env.VITE_API_BASE_URL
  });
  return fullUrl;
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
