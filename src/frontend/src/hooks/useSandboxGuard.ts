import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { isPathSupportedForSandbox, purgeSandboxSession } from '../utils/sandboxUtils';

/**
 * Enterprise Route Guard for Sandbox / Training Mode Sanitization
 *
 * If a user visits a route that does not support Sandbox (e.g. /repairs, /pos, /users)
 * or if the user's role does not support Sandbox for that module, this hook automatically:
 * 1. Strips ?mode=training, ?sandbox=true, and ?tour=... from searchParams.
 * 2. Purges stale sessionStorage flags if user role has no sandbox capability.
 * 3. Smoothly redirects to the clean URL without reloading or breaking state.
 */
export function useSandboxGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { roles, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const searchParams = new URLSearchParams(location.search);
    const hasModeTraining = searchParams.get('mode') === 'training';
    const hasSandboxTrue = searchParams.get('sandbox') === 'true';
    const hasTourParam = searchParams.has('tour');
    const isUrlInSandbox = hasModeTraining || hasSandboxTrue || hasTourParam;

    const isSupported = isPathSupportedForSandbox(location.pathname, roles);

    if (!isSupported) {
      // Current path or role does not support sandbox
      if (isUrlInSandbox) {
        searchParams.delete('mode');
        searchParams.delete('sandbox');
        searchParams.delete('tour');

        const newQuery = searchParams.toString();
        const cleanUrl = `${location.pathname}${newQuery ? `?${newQuery}` : ''}`;
        navigate(cleanUrl, { replace: true });
      }

      // If this role has zero sandbox capabilities across the board (like Technician, Sales, Manager),
      // purge any lingering sessionStorage flags left behind by another account
      const hasAnySandboxCapability = ['Inventory', 'Warranty', 'Technician', 'Admin', 'Owner'].some((r) =>
        roles.includes(r)
      );
      if (!hasAnySandboxCapability) {
        purgeSandboxSession();
      }
    }
  }, [location.pathname, location.search, roles, isAuthenticated, navigate]);
}
