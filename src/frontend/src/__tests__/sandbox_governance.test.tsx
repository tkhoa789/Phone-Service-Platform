import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { isPathSupportedForSandbox, purgeSandboxSession } from '../utils/sandboxUtils';
import { useSandboxGuard } from '../hooks/useSandboxGuard';

// Test harness component to inspect current location after useSandboxGuard runs
const TestLocationSpy: React.FC = () => {
  useSandboxGuard();
  const location = useLocation();
  return (
    <div>
      <span data-testid="pathname">{location.pathname}</span>
      <span data-testid="search">{location.search}</span>
    </div>
  );
};

describe('Enterprise Sandbox & Training Mode Governance', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
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
    vi.clearAllMocks();
  });

  describe('1. Role-Scoped Sandbox Route Validation (isPathSupportedForSandbox)', () => {
    it('allows Inventory role on inventory-related routes and dashboard', () => {
      const inventoryRoles = ['Inventory'];
      expect(isPathSupportedForSandbox('/inventory', inventoryRoles)).toBe(true);
      expect(isPathSupportedForSandbox('/stock-take', inventoryRoles)).toBe(true);
      expect(isPathSupportedForSandbox('/purchase-orders', inventoryRoles)).toBe(true);
      expect(isPathSupportedForSandbox('/products', inventoryRoles)).toBe(true);
      expect(isPathSupportedForSandbox('/warehouses', inventoryRoles)).toBe(true);
      expect(isPathSupportedForSandbox('/suppliers', inventoryRoles)).toBe(true);
      expect(isPathSupportedForSandbox('/dashboard', inventoryRoles)).toBe(true);
    });

    it('rejects Inventory role on non-inventory modules like /repairs, /pos, /customers', () => {
      const inventoryRoles = ['Inventory'];
      expect(isPathSupportedForSandbox('/repairs', inventoryRoles)).toBe(false);
      expect(isPathSupportedForSandbox('/pos', inventoryRoles)).toBe(false);
      expect(isPathSupportedForSandbox('/customers', inventoryRoles)).toBe(false);
      expect(isPathSupportedForSandbox('/users', inventoryRoles)).toBe(false);
    });

    it('allows Technician role on /repairs and /dashboard, but rejects /inventory and /pos', () => {
      const techRoles = ['Technician'];
      expect(isPathSupportedForSandbox('/repairs', techRoles)).toBe(true);
      expect(isPathSupportedForSandbox('/dashboard', techRoles)).toBe(true);
      expect(isPathSupportedForSandbox('/inventory', techRoles)).toBe(false);
      expect(isPathSupportedForSandbox('/pos', techRoles)).toBe(false);
    });

    it('rejects Cashier role on all routes because Cashier has no sandbox module', () => {
      const cashierRoles = ['Cashier'];
      expect(isPathSupportedForSandbox('/repairs', cashierRoles)).toBe(false);
      expect(isPathSupportedForSandbox('/inventory', cashierRoles)).toBe(false);
      expect(isPathSupportedForSandbox('/dashboard', cashierRoles)).toBe(false);
    });

    it('allows Warranty role on /warranties and /dashboard, but rejects /repairs and /inventory', () => {
      const warrantyRoles = ['Warranty'];
      expect(isPathSupportedForSandbox('/warranties', warrantyRoles)).toBe(true);
      expect(isPathSupportedForSandbox('/dashboard', warrantyRoles)).toBe(true);
      expect(isPathSupportedForSandbox('/repairs', warrantyRoles)).toBe(false);
      expect(isPathSupportedForSandbox('/inventory', warrantyRoles)).toBe(false);
    });
  });

  describe('2. Route Guard Automatic Sanitization (useSandboxGuard)', () => {
    it('auto-strips mode=training from /pos when user is Technician', async () => {
      useAuthStore.setState({
        user: { id: 'tech-1', fullName: 'KTV Nam' } as any,
        token: 'valid-jwt',
        roles: ['Technician'],
        isAuthenticated: true,
      });

      render(
        <MemoryRouter initialEntries={['/pos?mode=training&tour=true']}>
          <TestLocationSpy />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('pathname').textContent).toBe('/pos');
        expect(screen.getByTestId('search').textContent).toBe('');
      });
    });

    it('auto-strips mode=training from /repairs when user has Inventory role', async () => {
      useAuthStore.setState({
        user: { id: 'inv-1', fullName: 'Thu Kho An' } as any,
        token: 'valid-jwt',
        roles: ['Inventory'],
        isAuthenticated: true,
      });

      render(
        <MemoryRouter initialEntries={['/repairs?mode=training']}>
          <TestLocationSpy />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('pathname').textContent).toBe('/repairs');
        expect(screen.getByTestId('search').textContent).toBe('');
      });
    });

    it('preserves mode=training on /repairs when user has Technician role', async () => {
      useAuthStore.setState({
        user: { id: 'tech-1', fullName: 'KTV Nam' } as any,
        token: 'valid-jwt',
        roles: ['Technician'],
        isAuthenticated: true,
      });

      render(
        <MemoryRouter initialEntries={['/repairs?mode=training']}>
          <TestLocationSpy />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('pathname').textContent).toBe('/repairs');
        expect(screen.getByTestId('search').textContent).toBe('?mode=training');
      });
    });

    it('preserves mode=training on /inventory when user has Inventory role', async () => {
      useAuthStore.setState({
        user: { id: 'inv-1', fullName: 'Thu Kho An' } as any,
        token: 'valid-jwt',
        roles: ['Inventory'],
        isAuthenticated: true,
      });

      render(
        <MemoryRouter initialEntries={['/inventory?mode=training']}>
          <TestLocationSpy />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('pathname').textContent).toBe('/inventory');
        expect(screen.getByTestId('search').textContent).toBe('?mode=training');
      });
    });

    it('purges lingering sessionStorage flags when a role with zero sandbox capabilities is active', async () => {
      sessionStorage.setItem('psp_sandbox_mode', 'true');
      sessionStorage.setItem('psp_training_mode', 'true');

      useAuthStore.setState({
        user: { id: 'cashier-1', fullName: 'Thu Ngân Lan' } as any,
        token: 'valid-jwt',
        roles: ['Cashier'],
        isAuthenticated: true,
      });

      render(
        <MemoryRouter initialEntries={['/pos']}>
          <TestLocationSpy />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(sessionStorage.getItem('psp_sandbox_mode')).toBeNull();
        expect(sessionStorage.getItem('psp_training_mode')).toBeNull();
      });
    });
  });

  describe('3. Session Teardown Protocol on Logout', () => {
    it('logout() completely removes sandbox and training mode flags from sessionStorage', async () => {
      sessionStorage.setItem('psp_sandbox_mode', 'true');
      sessionStorage.setItem('psp_training_mode', 'true');

      useAuthStore.setState({
        user: { id: 'u1', fullName: 'Demo User' } as any,
        token: 'jwt-123',
        roles: ['Inventory'],
        isAuthenticated: true,
      });

      await useAuthStore.getState().logout();

      expect(sessionStorage.getItem('psp_sandbox_mode')).toBeNull();
      expect(sessionStorage.getItem('psp_training_mode')).toBeNull();
    });
  });
});
