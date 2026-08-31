import { z } from 'zod';

export const supplierSchema = z.object({
  code: z.string().optional().or(z.literal('')),
  name: z.string().min(2, 'Tên nhà cung cấp phải có ít nhất 2 ký tự').max(150, 'Tên quá dài'),
  phone: z.string()
    .min(10, 'Số điện thoại phải có ít nhất 10 số')
    .max(15, 'Số điện thoại không hợp lệ')
    .regex(/^[0-9+]+$/, 'Số điện thoại chỉ được chứa số và dấu +'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  address: z.string().max(255, 'Địa chỉ quá dài').optional().or(z.literal('')),
  taxCode: z.string().max(50, 'Mã số thuế không hợp lệ').optional().or(z.literal('')),
  debtAmount: z.coerce.number().min(0, 'Công nợ không được âm').optional(),
  creditLimit: z.coerce.number().min(0, 'Hạn mức không được âm').optional(),
  paymentTermsDays: z.coerce.number().min(0, 'Kỳ hạn không được âm').optional(),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

export const paySupplierDebtSchema = z.object({
  amount: z.coerce.number().min(1, 'Số tiền phải lớn hơn 0'),
  paymentMethod: z.string().min(1, 'Vui lòng chọn phương thức thanh toán'),
  referenceNo: z.string().min(1, 'Vui lòng nhập mã giao dịch/phiếu thu'),
  note: z.string().optional().or(z.literal('')),
});

export type PaySupplierDebtFormValues = z.infer<typeof paySupplierDebtSchema>;
