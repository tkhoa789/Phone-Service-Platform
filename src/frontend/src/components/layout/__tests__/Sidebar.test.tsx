import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';

// Mock useAuthStore
let mockAuthState: any = {
  user: { fullName: 'Admin User', email: 'admin@psp.vn' },
  roles: ['Admin', 'Owner'],
  hasRole: () => true,
  hasPermission: () => true,
  can: () => true,
  logout: vi.fn(),
};

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => mockAuthState,
}));

// Mock useThemeStore
vi.mock('@/stores/themeStore', () => ({
  useThemeStore: () => ({
    language: 'vi',
  }),
}));

// Mock useSystemStore
vi.mock('@/stores/systemStore', () => ({
  useSystemStore: () => ({
    settings: { systemName: 'PSP Test' },
  }),
}));

describe('Sidebar Component & Mobile Drawer (BUG-09 Regression)', () => {
  it('renders with translation off-screen when mobileMenuOpen is false', () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar collapsed={false} onToggleCollapse={vi.fn()} mobileMenuOpen={false} onMobileMenuClose={vi.fn()} />
      </MemoryRouter>
    );

    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('-translate-x-full');
    expect(aside).not.toHaveClass('translate-x-0');
  });

  it('slides into view with translate-x-0 when mobileMenuOpen is true', () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar collapsed={false} onToggleCollapse={vi.fn()} mobileMenuOpen={true} onMobileMenuClose={vi.fn()} />
      </MemoryRouter>
    );

    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('translate-x-0');
  });

  it('renders backdrop overlay when open and triggers onMobileMenuClose on click', () => {
    const closeFn = vi.fn();
    const { container } = render(
      <MemoryRouter>
        <Sidebar collapsed={false} onToggleCollapse={vi.fn()} mobileMenuOpen={true} onMobileMenuClose={closeFn} />
      </MemoryRouter>
    );

    const backdrop = container.querySelector('.bg-black\\/60');
    expect(backdrop).toBeInTheDocument();
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(closeFn).toHaveBeenCalled();
    }
  });

  it('calls onMobileMenuClose when Escape key is pressed', () => {
    const closeFn = vi.fn();
    render(
      <MemoryRouter>
        <Sidebar collapsed={false} onToggleCollapse={vi.fn()} mobileMenuOpen={true} onMobileMenuClose={closeFn} />
      </MemoryRouter>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closeFn).toHaveBeenCalled();
  });

  describe('Role-Aware Dashboard Tab Availability', () => {
    const canonicalRoles = ['Owner', 'Admin', 'Manager', 'Sales', 'Technician', 'Warranty', 'Inventory'];

    canonicalRoles.forEach((role) => {
      it(`renders Dashboard link for ${role}`, () => {
        mockAuthState = {
          user: { fullName: `${role} User`, email: `${role.toLowerCase()}@psp.vn` },
          roles: [role],
          hasRole: (r: string) => r === role,
          hasPermission: () => true,
          can: () => true,
          logout: vi.fn(),
        };

        const { container } = render(
          <MemoryRouter>
            <Sidebar collapsed={false} onToggleCollapse={vi.fn()} />
          </MemoryRouter>
        );

        const dashboardLinks = container.querySelectorAll('a[href="/dashboard"]');
        expect(dashboardLinks.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
