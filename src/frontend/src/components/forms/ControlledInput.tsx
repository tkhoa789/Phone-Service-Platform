import React from 'react';
import { useController } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { FormField } from './FormField';
import { cn } from '../../utils/cn';
import { Input } from '@/components/ui/Input';

interface ControlledInputProps<T extends FieldValues> extends UseControllerProps<T> {
  label: string;
  placeholder?: string;
  type?: string;
  className?: string;
}

export function ControlledInput<T extends FieldValues>({
  name,
  control,
  rules,
  defaultValue,
  label,
  placeholder,
  type = 'text',
  className,
}: ControlledInputProps<T>) {
  const {
    field,
    fieldState: { error },
  } = useController({ name, control, rules, defaultValue });

  return (
    <FormField label={label} error={error?.message} required={!!rules?.required} className={className}>
      <Input
        {...field}
        type={type}
        placeholder={placeholder}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl border bg-card text-foreground shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-[var(--neu-accent-mint)]/50 transition-all",
          error ? "border-rose-500/50 focus:border-rose-500" : "border-slate-300/40 focus:border-[var(--neu-accent-mint)]"
        )}
      />
    </FormField>
  );
}
