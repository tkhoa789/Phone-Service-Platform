import React, { useId } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, id: providedId, ...props }, ref) => {
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
        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={!!error}
            className={cn(
              'appearance-none flex h-10 w-full rounded-2xl border px-3 py-2 pr-10 text-sm transition-colors cursor-pointer',
              'bg-[var(--neu-bg-base)] text-[var(--neu-text-title)]',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              error 
                ? 'border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.1)] focus:ring-rose-500/50' 
                : 'border-slate-300/20 shadow-[var(--neu-shadow-inset)] focus:border-emerald-500/50 focus:ring-emerald-500/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <span id={errorId} className="text-xs text-rose-500 font-medium">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
