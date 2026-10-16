import React from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'outline';
  dot?: boolean;
}

const variantStyles = {
  default: 'bg-surface-elevated text-foreground border-border/40 shadow-sm',
  primary: 'bg-primary/10 text-primary border-primary/30 shadow-sm',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-sm',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-sm',
  danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-sm',
  info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 shadow-sm',
  muted: 'bg-muted/40 text-muted-foreground border-border/30',
  outline: 'bg-transparent text-foreground border-border/60 shadow-sm',
};

const dotStyles = {
  default: 'bg-muted-foreground',
  primary: 'bg-primary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  muted: 'bg-muted-foreground/60',
  outline: 'bg-foreground/60',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', dot = false, className, children, ...props }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide select-none',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotStyles[variant])} />}
      {children}
    </span>
  );
};
