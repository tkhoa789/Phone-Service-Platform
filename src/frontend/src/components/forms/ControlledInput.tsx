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
        error={error?.message}
      />
    </FormField>
  );
}
