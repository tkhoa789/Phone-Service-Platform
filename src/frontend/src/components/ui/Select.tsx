import React, { useId } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, required, children, id: providedId, ...props }, ref) => {
    const fallbackId = useId();
    const id = providedId || fallbackId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-foreground flex items-center gap-1">
            {label}
            {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            aria-invalid={!!error}
            className={cn(
              'appearance-none flex h-10 w-full rounded-2xl border px-3.5 py-2 pr-10 text-sm transition-all duration-150 cursor-pointer',
              'bg-card text-foreground shadow-inset',
              'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted/30',
              error
                ? 'border-rose-500/60 shadow-[inset_2px_2px_5px_rgba(244,63,94,0.15)] focus:border-rose-500 focus:ring-rose-500/40'
                : 'border-border/40 focus:border-primary/60 focus:ring-primary/40',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <span id={errorId} className="text-xs text-rose-500 font-medium animate-in fade-in slide-in-from-top-1">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={helperId} className="text-xs text-muted-foreground">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
