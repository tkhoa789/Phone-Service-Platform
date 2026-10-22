import { describe, it, expect } from 'vitest';

export function computePaymentSettlement(
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD',
  totalAmount: number,
  cashTendered: number
): { canComplete: boolean; change: number; amountToCharge: number; error?: string } {
  if (paymentMethod !== 'CASH') {
    return {
      canComplete: true,
      change: 0,
      amountToCharge: totalAmount,
    };
  }

  if (cashTendered < totalAmount) {
    return {
      canComplete: false,
      change: 0,
      amountToCharge: totalAmount,
      error: 'Tiền khách đưa chưa đủ.',
    };
  }

  const change = cashTendered - totalAmount;
  return {
    canComplete: true,
    change,
    amountToCharge: totalAmount,
  };
}

describe('POS Payment Settlement & Cash Tendered Rules (BUG-04 Regression)', () => {
  it('calculates correct change when cash tendered exceeds total amount', () => {
    const { canComplete, change, amountToCharge, error } = computePaymentSettlement(
      'CASH',
      49900000,
      50000000
    );
    expect(canComplete).toBe(true);
    expect(amountToCharge).toBe(49900000);
    expect(change).toBe(100000); // 100,000 VND change
    expect(error).toBeUndefined();
  });

  it('calculates zero change when exact cash is tendered', () => {
    const { canComplete, change, error } = computePaymentSettlement(
      'CASH',
      49900000,
      49900000
    );
    expect(canComplete).toBe(true);
    expect(change).toBe(0);
    expect(error).toBeUndefined();
  });

  it('rejects completion when cash tendered is insufficient', () => {
    const { canComplete, change, error } = computePaymentSettlement(
      'CASH',
      49900000,
      40000000
    );
    expect(canComplete).toBe(false);
    expect(change).toBe(0);
    expect(error).toBe('Tiền khách đưa chưa đủ.');
  });

  it('automatically matches exact amount with zero change for non-cash methods', () => {
    const { canComplete, change, amountToCharge } = computePaymentSettlement(
      'BANK_TRANSFER',
      49900000,
      0
    );
    expect(canComplete).toBe(true);
    expect(amountToCharge).toBe(49900000);
    expect(change).toBe(0);
  });
});
