import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axiosClient } from './axiosClient';
import toast from 'react-hot-toast';

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('axiosClient Interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not toast globally for 400 validation errors', async () => {
    const error = {
      response: {
        status: 400,
        data: { errors: { name: ['Name is required'] } },
      },
      config: { url: '/Branch' },
    };

    // Assuming the interceptor is accessible or testing through a mock server
    // For now we test the interceptor's reject behavior
    const responseInterceptorErrorFunc = (axiosClient.interceptors.response as any).handlers[0].rejected;
    
    await expect(responseInterceptorErrorFunc(error)).rejects.toEqual(error);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should toast for 403 Forbidden', async () => {
    const error = {
      response: { status: 403 },
      config: { url: '/Branch' },
    };

    const responseInterceptorErrorFunc = (axiosClient.interceptors.response as any).handlers[0].rejected;
    
    await expect(responseInterceptorErrorFunc(error)).rejects.toEqual(error);
    expect(toast.error).toHaveBeenCalledWith('Bạn không có quyền thực hiện thao tác này.', expect.any(Object));
  });

  it('should toast for 500 Server Error', async () => {
    const error = {
      response: { status: 500 },
      config: { url: '/Branch', headers: { 'X-Request-ID': 'test-123' } },
    };

    const responseInterceptorErrorFunc = (axiosClient.interceptors.response as any).handlers[0].rejected;
    
    await expect(responseInterceptorErrorFunc(error)).rejects.toEqual(error);
    expect(toast.error).toHaveBeenCalledWith('Lỗi hệ thống. Mã sự cố: test-123', expect.any(Object));
  });
});
