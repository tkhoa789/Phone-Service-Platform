import { describe, it, expect } from 'vitest';

export function calculateCartTotals(
  items: Array<{ unitPrice: number; quantity: number }>,
  voucher?: { discountType: 'Percent' | 'Fixed'; discountValue: number; minOrderValue: number; maxDiscount?: number }
) {
  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  let discount = 0;

  if (voucher && subtotal >= voucher.minOrderValue) {
    if (voucher.discountType === 'Fixed') {
      discount = Math.min(voucher.discountValue, subtotal);
    } else if (voucher.discountType === 'Percent') {
      const calculated = (subtotal * voucher.discountValue) / 100;
      discount = voucher.maxDiscount ? Math.min(calculated, voucher.maxDiscount) : calculated;
    }
  }

  const total = Math.max(0, subtotal - discount);
  return { subtotal, discount, total };
}

describe('POS Financial Calculations & Voucher Rules', () => {
  it('calculates subtotal correctly for multiple items', () => {
    const items = [
      { unitPrice: 25000000, quantity: 2 }, // 50,000,000
      { unitPrice: 500000, quantity: 1 }    // 500,000
    ];
    const { subtotal, discount, total } = calculateCartTotals(items);
    expect(subtotal).toBe(50500000);
    expect(discount).toBe(0);
    expect(total).toBe(50500000);
  });

  it('applies fixed discount voucher when subtotal meets minOrderValue', () => {
    const items = [{ unitPrice: 50000000, quantity: 1 }];
    const voucher = {
      discountType: 'Fixed' as const,
      discountValue: 100000,
      minOrderValue: 5000000
    };
    const { subtotal, discount, total } = calculateCartTotals(items, voucher);
    expect(subtotal).toBe(50000000);
    expect(discount).toBe(100000);
    expect(total).toBe(49900000);
  });

  it('rejects voucher discount when subtotal is below minOrderValue', () => {
    const items = [{ unitPrice: 2000000, quantity: 1 }];
    const voucher = {
      discountType: 'Fixed' as const,
      discountValue: 100000,
      minOrderValue: 5000000
    };
    const { subtotal, discount, total } = calculateCartTotals(items, voucher);
    expect(subtotal).toBe(2000000);
    expect(discount).toBe(0);
    expect(total).toBe(2000000);
  });

  it('applies percentage voucher with maximum cap', () => {
    const items = [{ unitPrice: 30000000, quantity: 1 }];
    const voucher = {
      discountType: 'Percent' as const,
      discountValue: 10, // 10% of 30,000,000 = 3,000,000
      minOrderValue: 10000000,
      maxDiscount: 1000000 // capped at 1,000,000
    };
    const { subtotal, discount, total } = calculateCartTotals(items, voucher);
    expect(discount).toBe(1000000);
    expect(total).toBe(29000000);
  });
});
