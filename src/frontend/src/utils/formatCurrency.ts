/**
 * Format a number as Vietnamese Dong (VND) currency string.
 * @param amount Amount to format.
 */
export function formatCurrency(amount?: number | null): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount || 0);
}
