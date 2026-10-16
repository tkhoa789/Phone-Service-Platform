import React from 'react';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className }) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-10 text-center bg-card text-foreground rounded-3xl border border-border/40 neu-raised',
        className
      )}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-surface-elevated shadow-inset border border-border/40 flex items-center justify-center text-primary mb-4 shrink-0">
          {icon}
        </div>
      )}
      <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground tracking-tight">{title}</h3>
      {description && <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
