import React, { useId } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id: providedId, ...props }, ref) => {
    const fallbackId = useId();
    const id = providedId || fallbackId;
    const errorId = `${id}-error`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-[var(--neu-text-title)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={!!error}
          className={cn(
            'flex h-10 w-full rounded-2xl border px-3 py-2 text-sm transition-colors',
            'bg-[var(--neu-bg-base)] text-[var(--neu-text-title)] placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            error 
              ? 'border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.1)] focus:ring-rose-500/50' 
              : 'border-slate-300/20 shadow-[var(--neu-shadow-inset)] focus:border-emerald-500/50 focus:ring-emerald-500/20',
            className
          )}
          {...props}
        />
        {error && (
          <span id={errorId} className="text-xs text-rose-500 font-medium animate-in fade-in slide-in-from-top-1">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
