// API Configuration
const getBaseUrl = () => {
  // Check if we're running on localhost (development)
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1');

  // If we're on localhost and have a local API URL, use it
  if (isLocalhost && import.meta.env.VITE_API_BASE_URL &&
      import.meta.env.VITE_API_BASE_URL.includes('localhost')) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // If we're on localhost but no local API URL, use default
  if (isLocalhost) {
    return 'http://localhost:5001';
  }

  // In production (not localhost), always use relative URLs
  return '';
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
  console.log('🔗 API URL Debug:', {
    fullUrl,
    baseUrl: API_CONFIG.BASE_URL,
    endpoint,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    isProd: import.meta.env.PROD,
    isDev: import.meta.env.DEV,
    envVar: import.meta.env.VITE_API_BASE_URL,
    mode: import.meta.env.MODE
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
