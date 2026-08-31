import React from 'react';
import type { UseFormReturn, FieldValues, SubmitHandler } from 'react-hook-form';
import { cn } from '../../utils/cn';

interface FormWrapperProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Foundation Form Wrapper ensuring proper RHF binding and styling boundaries.
 * 
 * Rules applied here:
 * 1. Form Boundary (ADR-002): Only handles client-side concerns.
 * 2. Idempotency (ADR-004): Prevents double submissions natively through RHF's isSubmitting state.
 */
export function FormWrapper<T extends FieldValues>({ 
  form, 
  onSubmit, 
  children, 
  className,
  id 
}: FormWrapperProps<T>) {
  return (
    <form 
      id={id}
      onSubmit={form.handleSubmit(onSubmit)} 
      className={cn("flex flex-col gap-5", className)}
      noValidate // Disable native HTML5 validation in favor of Zod
    >
      <fieldset 
        disabled={form.formState.isSubmitting} 
        className="flex flex-col gap-5 min-w-0"
      >
        {children}
      </fieldset>
    </form>
  );
}
