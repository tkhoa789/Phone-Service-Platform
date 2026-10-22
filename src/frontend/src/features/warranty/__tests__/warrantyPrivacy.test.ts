import { describe, it, expect } from 'vitest';

export function maskCustomerName(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') return 'Khách hàng';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const last = parts[parts.length - 1];
  return `${first} *** ${last}`;
}

describe('Public Warranty Privacy Masking (BUG-10 Regression)', () => {
  it('masks multi-word Vietnamese names correctly', () => {
    expect(maskCustomerName('Khách lẻ mặc định')).toBe('Khách *** định');
    expect(maskCustomerName('Nguyễn Văn An')).toBe('Nguyễn *** An');
  });

  it('handles two-word names', () => {
    expect(maskCustomerName('Trần Bình')).toBe('Trần *** Bình');
  });

  it('handles single-word or empty names safely', () => {
    expect(maskCustomerName('Admin')).toBe('Admin');
    expect(maskCustomerName('')).toBe('Khách hàng');
  });
});
