import { axiosClient } from '../utils/axiosClient';
import type { ApiResponse, AuthResponseDto, LoginCommand } from '../types/api.types';

export const authService = {
  login: async (command: LoginCommand): Promise<AuthResponseDto> => {
    const response = await axiosClient.post<ApiResponse<AuthResponseDto>>('/Auth/login', command);
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await axiosClient.post('/Auth/logout', { refreshToken });
    } catch (e) {
      console.warn('Logout API failed, cleaning local storage anyway', e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('roles');
      localStorage.removeItem('permissions');
    }
  },

  refreshToken: async (token: string, refreshToken: string): Promise<AuthResponseDto> => {
    const response = await axiosClient.post<ApiResponse<AuthResponseDto>>('/Auth/refresh-token', {
      token,
      refreshToken,
    });
    return response.data.data;
  },
};
