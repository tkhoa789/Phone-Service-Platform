import { FormField as UIFormField, type FormFieldProps as UIFormFieldProps } from '../ui/FormField';

export type FormFieldProps = UIFormFieldProps;

/**
 * Re-export of canonical FormField from src/components/ui/FormField.
 * Provides accessible ID generation, aria-describedby, required indicator,
 * and error display.
 */
export const FormField = UIFormField;
