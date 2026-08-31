import React from 'react';
import { cn } from '../../utils/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon, actions, className }) => {
  return (
    <div className={cn("p-6 rounded-3xl bg-[var(--neu-bg-base)] border border-[var(--neu-border)] shadow-[var(--neu-shadow-outer)] flex flex-col md:flex-row md:items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-2xl bg-[var(--neu-bg-base)] shadow-inner border border-border/50 bg-muted/20 flex items-center justify-center text-[var(--neu-accent-mint)] border border-emerald-500/30 shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h1 className="font-heading font-medium text-2xl text-[var(--neu-text-title)] tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-[var(--neu-text-sub)] mt-1">{description}</p>
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
