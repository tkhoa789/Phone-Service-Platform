import { describe, it, expect, beforeEach } from 'vitest';
import { managerSandboxService } from '../features/dashboard/services/managerSandboxService';
import { salesSandboxService } from '../features/sales/services/salesSandboxService';

describe('ManagerSandboxService', () => {
  beforeEach(() => {
    managerSandboxService.resetAll();
  });

  it('should initialize with 18 sandbox requests across 3 pillars', () => {
    const requests = managerSandboxService.getRequests();
    expect(requests).toHaveLength(18);

    const voidOrders = requests.filter(r => r.type === 'VOID_ORDER');
    expect(voidOrders).toHaveLength(6);

    const discrepancies = requests.filter(r => r.type === 'STOCK_DISCREPANCY');
    expect(discrepancies).toHaveLength(6);

    const specialParts = requests.filter(r => r.type === 'SPECIAL_PART');
    expect(specialParts).toHaveLength(6);
  });

  it('should filter requests by branch context', () => {
    const branchRequests = managerSandboxService.getRequests('branch-q1');
    expect(branchRequests.length).toBeGreaterThan(0);
    expect(branchRequests.every(r => r.branchId === 'branch-q1')).toBe(true);
  });

  it('should get single request by ID', () => {
    const req = managerSandboxService.getRequestById('REQ-V01');
    expect(req).toBeDefined();
    expect(req?.title).toContain('SO-2609-0012');
    expect(req?.amount).toBe(14500000);
    expect(req?.status).toBe('PENDING');
  });

  it('should approve request and trigger bi-directional sync with sales orders', () => {
    // Approve VOID_ORDER request REQ-V01 (related to so-demo-01)
    const approved = managerSandboxService.approveRequest('REQ-V01');
    expect(approved).toBeDefined();
    expect(approved?.status).toBe('APPROVED');
    expect(approved?.processedAt).toBeDefined();

    // Verify order in salesSandboxService is automatically cancelled
    const order = salesSandboxService.getOrderById('so-demo-01');
    expect(order?.status).toBe('Cancelled');
  });

  it('should reject request with valid audit reason', () => {
    const rejectionReason = 'Khách đã lấy hàng rời cửa hàng, không đủ điều kiện hủy đơn';
    const rejected = managerSandboxService.rejectRequest('REQ-V02', rejectionReason);

    expect(rejected).toBeDefined();
    expect(rejected?.status).toBe('REJECTED');
    expect(rejected?.rejectionReason).toBe(rejectionReason);
    expect(rejected?.processedAt).toBeDefined();
  });

  it('should bi-directionally resolve void order when manager cancels directly on sales page', () => {
    // Manager cancels SO-2609-0012 on /sales
    managerSandboxService.resolveVoidOrder('SO-2609-0012');

    const req = managerSandboxService.getRequestById('REQ-V01');
    expect(req?.status).toBe('APPROVED');
  });

  it('should bi-directionally resolve stock discrepancy when manager reconciles on stock-take page', () => {
    // Manager reconciles stock take
    managerSandboxService.resolveStockDiscrepancy('ST-Q1-01');

    const req = managerSandboxService.getRequestById('REQ-S01');
    expect(req?.status).toBe('APPROVED');
  });

  it('should reset all requests to initial pending state on resetAll', () => {
    managerSandboxService.approveRequest('REQ-V01');
    managerSandboxService.rejectRequest('REQ-V02', 'Rejected test');

    managerSandboxService.resetAll();

    const requests = managerSandboxService.getRequests();
    expect(requests.every(r => r.status === 'PENDING')).toBe(true);
  });
});
