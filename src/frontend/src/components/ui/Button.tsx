import React, { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

const variantStyles = {
  primary:
    'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 active:shadow-inset border border-emerald-400/30',
  secondary:
    'bg-card text-foreground border border-border/40 neu-raised hover:neu-raised-md hover:text-primary active:shadow-inset',
  neutral:
    'bg-surface-elevated text-foreground border border-border/30 neu-raised hover:neu-raised-md active:shadow-inset',
  success:
    'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 active:shadow-inset border border-emerald-400/30',
  warning:
    'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-500/20 active:shadow-inset border border-amber-400/30',
  danger:
    'bg-card text-rose-500 border border-rose-500/30 neu-raised hover:neu-raised-md hover:text-rose-600 hover:border-rose-500/50 active:shadow-inset',
  ghost:
    'bg-transparent text-muted-foreground hover:text-foreground hover:bg-surface-elevated/60 hover:neu-raised active:shadow-inset',
  outline:
    'bg-transparent border border-border/60 text-foreground hover:bg-card neu-raised hover:neu-raised-md active:shadow-inset'
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-4 py-2 text-sm rounded-2xl gap-2',
  lg: 'px-6 py-3 text-base rounded-2xl gap-2.5',
  icon: 'w-10 h-10 flex items-center justify-center rounded-2xl p-0 shrink-0'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          'active:translate-y-px active:scale-[0.99]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:active:translate-y-0 disabled:active:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
