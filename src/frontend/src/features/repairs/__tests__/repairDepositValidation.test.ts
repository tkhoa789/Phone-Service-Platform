import { describe, it, expect } from 'vitest';

export function validateRepairDeposit(
  amount: number,
  estimatedCost: number
): { isValid: boolean; error?: string } {
  if (amount <= 0) {
    return { isValid: false, error: 'Số tiền cọc phải lớn hơn 0.' };
  }
  if (amount > estimatedCost) {
    return { isValid: false, error: 'Tổng tiền cọc không được vượt quá Chi phí dự kiến.' };
  }
  return { isValid: true };
}

describe('Repair Intake Deposit Validation Rules (BUG-02 Regression)', () => {
  it('allows valid deposit within estimated cost', () => {
    const res = validateRepairDeposit(500000, 1000000);
    expect(res.isValid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it('allows deposit exactly equal to estimated cost (full prepayment)', () => {
    const res = validateRepairDeposit(1000000, 1000000);
    expect(res.isValid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it('rejects zero or negative deposit amount', () => {
    const resZero = validateRepairDeposit(0, 1000000);
    expect(resZero.isValid).toBe(false);
    expect(resZero.error).toContain('phải lớn hơn 0');

    const resNeg = validateRepairDeposit(-100000, 1000000);
    expect(resNeg.isValid).toBe(false);
    expect(resNeg.error).toContain('phải lớn hơn 0');
  });

  it('rejects deposit exceeding estimated cost', () => {
    const res = validateRepairDeposit(1500000, 1000000);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('không được vượt quá Chi phí dự kiến');
  });
});
