import { describe, it, expect } from 'vitest';

export function computeStockVariance(systemQty: number, actualQty: number) {
  const difference = actualQty - systemQty;
  let status: 'Balanced' | 'Surplus' | 'Shortage' = 'Balanced';
  if (difference > 0) status = 'Surplus';
  if (difference < 0) status = 'Shortage';
  return { difference, status };
}

describe('Stock Take Reconciliation & Variance Calculations (BUG-08 Regression)', () => {
  it('correctly calculates negative difference (stock shortage)', () => {
    const { difference, status } = computeStockVariance(20, 18);
    expect(difference).toBe(-2);
    expect(status).toBe('Shortage');
  });

  it('correctly calculates positive difference (stock surplus)', () => {
    const { difference, status } = computeStockVariance(18, 25);
    expect(difference).toBe(7);
    expect(status).toBe('Surplus');
  });

  it('correctly identifies zero variance (stock balanced)', () => {
    const { difference, status } = computeStockVariance(25, 25);
    expect(difference).toBe(0);
    expect(status).toBe('Balanced');
  });
});
