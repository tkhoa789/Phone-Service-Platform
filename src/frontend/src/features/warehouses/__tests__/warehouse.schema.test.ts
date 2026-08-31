import { describe, it, expect } from 'vitest';
import { createWarehouseSchema, updateWarehouseSchema } from '../schemas/warehouse.schema';

describe('Warehouse Schemas', () => {
  describe('createWarehouseSchema', () => {
    it('should validate a correct warehouse', () => {
      const validData = {
        branchId: 'b1-guid',
        code: 'KHO_Q1',
        name: 'Kho Quận 1',
      };
      const result = createWarehouseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail when code is empty', () => {
      const invalidData = {
        branchId: 'b1-guid',
        code: '',
        name: 'Kho Quận 1',
      };
      const result = createWarehouseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateWarehouseSchema', () => {
    it('should validate a correct warehouse update', () => {
      const validData = {
        name: 'Kho Quận 1 Mới',
      };
      const result = updateWarehouseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
