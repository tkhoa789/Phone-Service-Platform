import { z } from 'zod';

export const customerSchema = z.object({
  fullName: z.string().min(2, 'Tên khách hàng phải có ít nhất 2 ký tự').max(100, 'Tên quá dài'),
  phone: z.string()
    .min(10, 'Số điện thoại phải có ít nhất 10 số')
    .max(15, 'Số điện thoại không hợp lệ')
    .regex(/^[0-9+]+$/, 'Số điện thoại chỉ được chứa số và dấu +'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  address: z.string().max(255, 'Địa chỉ quá dài').optional().or(z.literal('')),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
