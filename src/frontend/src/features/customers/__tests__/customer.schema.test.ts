import { describe, it, expect } from 'vitest';
import { customerSchema } from '../schemas/customer.schema';

describe('Customer Schemas', () => {
  describe('customerSchema', () => {
    it('should validate a correct customer', () => {
      const validCustomer = {
        fullName: 'Nguyen Van A',
        phone: '0912345678',
        email: 'nguyenvana@example.com',
        address: '123 Test St',
      };
      
      const result = customerSchema.safeParse(validCustomer);
      expect(result.success).toBe(true);
    });

    it('should allow optional email and address', () => {
      const validCustomer = {
        fullName: 'Tran Thi B',
        phone: '0987654321',
      };
      
      const result = customerSchema.safeParse(validCustomer);
      expect(result.success).toBe(true);
    });

    it('should allow empty strings for email and address', () => {
      const validCustomer = {
        fullName: 'Le Van C',
        phone: '0987654321',
        email: '',
        address: '',
      };
      
      const result = customerSchema.safeParse(validCustomer);
      expect(result.success).toBe(true);
    });

    it('should fail when name is too short', () => {
      const invalidCustomer = {
        fullName: 'A', // Too short
        phone: '0912345678',
      };
      
      const result = customerSchema.safeParse(invalidCustomer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Tên khách hàng phải có ít nhất 2 ký tự');
      }
    });

    it('should fail when phone format is invalid', () => {
      const invalidCustomer = {
        fullName: 'John Doe',
        phone: '12345', // Too short
      };
      
      const result = customerSchema.safeParse(invalidCustomer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Số điện thoại phải có ít nhất 10 số');
      }
    });

    it('should fail when phone contains letters', () => {
      const invalidCustomer = {
        fullName: 'John Doe',
        phone: '091234abcd',
      };
      
      const result = customerSchema.safeParse(invalidCustomer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Số điện thoại chỉ được chứa số và dấu +');
      }
    });
  });
});
