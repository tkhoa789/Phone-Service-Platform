import { describe, it, expect } from 'vitest';
import { branchSchema } from './branch.schema';

describe('branchSchema validation', () => {
  it('should validate a correct branch object', () => {
    const validData = {
      code: 'B001',
      name: 'Main Branch',
      address: '123 Main St',
      phone: '1234567890',
      email: 'branch@test.com'
    };
    const result = branchSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should invalidate if code is too short', () => {
    const invalidData = {
      code: 'B',
      name: 'Main Branch',
      address: '123 Main St',
    };
    const result = branchSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
