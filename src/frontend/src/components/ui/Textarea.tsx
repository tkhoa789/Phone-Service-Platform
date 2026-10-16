import React, { useId } from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, required, id: providedId, ...props }, ref) => {
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
        <textarea
          ref={ref}
          id={id}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          aria-invalid={!!error}
          className={cn(
            'flex min-h-[90px] w-full rounded-2xl border px-3.5 py-2.5 text-sm transition-all duration-150',
            'bg-card text-foreground placeholder:text-muted-foreground/60 shadow-inset',
            'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted/30',
            error
              ? 'border-rose-500/60 shadow-[inset_2px_2px_5px_rgba(244,63,94,0.15)] focus:border-rose-500 focus:ring-rose-500/40'
              : 'border-border/40 focus:border-primary/60 focus:ring-primary/40',
            className
          )}
          {...props}
        />
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
Textarea.displayName = 'Textarea';
