import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface BreadcrumbProps {
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ className }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // If we are at the root or dashboard, just show a minimal breadcrumb or nothing.
  if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
    return (
      <nav aria-label="Breadcrumb" className={cn('flex items-center text-sm mb-4', className)}>
        <ol className="flex items-center gap-2">
          <li>
            <NavLink
              to="/dashboard"
              className="text-[var(--neu-text-sub)] hover:text-[var(--neu-accent-mint)] transition-colors flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-md"
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
      <ol className="flex items-center gap-2 text-[var(--neu-text-sub)] overflow-x-auto whitespace-nowrap scrollbar-hide py-1">
        <li>
          <NavLink
            to="/dashboard"
            className="hover:text-[var(--neu-accent-mint)] transition-colors flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-md"
          >
            <Home className="w-4 h-4" />
          </NavLink>
        </li>
        {pathnames.map((value, index) => {
          const isLast = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          
          // Capitalize first letter for display
          const label = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

          return (
            <React.Fragment key={to}>
              <li>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </li>
              <li>
                {isLast ? (
                  <span className="text-[var(--neu-text-title)] font-semibold px-1" aria-current="page">
                    {label}
                  </span>
                ) : (
                  <NavLink
                    to={to}
                    className="hover:text-[var(--neu-accent-mint)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-md px-1"
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
