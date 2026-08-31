import { describe, it, expect } from 'vitest';
import { productSchema, productVariantSchema } from '../schemas/product.schema';

describe('Product Schemas', () => {
  describe('productSchema', () => {
    it('should validate a correct product', () => {
      const validProduct = {
        code: 'PROD_001',
        name: 'iPhone 16 Pro',
        categoryId: 'cat-123',
        brandId: 'brand-456',
        description: 'New model',
      };
      
      const result = productSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should fail when name is too short', () => {
      const invalidProduct = {
        code: 'PROD_001',
        name: 'a', // Too short
        categoryId: 'cat-123',
        brandId: 'brand-456',
      };
      
      const result = productSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Tên sản phẩm phải có ít nhất 2 ký tự');
      }
    });

    it('should fail when categoryId or brandId is missing', () => {
      const invalidProduct = {
        code: 'PROD_001',
        name: 'iPhone 16',
        categoryId: '',
        brandId: '',
      };
      
      const result = productSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBe(2);
      }
    });
  });

  describe('productVariantSchema', () => {
    it('should validate a correct variant', () => {
      const validVariant = {
        productId: 'prod-123',
        sku: 'SKU_001',
        name: 'Black 256GB',
        costPrice: 15000000,
        salePrice: 18000000,
      };
      
      const result = productVariantSchema.safeParse(validVariant);
      expect(result.success).toBe(true);
    });

    it('should coerce string numbers to numbers and validate correctly', () => {
      const stringNumberVariant = {
        productId: 'prod-123',
        sku: 'SKU_001',
        name: 'Black 256GB',
        costPrice: '15000000', // String input from form
        salePrice: '18000000',
      };
      
      const result = productVariantSchema.safeParse(stringNumberVariant);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.costPrice).toBe(15000000);
        expect(typeof result.data.costPrice).toBe('number');
      }
    });

    it('should fail when prices are negative', () => {
      const invalidVariant = {
        productId: 'prod-123',
        sku: 'SKU_001',
        name: 'Black 256GB',
        costPrice: -100,
        salePrice: -200,
      };
      
      const result = productVariantSchema.safeParse(invalidVariant);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBe(2);
      }
    });
  });
});
