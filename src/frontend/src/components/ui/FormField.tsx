import React, { useId } from 'react';
import { cn } from '../../utils/cn';

export interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  hint,
  required,
  children,
  className,
  id: providedId
}) => {
  const fallbackId = useId();
  const id = providedId || fallbackId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const child = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
        id,
        'aria-describedby': error ? errorId : hint ? hintId : undefined,
        'aria-invalid': !!error
      })
    : children;

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground flex items-center">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      {child}
      {error && (
        <span id={errorId} className="text-xs text-rose-500 font-medium animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </span>
      )}
    </div>
  );
};
