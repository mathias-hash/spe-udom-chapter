const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const DEV_FRONTEND_PORTS = new Set(['3000', '3001', '5173', '4173']);

const isPrivateIpv4Host = hostname => (
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
  /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
);

const isDevelopmentFrontendHost = location => {
  if (!location) return false;
  const { hostname, port } = location;
  return LOCAL_HOSTS.has(hostname) || isPrivateIpv4Host(hostname) || DEV_FRONTEND_PORTS.has(port);
};

const getRuntimeApiBaseUrl = () => {
  const configuredBase = process.env.REACT_APP_API_BASE_URL?.trim().replace(/\/$/, '');
  if (typeof window === 'undefined') return 'http://localhost:8000';
  const { hostname, protocol, host } = window.location;
  if (configuredBase) {
    try {
      const configuredUrl = new URL(configuredBase);
      const configuredHostIsLocal = isDevelopmentFrontendHost({
        hostname: configuredUrl.hostname,
        port: configuredUrl.port,
      });
      const currentHostIsLocal = isDevelopmentFrontendHost(window.location);

      // Ignore localhost/private-network API URLs when the app is running on a public host.
      if (!configuredHostIsLocal || currentHostIsLocal) {
        return configuredBase;
      }
    } catch {
      return configuredBase;
    }
  }
  if (isDevelopmentFrontendHost(window.location)) {
    return `${protocol}//${hostname}:8000`;
  }
  // On production with no env var set, same origin (assumes backend served from same domain)
  return `${protocol}//${host}`;
};

export const API_BASE_URL = getRuntimeApiBaseUrl();
export const API_BASE = `${API_BASE_URL}/api`;

// Token refresh configuration
const TOKEN_STORAGE_KEY_ACCESS = 'spe_access';
const TOKEN_STORAGE_KEY_REFRESH = 'spe_refresh';
const TOKEN_STORAGE_KEY_USER = 'spe_user';
const MAX_RETRIES = 1;

/**
 * Secure token storage with expiration tracking
 * Note: For production, consider using secure HttpOnly cookies instead of localStorage
 */
class TokenManager {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.isRefreshing = false;
  }

  getAccessToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY_ACCESS);
  }

  setAccessToken(token) {
    localStorage.setItem(TOKEN_STORAGE_KEY_ACCESS, token);
    this.accessToken = token;
  }

  getRefreshToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY_REFRESH);
  }

  setRefreshToken(token) {
    localStorage.setItem(TOKEN_STORAGE_KEY_REFRESH, token);
    this.refreshToken = token;
  }

  clearTokens() {
    localStorage.removeItem(TOKEN_STORAGE_KEY_ACCESS);
    localStorage.removeItem(TOKEN_STORAGE_KEY_REFRESH);
    localStorage.removeItem(TOKEN_STORAGE_KEY_USER);
    this.accessToken = null;
    this.refreshToken = null;
  }

  isTokenExpired(token) {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

const tokenManager = new TokenManager();
let refreshPromise = null;

/**
 * Refresh access token with retry protection
 */
const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  const refresh = tokenManager.getRefreshToken();
  if (!refresh) return null;

  refreshPromise = (async () => {
    tokenManager.isRefreshing = true;

    try {
      const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'omit', // Don't send cookies (using JWT)
        body: JSON.stringify({ refresh }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.access) {
          tokenManager.setAccessToken(data.access);
          return data.access;
        }
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    } finally {
      tokenManager.isRefreshing = false;
      refreshPromise = null;
    }

    return null;
  })();

  return refreshPromise;
};

/**
 * Main API function with security features
 * - JWT token management
 * - Automatic token refresh on 401
 * - Security headers
 * - Input validation
 */
export const api = async (endpoint, options = {}, retryAttempt = 0) => {
  // Validate endpoint to prevent injection
  if (!endpoint || typeof endpoint !== 'string') {
    return { ok: false, status: 400, data: { error: 'Invalid endpoint' } };
  }

  let token = tokenManager.getAccessToken();
  const refreshToken = tokenManager.getRefreshToken();
  if (token && refreshToken && tokenManager.isTokenExpired(token)) {
    token = await refreshAccessToken();
    if (!token) {
      handleAuthenticationFailure();
      return { ok: false, status: 401, data: { error: 'Authentication failed' } };
    }
  }
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  if (isFormData) {
    delete headers['Content-Type'];
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'omit',
    });

    // Handle unauthorized - try token refresh
    if (res.status === 401 && retryAttempt < MAX_RETRIES) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return api(endpoint, options, retryAttempt + 1);
      }
      // Refresh failed - clear auth and redirect
      handleAuthenticationFailure();
      return { ok: false, status: 401, data: { error: 'Authentication failed' } };
    }

    // Try to parse JSON response
    let data = {};
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch (e) {
        console.error('Failed to parse JSON response');
        data = {};
      }
    }

    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    console.error('API request error:', error);
    return {
      ok: false,
      status: 0,
      data: {
        error: `Cannot connect to the server at ${API_BASE_URL}. Check that the backend is running and reachable.`,
      },
    };
  }
};

/**
 * Helper for list endpoints
 */
export const apiList = async (endpoint) => {
  const { ok, data } = await api(endpoint);
  if (!ok) return [];
  return Array.isArray(data) ? data : (data.results || []);
};

/**
 * Helper for paginated endpoints
 */
export const apiPaginated = async (endpoint, page = 1, pageSize = 10) => {
  const params = new URLSearchParams({
    page: Math.max(1, parseInt(page) || 1),
    page_size: Math.max(1, Math.min(100, parseInt(pageSize) || 10)),
  });
  const { ok, data } = await api(`${endpoint}?${params}`);
  return ok ? data : { results: [], total: 0, page: 1, page_size: 10 };
};

/**
 * Helper for form data uploads (files)
 */
export const apiUpload = async (endpoint, formData, options = {}) => {
  // Don't set Content-Type - let browser set it with boundary
  const headers = {
    'X-Requested-With': 'XMLHttpRequest',
    ...(options.headers || {}),
  };
  delete headers['Content-Type'];

  return api(endpoint, {
    method: 'POST',
    body: formData,
    headers,
    ...options,
  });
};

/**
 * Handle authentication failure
 */
const handleAuthenticationFailure = () => {
  tokenManager.clearTokens();
  // Redirect to login - this will be handled by the app's auth context
  window.location.href = '/login?redirect=' + window.location.pathname;
};

/**
 * Login helper - stores tokens securely
 */
export const login = async (email, password) => {
  const response = await api('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (response.ok && response.data.tokens) {
    const { access, refresh } = response.data.tokens;
    tokenManager.setAccessToken(access);
    tokenManager.setRefreshToken(refresh);
    if (response.data.user) {
      localStorage.setItem(TOKEN_STORAGE_KEY_USER, JSON.stringify(response.data.user));
    }
  }

  return response;
};

/**
 * Logout helper - clears tokens
 */
export const logout = () => {
  tokenManager.clearTokens();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = tokenManager.getAccessToken();
  return token && !tokenManager.isTokenExpired(token);
};

/**
 * Get current user from storage
 */
export const getCurrentUser = () => {
  const user = localStorage.getItem(TOKEN_STORAGE_KEY_USER);
  return user ? JSON.parse(user) : null;
};
