/**
 * Enterprise Sandbox & Training Mode Governance Utilities
 *
 * Implements strict role-scoped route validation and session teardown protocol.
 */

// Mapping of supported base paths per canonical role
export const SANDBOX_SUPPORTED_ROUTES: Record<string, string[]> = {
  Inventory: [
    '/dashboard',
    '/inventory',
    '/stock-take',
    '/purchase-orders',
    '/products',
    '/warehouses',
    '/suppliers',
  ],
  Warranty: [
    '/dashboard',
    '/warranties',
  ],
  Technician: [
    '/dashboard',
    '/repairs',
  ],
  Sales: [
    '/dashboard',
    '/pos',
    '/sales',
    '/customers',
    '/products',
  ],
  Owner: [
    '/dashboard',
    '/inventory',
    '/stock-take',
    '/purchase-orders',
    '/products',
    '/warehouses',
    '/suppliers',
    '/warranties',
    '/repairs',
  ],
  Admin: [
    '/dashboard',
    '/inventory',
    '/stock-take',
    '/purchase-orders',
    '/products',
    '/warehouses',
    '/suppliers',
    '/warranties',
    '/repairs',
  ],
};

/**
 * Check whether a given path is supported for Sandbox / Training mode given the user's roles.
 */
export function isPathSupportedForSandbox(path: string, roles: string[] = []): boolean {
  if (!roles || roles.length === 0 || !path) return false;

  // Normalize path (strip query, hash, multiple leading/trailing slashes)
  const pathWithoutQuery = path.split('?')[0].split('#')[0];
  const normalizedPath = '/' + pathWithoutQuery.replace(/^\/+|\/+$/g, '');
  const rootSegment = '/' + normalizedPath.split('/')[1];

  for (const role of roles) {
    const supported = SANDBOX_SUPPORTED_ROUTES[role];
    if (supported) {
      if (supported.some((s) => s === normalizedPath || s === rootSegment)) {
        return true;
      }
    }
  }

  return false;
}

import toast from 'react-hot-toast';
import { operationalNotificationService } from '../services/operationalNotificationService';

/**
 * Clean URL and storage when exiting or purging invalid sandbox mode.
 */
export function purgeSandboxSession(): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('psp_sandbox_mode');
      sessionStorage.removeItem('psp_training_mode');
      localStorage.removeItem('psp_sandbox_mode');
      localStorage.removeItem('psp_training_mode');
    } catch {
      // Safe fail
    }
  }
}

export interface ExitSandboxOptions {
  searchParams?: URLSearchParams;
  setSearchParams?: (params: URLSearchParams) => void;
  navigate?: (url: string, options?: { replace?: boolean }) => void;
  onExit?: () => void;
  language?: string;
  silent?: boolean;
}

/**
 * Universal Exit Sandbox Mode Helper
 *
 * Safely exits training mode across all roles (Technician, Warranty, Inventory):
 * 1. Stops any running Driver.js tour
 * 2. Purges storage flags (sessionStorage + localStorage)
 * 3. Clears sandbox operational notifications
 * 4. Strips 'mode', 'tour', and 'sandbox' query params from URL
 * 5. Dispatches notifications & popstate events
 * 6. Displays a confirmation toast
 */
export function exitSandboxMode(options?: ExitSandboxOptions): void {
  // 1. Clean up any active Driver.js tour DOM elements
  if (typeof document !== 'undefined') {
    try {
      const overlays = document.querySelectorAll('.driver-overlay, .driver-popover, #driver-popover-content');
      overlays.forEach(el => el.remove());
      document.body.classList.remove('driver-active', 'driver-fade');
    } catch {
      // Safe fail
    }
  }

  // 2. Clear sandbox sessions & storage flags
  purgeSandboxSession();

  // 3. Clear sandbox notifications
  try {
    operationalNotificationService.clearSandboxNotifications();
  } catch {
    // Safe fail
  }

  // 4. Clean URL query parameters
  if (options?.searchParams && options?.setSearchParams) {
    const next = new URLSearchParams(options.searchParams);
    next.delete('mode');
    next.delete('tour');
    next.delete('sandbox');
    options.setSearchParams(next);
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new Event('popstate'));
      } catch {
        // Safe fail
      }
    }
  } else if (typeof window !== 'undefined') {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('mode');
    currentUrl.searchParams.delete('tour');
    currentUrl.searchParams.delete('sandbox');
    const cleanTarget = `${currentUrl.pathname}${currentUrl.search}`;
    window.history.replaceState({}, '', cleanTarget);
    if (options?.navigate) {
      options.navigate(cleanTarget, { replace: true });
    }
    window.dispatchEvent(new Event('popstate'));
  }

  // 5. Callback if provided
  if (options?.onExit) {
    options.onExit();
  }

  // 6. User feedback toast
  if (!options?.silent) {
    const isVi = options?.language === 'vi' || !options?.language;
    toast.success(
      isVi 
        ? 'Đã thoát Chế độ Thực hành, trở về dữ liệu thật!' 
        : 'Exited Sandbox Mode, returned to live data!',
      { icon: '🛡️' }
    );
  }
}

