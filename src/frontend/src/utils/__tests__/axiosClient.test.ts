import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { axiosClient, resolveApiBaseUrl } from '../axiosClient';

describe('axiosClient Tracing Headers and Interceptors', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('automatically attaches X-Correlation-ID and X-Request-ID with identical UUID', async () => {
    // Intercept adapter or mock request handling
    const interceptors = axiosClient.interceptors.request as any;
    // The request interceptor handler is registered
    const requestHandler = interceptors.handlers[0].fulfilled;

    const dummyConfig: any = {
      headers: {},
      url: '/test-endpoint',
      method: 'get',
    };

    const resolvedConfig = await requestHandler(dummyConfig);

    expect(resolvedConfig.headers['X-Correlation-ID']).toBeDefined();
    expect(resolvedConfig.headers['X-Request-ID']).toBeDefined();
    expect(resolvedConfig.headers['X-Correlation-ID']).toBe(resolvedConfig.headers['X-Request-ID']);
    // Standard RFC 4122 v4 regex
    expect(resolvedConfig.headers['X-Correlation-ID']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('preserves existing X-Correlation-ID if already provided in headers', async () => {
    const interceptors = axiosClient.interceptors.request as any;
    const requestHandler = interceptors.handlers[0].fulfilled;

    const customId = 'custom-correlation-uuid-12345';
    const dummyConfig: any = {
      headers: {
        'X-Correlation-ID': customId,
      },
      url: '/test-endpoint',
      method: 'get',
    };

    const resolvedConfig = await requestHandler(dummyConfig);

    expect(resolvedConfig.headers['X-Correlation-ID']).toBe(customId);
    expect(resolvedConfig.headers['X-Request-ID']).toBe(customId);
  });

  it('attaches Authorization Bearer token when token exists in localStorage', async () => {
    localStorage.setItem('token', 'mock_jwt_token_sample');

    const interceptors = axiosClient.interceptors.request as any;
    const requestHandler = interceptors.handlers[0].fulfilled;

    const dummyConfig: any = {
      headers: {},
      url: '/test-endpoint',
    };

    const resolvedConfig = await requestHandler(dummyConfig);
    expect(resolvedConfig.headers.Authorization).toBe('Bearer mock_jwt_token_sample');
  });

  it('resolves API base URL correctly in localhost environment', () => {
    const url = resolveApiBaseUrl();
    expect(url).toMatch(/\/api$/);
  });
});
