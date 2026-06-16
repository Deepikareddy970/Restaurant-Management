export const API_BASE_URL = 'http://https://restaurant-management-backend-28nv.onrender.com/api';
export const FILE_BASE_URL = 'http://https://restaurant-management-backend-28nv.onrender.com';

let accessToken = null;
let refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');

export const setTokens = (access, refresh, rememberMe = false) => {
  accessToken = access;
  if (refresh) {
    refreshToken = refresh;
    if (rememberMe) {
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('rememberMe', 'true');
    } else {
      sessionStorage.setItem('refreshToken', refresh);
    }
  }
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('rememberMe');
  sessionStorage.removeItem('refreshToken');
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  options.headers = options.headers || {};

  if (accessToken) {
    options.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Do not set Content-Type if uploading file using FormData
  if (!(options.body instanceof FormData)) {
    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
  }

  let response = await fetch(url, options);

  // If token expired, try rotating it automatically
  if (response.status === 401 && refreshToken) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: refreshToken }),
      });
      const refreshData = await refreshRes.json();

      if (refreshData.success) {
        const rememberMe = localStorage.getItem('rememberMe') === 'true';
        setTokens(refreshData.accessToken, refreshData.refreshToken, rememberMe);

        // Retry the request with new token
        options.headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
        response = await fetch(url, options);
      } else {
        clearTokens();
        window.dispatchEvent(new Event('unauthorized_logout'));
      }
    } catch (error) {
      console.error('[API] Failed to refresh access token:', error);
      clearTokens();
      window.dispatchEvent(new Event('unauthorized_logout'));
    }
  }

  return response;
};
