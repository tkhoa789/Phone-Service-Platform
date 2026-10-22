import { describe, it, expect } from 'vitest';

export interface PosCatalogItemTest {
  id: string;
  name: string;
  stock: number;
}

export function sortPosCatalogItems<T extends { name: string; stock: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    // Priority 1: In-stock items (stock > 0) appear before out-of-stock
    if (a.stock > 0 && b.stock <= 0) return -1;
    if (a.stock <= 0 && b.stock > 0) return 1;

    // Priority 2: Among in-stock items, sort descending by quantity
    if (a.stock > 0 && b.stock > 0) {
      if (b.stock !== a.stock) return b.stock - a.stock;
    }

    // Priority 3: Alphabetical sort by Vietnamese locale
    return a.name.localeCompare(b.name, 'vi');
  });
}

export function filterPosCatalogByStock<T extends { stock: number }>(
  items: T[],
  filter: 'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'
): T[] {
  if (filter === 'ALL') return items;
  if (filter === 'IN_STOCK') return items.filter(i => i.stock > 0);
  return items.filter(i => i.stock <= 0);
}

export function getStockBadgeProps(stock: number) {
  if (stock <= 0) {
    return {
      isAvailable: false,
      text: 'Hết hàng',
      textColorClass: 'text-rose-600 dark:text-rose-400',
      badgeClass: 'bg-rose-500/15 border-rose-500/30',
    };
  }
  return {
    isAvailable: true,
    prefix: 'SL: ',
    quantity: stock,
    prefixColorClass: 'text-foreground',
    quantityColorClass: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-background/90 dark:bg-card/90 border-border/60',
  };
}

describe('UIUX-05 POS Catalog Sorting & Stock Badge Specification', () => {
  const mockProducts: PosCatalogItemTest[] = [
    { id: '1', name: 'iPhone 15 Pro Max 256GB', stock: 0 },
    { id: '2', name: 'Cáp sạc Type-C to Lightning', stock: 45 },
    { id: '3', name: 'Samsung Galaxy S24 Ultra', stock: 0 },
    { id: '4', name: 'Củ sạc nhanh Anker 20W', stock: 12 },
    { id: '5', name: 'Tai nghe AirPods Pro 2', stock: 0 },
    { id: '6', name: 'Ốp lưng Silicon iPhone 15', stock: 150 },
  ];

  it('prioritizes all in-stock products (stock > 0) before out-of-stock products', () => {
    const sorted = sortPosCatalogItems(mockProducts);
    
    // First 3 items must have stock > 0
    expect(sorted[0].stock).toBeGreaterThan(0);
    expect(sorted[1].stock).toBeGreaterThan(0);
    expect(sorted[2].stock).toBeGreaterThan(0);

    // Last 3 items must have stock == 0
    expect(sorted[3].stock).toBe(0);
    expect(sorted[4].stock).toBe(0);
    expect(sorted[5].stock).toBe(0);
  });

  it('sorts in-stock items descending by stock quantity', () => {
    const sorted = sortPosCatalogItems(mockProducts);
    
    // 150 > 45 > 12
    expect(sorted[0].name).toBe('Ốp lưng Silicon iPhone 15');
    expect(sorted[0].stock).toBe(150);

    expect(sorted[1].name).toBe('Cáp sạc Type-C to Lightning');
    expect(sorted[1].stock).toBe(45);

    expect(sorted[2].name).toBe('Củ sạc nhanh Anker 20W');
    expect(sorted[2].stock).toBe(12);
  });

  it('sorts out-of-stock items alphabetically when stock is equal', () => {
    const sorted = sortPosCatalogItems(mockProducts);
    const outOfStockNames = sorted.slice(3).map(i => i.name);
    
    // iPhone 15 Pro Max, Samsung Galaxy S24 Ultra, Tai nghe AirPods Pro 2
    expect(outOfStockNames).toEqual([
      'iPhone 15 Pro Max 256GB',
      'Samsung Galaxy S24 Ultra',
      'Tai nghe AirPods Pro 2'
    ]);
  });

  it('filters by stock status accurately', () => {
    const all = filterPosCatalogByStock(mockProducts, 'ALL');
    expect(all).toHaveLength(6);

    const inStockOnly = filterPosCatalogByStock(mockProducts, 'IN_STOCK');
    expect(inStockOnly).toHaveLength(3);
    expect(inStockOnly.every(i => i.stock > 0)).toBe(true);

    const outOfStockOnly = filterPosCatalogByStock(mockProducts, 'OUT_OF_STOCK');
    expect(outOfStockOnly).toHaveLength(3);
    expect(outOfStockOnly.every(i => i.stock <= 0)).toBe(true);
  });

  it('formats out-of-stock badge in bold red with "Hết hàng"', () => {
    const badge = getStockBadgeProps(0);
    expect(badge.isAvailable).toBe(false);
    expect(badge.text).toBe('Hết hàng');
    expect(badge.textColorClass).toContain('text-rose-600');
    expect(badge.badgeClass).toContain('bg-rose-500/15');
  });

  it('formats in-stock badge with dark "SL: " and green quantity count', () => {
    const badge = getStockBadgeProps(28);
    expect(badge.isAvailable).toBe(true);
    expect(badge.prefix).toBe('SL: ');
    expect(badge.quantity).toBe(28);
    expect(badge.prefixColorClass).toBe('text-foreground');
    expect(badge.quantityColorClass).toContain('text-emerald-600');
  });
});
