import React, { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

const variantStyles = {
  primary: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm',
  secondary: 'bg-card text-foreground border border-slate-400/20 hover:text-primary shadow-sm active:shadow-inner',
  success: 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600',
  danger: 'bg-card text-rose-500 border border-rose-500/30 hover:text-rose-600 shadow-sm active:shadow-inner',
  ghost: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800/50',
  outline: 'bg-transparent border border-border/50 text-foreground hover:bg-card shadow-sm'
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs rounded-xl',
  md: 'px-4 py-2 text-sm rounded-2xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
  icon: 'w-10 h-10 flex items-center justify-center rounded-2xl'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 disabled:hover:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && children}
      </button>
    );
  }
);
Button.displayName = 'Button';
