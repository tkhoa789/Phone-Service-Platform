import { describe, it, expect, beforeEach, vi } from 'vitest';
import { repairSandboxService } from '../features/repairs/services/repairSandboxService';

describe('Technician Sandbox Service (Isolated Storage & Business Logic)', () => {
  const CURRENT_TECH_ID = 'tech-demo-uuid-001';
  const CURRENT_TECH_NAME = 'Nguyễn Văn Kỹ Thuật';

  beforeEach(() => {
    localStorage.clear();
    repairSandboxService.resetToDefault();
    vi.clearAllMocks();
  });

  describe('1. Seed Data Initialization & Query Filtering', () => {
    it('initializes 4 standard scenario repair tickets', () => {
      const tickets = repairSandboxService.getRepairs(CURRENT_TECH_ID);
      expect(tickets).toHaveLength(4);

      const [s24u, ip15pm, mi14u, ipad] = tickets;
      expect(s24u.ticketCode).toBe('REP-DEMO-01');
      expect(s24u.status).toBe('PendingAssignment');
      expect(s24u.technicianId).toBeUndefined();

      expect(ip15pm.ticketCode).toBe('REP-DEMO-02');
      expect(ip15pm.status).toBe('Repairing');
      expect(ip15pm.technicianId).toBe(CURRENT_TECH_ID);

      expect(mi14u.ticketCode).toBe('REP-DEMO-03');
      expect(mi14u.status).toBe('WaitingForParts');

      expect(ipad.ticketCode).toBe('REP-DEMO-04');
      expect(ipad.status).toBe('Completed');
    });

    it('filters tickets accurately by search query (IMEI, customer, code)', () => {
      // By Code
      const byCode = repairSandboxService.getRepairs({ search: 'REP-DEMO-01' });
      expect(byCode).toHaveLength(1);
      expect(byCode[0].ticketCode).toBe('REP-DEMO-01');

      // By Customer Name
      const byCustomer = repairSandboxService.getRepairs({ search: 'Hoàng Nam' });
      expect(byCustomer).toHaveLength(1);
      expect(byCustomer[0].ticketCode).toBe('REP-DEMO-01');

      // By IMEI
      const byImei = repairSandboxService.getRepairs({ search: '354892019283745' });
      expect(byImei).toHaveLength(1);
      expect(byImei[0].ticketCode).toBe('REP-DEMO-02');
    });

    it('filters tickets accurately by queue tab', () => {
      // UNASSIGNED queue
      const unassigned = repairSandboxService.getRepairs({ queue: 'UNASSIGNED', technicianId: CURRENT_TECH_ID });
      expect(unassigned).toHaveLength(1);
      expect(unassigned[0].ticketCode).toBe('REP-DEMO-01');

      // MY_TICKETS queue
      const myTickets = repairSandboxService.getRepairs({ queue: 'MY_TICKETS', technicianId: CURRENT_TECH_ID });
      expect(myTickets.length).toBeGreaterThanOrEqual(2);
      expect(myTickets.some(t => t.ticketCode === 'REP-DEMO-02')).toBe(true);

      // IN_PROGRESS queue
      const inProgress = repairSandboxService.getRepairs({ queue: 'IN_PROGRESS' });
      expect(inProgress.some(t => t.ticketCode === 'REP-DEMO-02')).toBe(true);
      expect(inProgress.some(t => t.ticketCode === 'REP-DEMO-03')).toBe(true);

      // COMPLETED queue
      const completed = repairSandboxService.getRepairs({ queue: 'COMPLETED' });
      expect(completed).toHaveLength(1);
      expect(completed[0].ticketCode).toBe('REP-DEMO-04');
    });
  });

  describe('2. Queue Statistics (getRepairStats)', () => {
    it('computes metrics conforming with RepairQueueStatsDto', () => {
      const stats = repairSandboxService.getRepairStats(CURRENT_TECH_ID);
      expect(stats.unassignedCount).toBe(1);
      expect(stats.waitingForPartsCount).toBe(1);
      expect(stats.completedCount).toBe(1);
      expect(stats.deliveredCount).toBe(0);
      expect(stats.totalCount).toBe(4);
      expect(stats.inProgressCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('3. Operational State Transitions & Claiming', () => {
    it('claims an unassigned ticket, transitions to Diagnosing, and dispatches event', () => {
      const listener = vi.fn();
      window.addEventListener('psp_sandbox_repairs_updated', listener);

      const claimed = repairSandboxService.claimTicket('demo-rep-01', CURRENT_TECH_ID, CURRENT_TECH_NAME);

      expect(claimed.technicianId).toBe(CURRENT_TECH_ID);
      expect(claimed.technicianName).toBe(CURRENT_TECH_NAME);
      expect(claimed.status).toBe('Diagnosing');
      expect(claimed.statusHistories).toHaveLength(2);
      expect(claimed.statusHistories[1].status).toBe('Diagnosing');

      expect(listener).toHaveBeenCalled();
      window.removeEventListener('psp_sandbox_repairs_updated', listener);
    });

    it('updates ticket status through valid state machine path', () => {
      const updated = repairSandboxService.updateStatus('demo-rep-02', 'WaitingQC', 'Đã thay pin xong, gửi kiểm định QC');
      expect(updated.status).toBe('WaitingQC');

      const completed = repairSandboxService.updateStatus('demo-rep-02', 'Completed', 'QC Pass 10/10');
      expect(completed.status).toBe('Completed');
      expect(completed.completedDate).toBeDefined();
    });

    it('adds replacement parts and updates financial totals correctly', () => {
      const updated = repairSandboxService.addPart('demo-rep-02', {
        productName: 'Seal dán áp suất nắp lưng iPhone 15 Pro Max',
        productSku: 'SEAL-IP15PM',
        quantity: 1,
        unitPrice: 50000,
      }, CURRENT_TECH_NAME);

      expect(updated.parts).toHaveLength(2);
      expect(updated.partsTotal).toBe(1050000); // 1.000.000 + 50.000
      expect(updated.totalAmount).toBe(1300000); // 250.000 công + 1.050.000 linh kiện
    });

    it('delivers completed repair ticket to customer', () => {
      const delivered = repairSandboxService.deliverRepair('demo-rep-04', CURRENT_TECH_NAME);
      expect(delivered.status).toBe('Delivered');
    });

    it('resets all data back to default initial state', () => {
      repairSandboxService.claimTicket('demo-rep-01', CURRENT_TECH_ID, CURRENT_TECH_NAME);
      repairSandboxService.deliverRepair('demo-rep-04', CURRENT_TECH_NAME);

      repairSandboxService.resetToDefault();

      const tickets = repairSandboxService.getRepairs();
      const s24u = tickets.find(t => t.id === 'demo-rep-01');
      expect(s24u?.status).toBe('PendingAssignment');
      expect(s24u?.technicianId).toBeUndefined();
    });
  });
});
