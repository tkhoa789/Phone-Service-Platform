import { describe, it, expect } from 'vitest';

export function validateCartImeis(
  items: Array<{ name: string; isImeiTracking: boolean; quantity: number; imeis: string[] }>
): { isValid: boolean; error?: string } {
  const seenImeis = new Set<string>();

  for (const item of items) {
    if (item.isImeiTracking) {
      if (item.imeis.length !== item.quantity) {
        return {
          isValid: false,
          error: `Sản phẩm '${item.name}' yêu cầu ${item.quantity} mã IMEI nhưng chỉ có ${item.imeis.length}.`
        };
      }

      for (const rawImei of item.imeis) {
        const cleanImei = rawImei.trim();
        if (!cleanImei) {
          return { isValid: false, error: `Mã IMEI của '${item.name}' không được để trống.` };
        }
        if (seenImeis.has(cleanImei)) {
          return { isValid: false, error: `Mã IMEI '${cleanImei}' bị trùng lặp trong giỏ hàng.` };
        }
        seenImeis.add(cleanImei);
      }
    }
  }

  return { isValid: true };
}

describe('POS IMEI & Quantity Validation Rules (BUG-05 Regression)', () => {
  it('passes when every serialized unit has a unique IMEI', () => {
    const items = [
      {
        name: 'iPhone 16 Pro Max',
        isImeiTracking: true,
        quantity: 2,
        imeis: ['860123470711327', '860456470711327']
      }
    ];
    const res = validateCartImeis(items);
    expect(res.isValid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it('fails when number of IMEIs does not match quantity', () => {
    const items = [
      {
        name: 'iPhone 16 Pro Max',
        isImeiTracking: true,
        quantity: 2,
        imeis: ['860123470711327'] // Missing 1 IMEI
      }
    ];
    const res = validateCartImeis(items);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('yêu cầu 2 mã IMEI nhưng chỉ có 1');
  });

  it('fails when duplicate IMEIs exist across items in same cart', () => {
    const items = [
      {
        name: 'iPhone 16 Pro Max',
        isImeiTracking: true,
        quantity: 2,
        imeis: ['860123470711327', '860123470711327'] // Duplicate
      }
    ];
    const res = validateCartImeis(items);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('bị trùng lặp');
  });

  it('allows non-serialized accessory to have quantity > 1 without IMEIs', () => {
    const items = [
      {
        name: 'Cáp sạc Type-C',
        isImeiTracking: false,
        quantity: 5,
        imeis: []
      }
    ];
    const res = validateCartImeis(items);
    expect(res.isValid).toBe(true);
  });
});
