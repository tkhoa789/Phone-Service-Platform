import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/authStore';
import { isPathSupportedForSandbox } from '../../utils/sandboxUtils';

export interface BreadcrumbProps {
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ className }) => {
  const location = useLocation();
  const { roles } = useAuthStore();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const isSandboxMode = 
    isPathSupportedForSandbox(location.pathname, roles) &&
    (location.search.includes('mode=training') || 
     location.search.includes('sandbox=true') || 
     (typeof window !== 'undefined' && sessionStorage.getItem('psp_sandbox_mode') === 'true'));

  // If we are at the root or dashboard, just show a minimal breadcrumb or nothing.
  if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
    return (
      <nav aria-label="Breadcrumb" className={cn('flex items-center text-sm mb-4', className)}>
        <ol className="flex items-center gap-2">
          <li>
            <NavLink
              to={isSandboxMode ? "/dashboard?mode=training" : "/dashboard"}
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg px-2 py-1"
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">Dashboard</span>
            </NavLink>
          </li>
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-sm mb-6', className)}>
      <ol className="flex items-center gap-1.5 text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-hide py-1 text-xs">
        <li>
          <NavLink
            to={isSandboxMode ? "/dashboard?mode=training" : "/dashboard"}
            className="hover:text-primary transition-colors flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg p-1.5 text-muted-foreground"
          >
            <Home className="w-4 h-4" />
          </NavLink>
        </li>
        {pathnames.map((value, index) => {
          const isLast = index === pathnames.length - 1;
          const basePath = `/${pathnames.slice(0, index + 1).join('/')}`;
          const to = (isSandboxMode && isPathSupportedForSandbox(basePath, roles)) ? `${basePath}?mode=training` : basePath;
          
          // Capitalize first letter for display
          const label = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

          return (
            <React.Fragment key={to}>
              <li>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
              </li>
              <li>
                {isLast ? (
                  <span className="text-foreground font-semibold px-2 py-0.5 rounded-lg bg-surface-elevated/70 shadow-sm border border-border/30" aria-current="page">
                    {label}
                  </span>
                ) : (
                  <NavLink
                    to={to}
                    className="hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg px-1.5 py-0.5 text-muted-foreground"
                  >
                    {label}
                  </NavLink>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
