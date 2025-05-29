// API Configuration
const getBaseUrl = () => {
  // If we're in the browser, check the hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // If hostname contains vercel.app, we're definitely in production
    if (hostname.includes('vercel.app')) {
      console.log('🚀 Detected Vercel production, using relative URLs');
      return '';
    }

    // If hostname is localhost, we're in development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('🏠 Detected localhost, using local API server');
      return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
    }

    // For any other domain, use relative URLs
    console.log('🌐 Unknown domain, using relative URLs');
    return '';
  }

  // Server-side rendering fallback
  return '';
};

// Force recalculation of base URL on every access
export const API_CONFIG = {
  get BASE_URL() {
    const baseUrl = getBaseUrl();
    console.log('🔧 API_CONFIG.BASE_URL accessed:', baseUrl);
    return baseUrl;
  },
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
  // EMERGENCY OVERRIDE: If we're on vercel.app, ALWAYS use relative URLs
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('🚨 VERCEL OVERRIDE: Using relative URL:', endpoint);
    return endpoint;
  }

  // Get fresh base URL every time for non-Vercel environments
  const baseUrl = getBaseUrl();
  const fullUrl = `${baseUrl}${endpoint}`;

  console.log('🔗 API URL Debug:', {
    fullUrl,
    baseUrl,
    endpoint,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    isProd: import.meta.env.PROD,
    isDev: import.meta.env.DEV,
    envVar: import.meta.env.VITE_API_BASE_URL,
    mode: import.meta.env.MODE,
    configBaseUrl: API_CONFIG.BASE_URL
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
