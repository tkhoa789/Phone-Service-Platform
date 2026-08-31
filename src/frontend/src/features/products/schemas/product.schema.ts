import { z } from 'zod';

export const productSchema = z.object({
  code: z.string().min(1, 'Mã sản phẩm không được để trống'),
  name: z.string().min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  brandId: z.string().min(1, 'Vui lòng chọn thương hiệu'),
  description: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const productVariantSchema = z.object({
  productId: z.string().min(1, 'Lỗi thiếu Product ID'),
  sku: z.string().min(1, 'SKU không được để trống'),
  name: z.string().min(2, 'Tên biến thể phải có ít nhất 2 ký tự'),
  color: z.string().optional(),
  capacity: z.string().optional(),
  costPrice: z.coerce.number().min(0, 'Giá vốn không hợp lệ'),
  salePrice: z.coerce.number().min(0, 'Giá bán không hợp lệ'),
});

export type ProductVariantFormValues = z.infer<typeof productVariantSchema>;
