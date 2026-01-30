import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Base URL for the API Gateway.
 * Fetched from environment variables (Vite) or defaults to localhost.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Core Axios instance for making HTTP requests.
 * Configured with base URL and default JSON headers.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout for standard requests
});

/**
 * Request Interceptor
 * Automatically attaches the JWT Bearer token to every outgoing request
 * if the user is authenticated.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles global error responses, specifically 401 Unauthorized.
 * If the token expires, it clears local storage to force a re-login.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      console.warn('[API] Session expired or unauthorized. Clearing token.');
      localStorage.removeItem('auth_token');
      // Optional: Redirect to login page
      // window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);