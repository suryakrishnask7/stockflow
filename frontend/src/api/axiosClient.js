import axios from 'axios';

const API_BASE = '/api';

const axiosClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT access token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stockflow_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for automatic token refresh or logout
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('stockflow_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = res.data;

          localStorage.setItem('stockflow_access_token', accessToken);
          localStorage.setItem('stockflow_refresh_token', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosClient(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('stockflow_access_token');
          localStorage.removeItem('stockflow_refresh_token');
          localStorage.removeItem('stockflow_user');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('stockflow_access_token');
        localStorage.removeItem('stockflow_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
