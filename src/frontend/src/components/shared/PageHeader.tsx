import React from 'react';
import { cn } from '../../utils/cn';

interface PageHeaderProps {
  id?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ id, title, description, icon, actions, className }) => {
  return (
    <div id={id} className={cn("p-6 rounded-3xl bg-card border border-border/40 neu-raised flex flex-col md:flex-row md:items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-2xl bg-card shadow-inset border border-border/40 flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h1 className="font-heading font-semibold text-2xl text-foreground tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};
