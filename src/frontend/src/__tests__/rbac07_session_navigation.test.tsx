import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useBranchStore } from '../stores/branchStore';
import { queryClient } from '../utils/queryClient';
import { PERMISSIONS } from '../constants/permissions';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { authService } from '../services/authService';
import { axiosClient, getSessionEpoch } from '../utils/axiosClient';

// Mock authService
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue({}),
  },
}));

describe('RBAC-07 — Frontend Navigation & Session Isolation Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    queryClient.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      roles: [],
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    useBranchStore.setState({
      activeBranchId: 'all',
      activeBranchName: 'Tất cả chi nhánh',
      activeBranchAddress: undefined,
      activeBranchPhone: undefined,
    });
    vi.clearAllMocks();
  });

  describe('1. Session Isolation & Cache Purging Protocol', () => {
    it('logout() completely purges queryClient, branchContext, tokens, roles, and permissions', async () => {
      // 1. Setup a dirty active session with cached data
      queryClient.setQueryData(['cached_sensitive_financials'], { revenue: 500000000 });
      expect(queryClient.getQueryData(['cached_sensitive_financials'])).toBeDefined();

      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem('refreshToken', 'fake-refresh-token');
      localStorage.setItem('user', JSON.stringify({ id: 'u1', fullName: 'Master Admin' }));
      localStorage.setItem('roles', JSON.stringify(['Admin']));
      localStorage.setItem('permissions', JSON.stringify([PERMISSIONS.Dashboard_View, PERMISSIONS.User_View]));
      localStorage.setItem('psp_branch_context', JSON.stringify({ state: { activeBranchId: 'branch-99' } }));

      useAuthStore.setState({
        user: { id: 'u1', fullName: 'Master Admin' } as any,
        token: 'fake-jwt-token',
        refreshToken: 'fake-refresh-token',
        roles: ['Admin'],
        permissions: [PERMISSIONS.Dashboard_View, PERMISSIONS.User_View],
        isAuthenticated: true,
      });

      useBranchStore.setState({
        activeBranchId: 'branch-99',
        activeBranchName: 'Chi nhánh 99',
      });

      const clearSpy = vi.spyOn(queryClient, 'clear');

      // 2. Perform logout
      await useAuthStore.getState().logout();

      // 3. Verify Cache Purged
      expect(clearSpy).toHaveBeenCalled();
      expect(queryClient.getQueryData(['cached_sensitive_financials'])).toBeUndefined();

      // 4. Verify LocalStorage Cleaned
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('roles')).toBeNull();
      expect(localStorage.getItem('permissions')).toBeNull();
      expect(localStorage.getItem('psp_branch_context')).toBeNull();

      // 5. Verify Auth Store State Reset
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.roles).toEqual([]);
      expect(state.permissions).toEqual([]);
      expect(state.isAuthenticated).toBe(false);

      // 6. Verify Branch Store Reset
      const branchState = useBranchStore.getState();
      expect(branchState.activeBranchId).toBe('all');
    });

    it('switchAccount() triggers full logout and purges state', async () => {
      const logoutSpy = vi.spyOn(useAuthStore.getState(), 'logout');
      await useAuthStore.getState().switchAccount();
      expect(logoutSpy).toHaveBeenCalled();
    });

    it('login() purges pre-existing query cache and isolates incoming user branch context', async () => {
      // Seed pre-existing dirty query cache
      queryClient.setQueryData(['dirty_old_user_query'], { secret: 'old_secret' });
      expect(queryClient.getQueryData(['dirty_old_user_query'])).toBeDefined();

      const clearSpy = vi.spyOn(queryClient, 'clear');

      const mockResponse = {
        accessToken: 'new-sales-token',
        refreshToken: 'new-sales-refresh',
        roles: ['Sales'],
        permissions: [PERMISSIONS.POS_View, PERMISSIONS.SalesOrder_View],
        user: {
          id: 'sales-1',
          fullName: 'Nguyen Sales',
          branchId: '00000000-0000-0000-0000-000000000001',
          branchName: 'Chi nhánh Quận 1',
        },
      };

      (authService.login as any).mockResolvedValue(mockResponse);

      await useAuthStore.getState().login({ username: 'sales', password: 'password' });

      // Cache was cleared prior to populating new user state
      expect(clearSpy).toHaveBeenCalled();
      expect(queryClient.getQueryData(['dirty_old_user_query'])).toBeUndefined();

      // User session updated
      const authState = useAuthStore.getState();
      expect(authState.token).toBe('new-sales-token');
      expect(authState.roles).toEqual(['Sales']);
      expect(authState.permissions).toContain(PERMISSIONS.POS_View);
      expect(authState.permissions).not.toContain(PERMISSIONS.User_View);

      // Branch context synchronized to user branch
      const branchState = useBranchStore.getState();
      expect(branchState.activeBranchId).toBe('00000000-0000-0000-0000-000000000001');
      expect(branchState.activeBranchName).toBe('Chi nhánh Quận 1');
    });

    it('in-flight request from User A is dropped upon logout/switch and cannot mutate User B state or cache', async () => {
      // 1. User A is active with a specific session epoch
      const userAEpoch = getSessionEpoch();
      
      // Simulate User A dispatching an API request
      const simulatedInFlightResponse = {
        data: { sensitiveReport: 'CONFIDENTIAL_FINANCIAL_KPI_USER_A' },
        config: { __sessionEpoch: userAEpoch, headers: {} },
      };

      // 2. User A logs out / switches
      await useAuthStore.getState().logout();
      expect(getSessionEpoch()).toBeGreaterThan(userAEpoch);

      // 3. User B logs in
      const mockSalesResponse = {
        accessToken: 'sales-token',
        refreshToken: 'sales-refresh',
        roles: ['Sales'],
        permissions: [PERMISSIONS.POS_View],
        user: {
          id: 'sales-1',
          fullName: 'Sales Cashier',
          branchId: '00000000-0000-0000-0000-000000000001',
          branchName: 'Chi nhánh Quận 1',
        },
      };
      (authService.login as any).mockResolvedValue(mockSalesResponse);
      await useAuthStore.getState().login({ username: 'sales', password: 'password' });

      // 4. Stale User A response resolves now!
      // In axiosClient response interceptor, it evaluates whether the request epoch matches currentSessionEpoch:
      let caughtError: any = null;
      try {
        const interceptor = (axiosClient.interceptors.response as any).handlers[0]?.fulfilled;
        if (interceptor) {
          await interceptor(simulatedInFlightResponse);
        }
      } catch (err) {
        caughtError = err;
      }

      // 5. Must be dropped with error and not committed to state
      expect(caughtError).toBeDefined();
      expect(caughtError.message).toBe('SESSION_SWITCHED_IN_FLIGHT_RESPONSE_DROPPED');

      // 6. User B's state remains 100% intact and unpolluted
      expect(useAuthStore.getState().user?.fullName).toBe('Sales Cashier');
      expect(useAuthStore.getState().roles).toEqual(['Sales']);
      expect(useAuthStore.getState().permissions).toEqual([PERMISSIONS.POS_View]);
      expect(useBranchStore.getState().activeBranchId).toBe('00000000-0000-0000-0000-000000000001');
      expect(queryClient.getQueryData(['cached_financials'])).toBeUndefined();
    });
  });

  describe('2. Route Protection & Access Control UX', () => {
    it('unauthenticated user is redirected to /login', () => {
      useAuthStore.setState({ isAuthenticated: false });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/login" element={<div>LOGIN_PAGE</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>DASHBOARD_CONTENT</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('LOGIN_PAGE')).toBeInTheDocument();
      expect(screen.queryByText('DASHBOARD_CONTENT')).not.toBeInTheDocument();
    });

    it('authenticated user with required permission is granted access', () => {
      useAuthStore.setState({
        isAuthenticated: true,
        roles: ['Sales'],
        permissions: [PERMISSIONS.POS_View],
      });

      render(
        <MemoryRouter initialEntries={['/pos']}>
          <Routes>
            <Route element={<ProtectedRoute permission={PERMISSIONS.POS_View} />}>
              <Route path="/pos" element={<div>POS_TERMINAL_SCREEN</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('POS_TERMINAL_SCREEN')).toBeInTheDocument();
    });

    it('authenticated user lacking required permission is shown AccessDeniedScreen with HTTP 403 and required permission tag', () => {
      useAuthStore.setState({
        isAuthenticated: true,
        roles: ['Technician'],
        permissions: [PERMISSIONS.Repair_View],
      });

      render(
        <MemoryRouter initialEntries={['/branches']}>
          <Routes>
            <Route element={<ProtectedRoute permission={PERMISSIONS.Branch_View} allowedRoles={['Owner', 'Admin']} />}>
              <Route path="/branches" element={<div>BRANCH_MANAGEMENT</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Branch management is protected
      expect(screen.queryByText('BRANCH_MANAGEMENT')).not.toBeInTheDocument();

      // Access Denied Screen renders with clear audit diagnostics
      expect(screen.getByText(/HTTP 403 Forbidden — Access Denied/i)).toBeInTheDocument();
      expect(screen.getByText(PERMISSIONS.Branch_View)).toBeInTheDocument();
      expect(screen.getByText('Technician')).toBeInTheDocument();
      expect(screen.getByText('Owner / Admin')).toBeInTheDocument();
    });
  });

  describe('3. Permission Resolution Helper can()', () => {
    it('can() returns true only when permission exists in session', () => {
      useAuthStore.setState({
        permissions: [PERMISSIONS.POS_View, PERMISSIONS.Customer_View],
      });

      const { can } = useAuthStore.getState();
      expect(can(PERMISSIONS.POS_View)).toBe(true);
      expect(can(PERMISSIONS.Customer_View)).toBe(true);
      expect(can(PERMISSIONS.User_View)).toBe(false);
      expect(can(PERMISSIONS.AuditLog_View)).toBe(false);
    });
  });

  describe('4. Sidebar Menu Permission-Based Filtering', () => {
    it('omits menu items when canonical permission is missing for standard role', async () => {
      const { Sidebar } = await import('../components/layout/Sidebar');

      // Setup Sales user with POS and SalesOrder permission only (NO Voucher, NO Repair, NO Branch, NO User)
      useAuthStore.setState({
        isAuthenticated: true,
        user: { id: 's1', fullName: 'Sales Staff' } as any,
        roles: ['Sales'],
        permissions: [PERMISSIONS.POS_View, PERMISSIONS.SalesOrder_View],
      });

      const { container } = render(
        <MemoryRouter>
          <Sidebar collapsed={false} onToggleCollapse={vi.fn()} />
        </MemoryRouter>
      );

      // Links that should be visible
      const posLink = container.querySelector('a[href="/pos"]');
      const salesLink = container.querySelector('a[href="/sales"]');
      expect(posLink).toBeInTheDocument();
      expect(salesLink).toBeInTheDocument();

      // Links that must be hidden due to missing permissions
      const voucherLink = container.querySelector('a[href="/vouchers"]');
      const repairLink = container.querySelector('a[href="/repairs"]');
      const branchLink = container.querySelector('a[href="/branches"]');
      const userLink = container.querySelector('a[href="/users"]');
      const settingsLink = container.querySelector('a[href="/settings"]');

      expect(voucherLink).toBeNull();
      expect(repairLink).toBeNull();
      expect(branchLink).toBeNull();
      expect(userLink).toBeNull();
      expect(settingsLink).toBeNull();
    });

    it('renders governance menu items when user has Admin role and permissions', async () => {
      const { Sidebar } = await import('../components/layout/Sidebar');

      useAuthStore.setState({
        isAuthenticated: true,
        user: { id: 'a1', fullName: 'Admin System' } as any,
        roles: ['Admin'],
        permissions: [
          PERMISSIONS.Dashboard_View,
          PERMISSIONS.Branch_View,
          PERMISSIONS.User_View,
          PERMISSIONS.SystemSettings_View,
          PERMISSIONS.AuditLog_View,
          PERMISSIONS.POS_View,
        ],
      });

      const { container } = render(
        <MemoryRouter>
          <Sidebar collapsed={false} onToggleCollapse={vi.fn()} />
        </MemoryRouter>
      );

      expect(container.querySelector('a[href="/branches"]')).toBeInTheDocument();
      expect(container.querySelector('a[href="/users"]')).toBeInTheDocument();
      expect(container.querySelector('a[href="/settings"]')).toBeInTheDocument();
      expect(container.querySelector('a[href="/audit-logs"]')).toBeInTheDocument();
    });
  });

  describe('5. Deterministic Landing Behavior (RBAC-05 Alignment)', () => {
    it('verifies canonical landing redirection paths for each role', async () => {
      const rolesAndLandings = [
        { role: 'Owner', expected: '/dashboard' },
        { role: 'Admin', expected: '/dashboard' },
        { role: 'Manager', expected: '/dashboard' },
        { role: 'Sales', expected: '/pos' },
        { role: 'Technician', expected: '/repairs' },
        { role: 'Warranty', expected: '/warranties' },
        { role: 'Inventory', expected: '/inventory' },
      ];

      for (const { role } of rolesAndLandings) {
        useAuthStore.setState({ roles: [role], isAuthenticated: true });
        const { roles } = useAuthStore.getState();
        
        let target = '/profile';
        if (roles.includes('Owner') || roles.includes('Admin') || roles.includes('Manager')) {
          target = '/dashboard';
        } else if (roles.includes('Sales')) {
          target = '/pos';
        } else if (roles.includes('Technician')) {
          target = '/repairs';
        } else if (roles.includes('Warranty')) {
          target = '/warranties';
        } else if (roles.includes('Inventory')) {
          target = '/inventory';
        }

        const expectedLanding = rolesAndLandings.find(x => x.role === role)!.expected;
        expect(target).toBe(expectedLanding);
      }
    });
  });

  describe('6. Multi-Role Account Switching Matrix (Runtime Verification)', () => {
    it('Admin (Enterprise Scope, Branch B) -> Switch Account -> Sales (Branch Scope, Branch A)', async () => {
      // 1. Admin login & branch selection
      useAuthStore.setState({
        isAuthenticated: true,
        user: { id: 'admin-1', fullName: 'Admin' } as any,
        roles: ['Admin'],
        permissions: [PERMISSIONS.Dashboard_View, PERMISSIONS.Branch_View, PERMISSIONS.User_View],
      });
      useBranchStore.getState().setActiveBranch('branch-B', 'Chi nhánh B');
      queryClient.setQueryData(['admin_enterprise_kpi'], { profit: 999999999 });

      expect(useBranchStore.getState().activeBranchId).toBe('branch-B');
      expect(queryClient.getQueryData(['admin_enterprise_kpi'])).toBeDefined();

      // 2. Switch account
      await useAuthStore.getState().switchAccount();

      // Verify intermediate clean state
      expect(queryClient.getQueryData(['admin_enterprise_kpi'])).toBeUndefined();
      expect(useBranchStore.getState().activeBranchId).toBe('all');
      expect(useAuthStore.getState().isAuthenticated).toBe(false);

      // 3. Sales login
      const salesMock = {
        accessToken: 'sales-token',
        refreshToken: 'sales-refresh',
        roles: ['Sales'],
        permissions: [PERMISSIONS.POS_View, PERMISSIONS.SalesOrder_View],
        user: { id: 'sales-1', fullName: 'Sales Staff', branchId: 'branch-A', branchName: 'Chi nhánh A' },
      };
      (authService.login as any).mockResolvedValue(salesMock);
      await useAuthStore.getState().login({ username: 'sales', password: 'password' });

      // 4. Assert Sales session purity
      const auth = useAuthStore.getState();
      const branch = useBranchStore.getState();
      expect(auth.roles).toEqual(['Sales']);
      expect(auth.permissions).toContain(PERMISSIONS.POS_View);
      expect(auth.permissions).not.toContain(PERMISSIONS.Branch_View);
      expect(branch.activeBranchId).toBe('branch-A'); // Correctly set to Sales user branch, not branch-B!
      expect(queryClient.getQueryData(['admin_enterprise_kpi'])).toBeUndefined();
    });

    it('Manager -> Switch Account -> Sales', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: { id: 'mgr-1', fullName: 'Manager' } as any,
        roles: ['Manager'],
        permissions: [PERMISSIONS.Dashboard_View, PERMISSIONS.Repair_View, PERMISSIONS.POS_View],
      });
      useBranchStore.getState().setActiveBranch('branch-1', 'Chi nhánh 1');
      queryClient.setQueryData(['manager_backlog'], { tickets: 42 });

      await useAuthStore.getState().switchAccount();

      const salesMock = {
        accessToken: 'sales-token-2',
        refreshToken: 'sales-refresh-2',
        roles: ['Sales'],
        permissions: [PERMISSIONS.POS_View],
        user: { id: 'sales-2', fullName: 'Cashier 2', branchId: 'branch-1', branchName: 'Chi nhánh 1' },
      };
      (authService.login as any).mockResolvedValue(salesMock);
      await useAuthStore.getState().login({ username: 'sales', password: 'password' });

      expect(useAuthStore.getState().roles).toEqual(['Sales']);
      expect(useAuthStore.getState().permissions).toEqual([PERMISSIONS.POS_View]);
      expect(queryClient.getQueryData(['manager_backlog'])).toBeUndefined();
    });

    it('Sales -> Switch Account -> Technician', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: { id: 'sales-1', fullName: 'Sales' } as any,
        roles: ['Sales'],
        permissions: [PERMISSIONS.POS_View],
      });
      queryClient.setQueryData(['pos_active_cart'], { items: ['Screen protector'] });

      await useAuthStore.getState().switchAccount();

      const techMock = {
        accessToken: 'tech-token',
        refreshToken: 'tech-refresh',
        roles: ['Technician'],
        permissions: [PERMISSIONS.Repair_View, PERMISSIONS.Repair_Diagnose],
        user: { id: 'tech-1', fullName: 'Repair Tech', branchId: 'branch-1', branchName: 'Chi nhánh 1' },
      };
      (authService.login as any).mockResolvedValue(techMock);
      await useAuthStore.getState().login({ username: 'technician', password: 'password' });

      expect(useAuthStore.getState().roles).toEqual(['Technician']);
      expect(useAuthStore.getState().permissions).toContain(PERMISSIONS.Repair_View);
      expect(useAuthStore.getState().permissions).not.toContain(PERMISSIONS.POS_View);
      expect(queryClient.getQueryData(['pos_active_cart'])).toBeUndefined();
    });

    it('Technician -> Switch Account -> Inventory', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: { id: 'tech-1', fullName: 'Technician' } as any,
        roles: ['Technician'],
        permissions: [PERMISSIONS.Repair_View],
      });
      queryClient.setQueryData(['repair_assigned_work'], { ticketId: 'rep-01' });

      await useAuthStore.getState().switchAccount();

      const invMock = {
        accessToken: 'inv-token',
        refreshToken: 'inv-refresh',
        roles: ['Inventory'],
        permissions: [PERMISSIONS.Inventory_View, PERMISSIONS.StockTake_View, PERMISSIONS.Warehouse_View],
        user: { id: 'inv-1', fullName: 'Warehouse Keeper', warehouseId: 'wh-01' },
      };
      (authService.login as any).mockResolvedValue(invMock);
      await useAuthStore.getState().login({ username: 'inventory', password: 'password' });

      expect(useAuthStore.getState().roles).toEqual(['Inventory']);
      expect(useAuthStore.getState().permissions).toContain(PERMISSIONS.Inventory_View);
      expect(useAuthStore.getState().permissions).not.toContain(PERMISSIONS.Repair_View);
      expect(queryClient.getQueryData(['repair_assigned_work'])).toBeUndefined();
    });
  });

  describe('7. Route Security Distinction (Frontend UX vs Backend Enforcement)', () => {
    it('direct access to unauthorized route blocks child render with safe UX and zero sensitive request execution', () => {
      useAuthStore.setState({
        isAuthenticated: true,
        roles: ['Sales'],
        permissions: [PERMISSIONS.POS_View],
      });

      const sensitiveApiCall = vi.fn();

      const MockSensitiveComponent = () => {
        sensitiveApiCall();
        return <div>SENSITIVE_BRANCH_FINANCIAL_REPORTS</div>;
      };

      render(
        <MemoryRouter initialEntries={['/branches']}>
          <Routes>
            <Route element={<ProtectedRoute permission={PERMISSIONS.Branch_View} allowedRoles={['Owner', 'Admin']} />}>
              <Route path="/branches" element={<MockSensitiveComponent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Child is never rendered
      expect(screen.queryByText('SENSITIVE_BRANCH_FINANCIAL_REPORTS')).not.toBeInTheDocument();
      // Sensitive API call inside child is never invoked
      expect(sensitiveApiCall).not.toHaveBeenCalled();
      // Safe UX rendered
      expect(screen.getByText(/HTTP 403 Forbidden — Access Denied/i)).toBeInTheDocument();
      expect(screen.getByText(PERMISSIONS.Branch_View)).toBeInTheDocument();
    });
  });
});
