import { describe, it, expect, vi } from 'vitest';
import { axiosClient } from '../../utils/axiosClient';
import { productService } from '../productService';
import { serviceService } from '../serviceService';
import { inventoryService } from '../../features/inventory/services/inventory.service';

describe('Authoritative FE-BE Wire Contracts Protection', () => {
  it('productService.getAll sends keyword query parameter (MISMATCH-01)', async () => {
    const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
      data: {
        code: 'SUCCESS',
        data: { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 1 }
      }
    });

    await productService.getAll({ search: 'iPhone' });

    expect(getSpy).toHaveBeenCalledWith('/Product', {
      params: expect.objectContaining({
        keyword: 'iPhone'
      })
    });
  });

  it('serviceService.collectRepairDeposit sends plural /deposits and Idempotency-Key header (BUG-02)', async () => {
    const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
      data: { code: 'SUCCESS', data: 'deposit-uuid-123', isSuccess: true }
    });

    const ticketId = 'ticket-uuid-abc';
    const key = 'idemp-key-test';
    await serviceService.collectRepairDeposit(
      ticketId,
      {
        amount: 500000,
        paymentMethodId: 'cash-id',
        transactionCode: 'TX-12345',
        idempotencyKey: key
      },
      key
    );

    expect(postSpy).toHaveBeenCalledWith(
      `/RepairTicket/${ticketId}/deposits`,
      expect.objectContaining({
        repairTicketId: ticketId,
        amount: 500000
      }),
      {
        headers: { 'Idempotency-Key': key }
      }
    );
  });

  it('inventoryService.updateImeiStatus sends JSON object payload (MISMATCH-03)', async () => {
    const putSpy = vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({
      data: { code: 'SUCCESS', data: true, isSuccess: true }
    });

    await inventoryService.updateImeiStatus('860123456789012', 'Repairing');

    expect(putSpy).toHaveBeenCalledWith(
      '/Inventory/imei/860123456789012/status',
      { status: 'Repairing' }
    );
  });
});
