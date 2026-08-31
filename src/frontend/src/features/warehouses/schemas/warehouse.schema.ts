import { z } from 'zod';

export const createWarehouseSchema = z.object({
  branchId: z.string().min(1, 'Vui lòng chọn chi nhánh quản lý'),
  code: z.string().min(2, 'Mã kho phải có ít nhất 2 ký tự').max(30, 'Mã kho tối đa 30 ký tự'),
  name: z.string().min(2, 'Tên kho phải có ít nhất 2 ký tự').max(100, 'Tên kho tối đa 100 ký tự'),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(2, 'Tên kho phải có ít nhất 2 ký tự').max(100, 'Tên kho tối đa 100 ký tự'),
});

export type CreateWarehouseFormValues = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseFormValues = z.infer<typeof updateWarehouseSchema>;
