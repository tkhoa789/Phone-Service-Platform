import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { purgeQueryCache } from './queryClient';

// Generate a simple UUID-like string for Correlation ID
function generateCorrelationId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// API Base URL - reads VITE_API_BASE_URL from .env, falls back to VITE_API_URL, or relative '/api' for Vite/Nginx proxy
export const resolveApiBaseUrl = (): string => {
  // Dynamic Network Guard: When running in a browser accessed via a LAN/Wi-Fi IP (e.g., 192.168.x.x from phone/tablet),
  // using absolute 'http://localhost:5000' would fail on the mobile device.
  // Using relative '/api' routes the traffic through Vite's dev proxy cleanly across all network devices without CORS.
  if (
    typeof window !== 'undefined' &&
    window.location &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return '/api';
  }

  let url = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api').trim();
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url.endsWith('/api') ? url : `${url}/api`;
};

const API_BASE_URL = resolveApiBaseUrl();

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Flag to prevent multiple refresh token calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Session Epoch Tracker (RBAC-07 In-Flight Safety Guard)
let currentSessionEpoch = 1;

export const incrementSessionEpoch = (): number => {
  currentSessionEpoch += 1;
  return currentSessionEpoch;
};

export const getSessionEpoch = (): number => {
  return currentSessionEpoch;
};

// Request Interceptor: Attach Access Token & Correlation ID & Session Epoch
axiosClient.interceptors.request.use(
  (config) => {
    (config as any).__sessionEpoch = currentSessionEpoch;
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Inject Correlation ID
    if (config.headers) {
      const correlationId = (config.headers['X-Correlation-ID'] as string) || (config.headers['X-Request-ID'] as string) || generateCorrelationId();
      config.headers['X-Correlation-ID'] = correlationId;
      config.headers['X-Request-ID'] = correlationId; // giữ tương thích ngược
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiration (401) & Architectural Errors
axiosClient.interceptors.response.use(
  (response) => {
    // Drop in-flight responses if session was switched or logged out
    const requestEpoch = (response.config as any)?.__sessionEpoch;
    if (requestEpoch !== undefined && requestEpoch !== currentSessionEpoch) {
      return Promise.reject(new Error('SESSION_SWITCHED_IN_FLIGHT_RESPONSE_DROPPED'));
    }
    return response;
  },
  async (error: AxiosError | any) => {
    // Drop in-flight error responses if session was switched or logged out
    const requestEpoch = (error?.config as any)?.__sessionEpoch;
    if (requestEpoch !== undefined && requestEpoch !== currentSessionEpoch) {
      return Promise.reject(new Error('SESSION_SWITCHED_IN_FLIGHT_RESPONSE_DROPPED'));
    }
    // 1. Network / Connectivity Failure
    if (!error.response) {
      toast.error('Lỗi kết nối mạng. Vui lòng kiểm tra internet và lịch sử giao dịch trước khi thử lại.', { duration: 5000 });
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    const status = error.response.status;
    const correlationId = originalRequest?.headers?.['X-Correlation-ID'] || originalRequest?.headers?.['X-Request-ID'] || 'UNKNOWN';

    // 2. 401 Unauthorized & Token Rotation
    if (status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/Auth/login') || originalRequest.url?.includes('/Auth/refresh-token')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      const token = localStorage.getItem('token');

      if (!refreshToken || !token) {
        isRefreshing = false;
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('roles');
          localStorage.removeItem('permissions');
          localStorage.removeItem('psp_branch_context');
          purgeQueryCache();
        } catch {}
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/Auth/refresh-token`, {
          token,
          refreshToken,
        });

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        localStorage.setItem('token', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('roles');
          localStorage.removeItem('permissions');
          localStorage.removeItem('psp_branch_context');
          purgeQueryCache();
        } catch {}
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 3. 403 Forbidden
    if (status === 403) {
      toast.error('Bạn không có quyền thực hiện thao tác này.', { id: 'forbidden-toast' });
      // Propagate down so calling code can un-spin buttons
      return Promise.reject(error);
    }

    // 4. 404 Not Found
    if (status === 404) {
      // Don't toast globally for 404 since it might be handled by UI specific empty state, but log it.
      console.warn(`[404] Resource not found: ${originalRequest.url}`);
    }

    // 5. 409 Conflict
    if (status === 409) {
      const problemType = error.response.data?.type || error.response.data?.code;
      // We toast a generic conflict if no specific type is provided, but allow UI to catch it.
      if (problemType === 'STOCK_CHANGED' || problemType === 'ROW_VERSION_CONFLICT') {
        toast.error('Dữ liệu đã thay đổi bởi người khác. Vui lòng tải lại trang.', { duration: 6000 });
      } else {
        toast.error(error.response.data?.message || 'Xung đột dữ liệu. Vui lòng kiểm tra lại.', { duration: 4000 });
      }
      return Promise.reject(error);
    }

    // 6. 500 Server Error
    if (status >= 500) {
      toast.error(`Lỗi hệ thống. Mã sự cố: ${correlationId}`, { duration: 6000 });
    }

    // 400 Validation will just pass through so RHF / components can handle it
    return Promise.reject(error);
  }
);
