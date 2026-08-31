import { z } from 'zod';

export const createPurchaseOrderItemSchema = z.object({
  productVariantId: z.string().min(1, 'Vui lòng chọn sản phẩm'),
  quantity: z.number().min(1, 'Số lượng phải lớn hơn 0'),
  unitPrice: z.number().min(0, 'Đơn giá không được âm'),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Vui lòng chọn nhà cung cấp'),
  warehouseId: z.string().min(1, 'Vui lòng chọn kho nhập'),
  code: z.string().min(1, 'Vui lòng nhập mã phiếu (hoặc để backend tự sinh)'),
  items: z.array(createPurchaseOrderItemSchema).min(1, 'Phải có ít nhất một mặt hàng'),
});

export type CreatePurchaseOrderFormValues = z.infer<typeof createPurchaseOrderSchema>;

export const productVariantImeisSchema = z.object({
  productVariantId: z.string(),
  imeis: z.array(z.string().min(1, 'IMEI không được để trống')).min(1, 'Cần ít nhất 1 IMEI'),
});

export const completePurchaseOrderSchema = z.object({
  variantImeis: z.array(productVariantImeisSchema),
});

export type CompletePurchaseOrderFormValues = z.infer<typeof completePurchaseOrderSchema>;
