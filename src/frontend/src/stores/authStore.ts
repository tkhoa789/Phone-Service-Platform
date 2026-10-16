import { create } from 'zustand';
import type { UserDto, AuthResponseDto, LoginCommand } from '../types/api.types';
import { authService } from '../services/authService';
import { purgeQueryCache } from '../utils/queryClient';
import { incrementSessionEpoch } from '../utils/axiosClient';
import { useBranchStore } from './branchStore';

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
  switchAccount: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  can: (permission: string) => boolean;
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
      // 1. Session Isolation Precondition: Advance session epoch & purge prior cache
      incrementSessionEpoch();
      purgeQueryCache();
      try {
        localStorage.removeItem('psp_branch_context');
      } catch {
        // Safe fail
      }

      const data = await authService.login(command);
      
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('roles', JSON.stringify(data.roles));
      localStorage.setItem('permissions', JSON.stringify(data.permissions));

      // 2. Set Branch Context for newly authenticated session
      if (data.user?.branchId) {
        useBranchStore.getState().setActiveBranch(
          data.user.branchId,
          data.user.branchName || 'Chi nhánh mặc định',
          data.user.branchAddress,
          data.user.branchPhone
        );
      } else {
        useBranchStore.getState().resetBranch();
      }

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
    } catch (e) {
      console.warn('Logout notification to backend was not successful or user was already unauthenticated', e);
    } finally {
      // RBAC-07 Session Isolation & Cache Purge Protocol
      incrementSessionEpoch();
      purgeQueryCache();
      useBranchStore.getState().resetBranch();

      try {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('roles');
        localStorage.removeItem('permissions');
        localStorage.removeItem('psp_branch_context');
        sessionStorage.removeItem('psp_sandbox_mode');
        sessionStorage.removeItem('psp_training_mode');
      } catch {
        // Safe fail
      }

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

  switchAccount: async () => {
    await get().logout();
  },

  hasPermission: (permission: string) => {
    const { permissions } = get();
    return permissions.some((p) => p.toLowerCase() === permission.toLowerCase());
  },

  can: (permission: string) => {
    return get().hasPermission(permission);
  },

  hasRole: (role: string) => {
    const { roles } = get();
    return roles.some((r) => r.toLowerCase() === role.toLowerCase());
  },
}));
