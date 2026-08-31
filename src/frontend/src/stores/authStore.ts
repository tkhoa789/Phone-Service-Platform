import { create } from 'zustand';
import type { UserDto, AuthResponseDto, LoginCommand } from '../types/api.types';
import { authService } from '../services/authService';

interface AuthState {
  user: UserDto | null;
  token: string | null;
  refreshToken: string | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (command: LoginCommand) => Promise<AuthResponseDto>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  roles: JSON.parse(localStorage.getItem('roles') || '[]'),
  permissions: JSON.parse(localStorage.getItem('permissions') || '[]'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  initialize: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const rolesStr = localStorage.getItem('roles');
    const permissionsStr = localStorage.getItem('permissions');

    if (token && userStr) {
      try {
        set({
          token,
          user: JSON.parse(userStr),
          roles: rolesStr ? JSON.parse(rolesStr) : [],
          permissions: permissionsStr ? JSON.parse(permissionsStr) : [],
          isAuthenticated: true,
        });
      } catch (e) {
        console.error('Failed to restore auth session', e);
        get().logout();
      }
    }
  },

  login: async (command: LoginCommand) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(command);
      
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('roles', JSON.stringify(data.roles));
      localStorage.setItem('permissions', JSON.stringify(data.permissions));

      set({
        token: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
        roles: data.roles,
        permissions: data.permissions,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản!';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      set({
        user: null,
        token: null,
        refreshToken: null,
        roles: [],
        permissions: [],
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  hasPermission: (permission: string) => {
    const { roles, permissions } = get();
    if (roles.includes('Admin')) return true;
    return permissions.includes(permission);
  },

  hasRole: (role: string) => {
    const { roles } = get();
    return roles.includes(role);
  },
}));
