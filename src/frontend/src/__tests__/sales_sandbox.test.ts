import { describe, it, expect, beforeEach } from 'vitest';
import { salesSandboxService } from '../features/sales/services/salesSandboxService';

describe('SalesSandboxService', () => {
  beforeEach(() => {
    salesSandboxService.resetToDefault();
  });

  it('should initialize with 4 default sandbox orders', () => {
    const orders = salesSandboxService.getOrders();
    expect(orders).toHaveLength(4);

    const pending = salesSandboxService.getOrders({ status: 'Pending' });
    expect(pending).toHaveLength(2);

    const completed = salesSandboxService.getOrders({ status: 'Completed' });
    expect(completed).toHaveLength(2);
  });

  it('should filter orders by search query', () => {
    const results = salesSandboxService.getOrders({ search: 'Hoàng Nam' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].customerName).toContain('Hoàng Nam');
  });

  it('should complete a pending order', () => {
    const updated = salesSandboxService.completeOrder('so-demo-01');
    expect(updated.status).toBe('Completed');
    expect(updated.hasInvoice).toBe(true);
    expect(updated.invoiceCode).toBe('INV-SO-DEMO-01');

    const pending = salesSandboxService.getOrders({ status: 'Pending' });
    expect(pending).toHaveLength(1);
  });

  it('should cancel a pending order', () => {
    const updated = salesSandboxService.cancelOrder('so-demo-02');
    expect(updated.status).toBe('Cancelled');

    const pending = salesSandboxService.getOrders({ status: 'Pending' });
    expect(pending).toHaveLength(1);
  });

  it('should provide products, variants and stock map for POS', () => {
    const products = salesSandboxService.getProducts();
    expect(products.length).toBeGreaterThan(0);

    const variants = salesSandboxService.getVariants();
    expect(variants.length).toBeGreaterThan(0);

    const stock = salesSandboxService.getStockMap();
    expect(stock['pv-anker-65w']).toBe(24);
  });

  it('should validate voucher codes correctly', () => {
    // Valid voucher SALES10 with minOrderValue
    const v1 = salesSandboxService.validateVoucher('SALES10', 500000);
    expect(v1.isValid).toBe(true);
    expect(v1.discountAmount).toBe(50000); // 10% of 500k

    // Order below minOrderValue
    const v2 = salesSandboxService.validateVoucher('SALES10', 100000);
    expect(v2.isValid).toBe(false);

    // Non-existent voucher
    const v3 = salesSandboxService.validateVoucher('INVALID');
    expect(v3.isValid).toBe(false);
  });

  it('should create new customer in sandbox', () => {
    const newCust = salesSandboxService.createCustomer({
      fullName: 'Trần Thị Thu Thảo',
      phone: '0977889900',
      address: 'Quận 7, TP.HCM',
    });

    expect(newCust.id).toBeDefined();
    expect(newCust.fullName).toBe('Trần Thị Thu Thảo');

    const customers = salesSandboxService.getCustomers();
    expect(customers.some((c) => c.phone === '0977889900')).toBe(true);
  });

  it('should process POS checkout and deduct stock', () => {
    const stockBefore = salesSandboxService.getStockMap()['pv-anker-65w'];

    const checkoutResult = salesSandboxService.checkout({
      command: {
        customerId: 'cust-demo-01',
        voucherCode: 'TRIAN50K',
        items: [
          {
            productVariantId: 'pv-anker-65w',
            quantity: 2,
            unitPrice: 650000,
          },
        ],
      },
      paymentMethod: 'CASH',
      cashGiven: 1500000,
    });

    expect(checkoutResult.orderId).toBeDefined();
    expect(checkoutResult.orderCode).toContain('SO-DEMO');
    // Subtotal = 1.300.000, voucher = 50.000 -> Total = 1.250.000
    expect(checkoutResult.total).toBe(1250000);

    const stockAfter = salesSandboxService.getStockMap()['pv-anker-65w'];
    expect(stockAfter).toBe(stockBefore - 2);

    // Check order created
    const createdOrder = salesSandboxService.getOrderById(checkoutResult.orderId);
    expect(createdOrder).toBeDefined();
    expect(createdOrder?.status).toBe('Completed');
    expect(createdOrder?.discount).toBe(50000);
  });

  it('should reset all data back to default on resetToDefault', () => {
    salesSandboxService.completeOrder('so-demo-01');
    salesSandboxService.createCustomer({ fullName: 'Temp User', phone: '0900000001' });

    salesSandboxService.resetToDefault();

    const orders = salesSandboxService.getOrders();
    expect(orders).toHaveLength(4);
    expect(orders.find((o) => o.id === 'so-demo-01')?.status).toBe('Pending');
  });
});
