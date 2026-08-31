import { describe, it, expect } from 'vitest';
import { supplierSchema, paySupplierDebtSchema } from '../schemas/supplier.schema';

describe('Supplier Schemas', () => {
  describe('supplierSchema', () => {
    it('should validate a correct supplier', () => {
      const validData = {
        name: 'Apple VN',
        phone: '0908889999',
        email: 'test@apple.com',
        debtAmount: 100,
        creditLimit: 500,
        paymentTermsDays: 30,
      };
      
      const result = supplierSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow optional email and address', () => {
      const validData = {
        name: 'Samsung Parts',
        phone: '0987654321',
      };
      
      const result = supplierSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail when name is too short', () => {
      const invalidData = {
        name: 'A', // Too short
        phone: '0912345678',
      };
      
      const result = supplierSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('paySupplierDebtSchema', () => {
    it('should validate a correct payment', () => {
      const validData = {
        amount: 500000,
        paymentMethod: 'CASH',
        referenceNo: 'REF-001',
      };
      const result = paySupplierDebtSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail when amount is 0', () => {
      const invalidData = {
        amount: 0,
        paymentMethod: 'CASH',
        referenceNo: 'REF-001',
      };
      const result = paySupplierDebtSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
