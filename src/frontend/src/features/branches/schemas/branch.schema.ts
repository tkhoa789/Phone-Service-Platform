import { z } from 'zod';

export const branchSchema = z.object({
  code: z.string().min(2, 'Mã chi nhánh phải có ít nhất 2 ký tự').max(20, 'Mã chi nhánh tối đa 20 ký tự'),
  name: z.string().min(5, 'Tên chi nhánh phải có ít nhất 5 ký tự').max(100, 'Tên chi nhánh tối đa 100 ký tự'),
  address: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự').max(200, 'Địa chỉ tối đa 200 ký tự'),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
});

export type BranchFormValues = z.infer<typeof branchSchema>;
