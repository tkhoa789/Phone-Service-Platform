import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../../../services/salesService';
import type { CreateSalesOrderCommand } from '../../../types/api.types';

export interface PosCheckoutParams {
  command: CreateSalesOrderCommand;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  cashGiven?: number;
  idempotencyKey: string;
}

export interface PosCheckoutResult {
  orderId: string;
  invoiceId: string;
  paymentId: string;
  orderCode: string;
  invoiceCode: string;
  total: number;
}

export function usePosCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ command, paymentMethod, cashGiven, idempotencyKey }: PosCheckoutParams): Promise<PosCheckoutResult> => {
      // Step 1: Create Sales Order with Idempotency Key
      const orderId = await salesService.createOrder(command, idempotencyKey);
      
      // Step 2: Fetch the created order to obtain its accurate server-computed total and code
      const order = await salesService.getOrderById(orderId);

      // Step 3: Create Invoice for this order
      let invoiceId: string;
      try {
        invoiceId = await salesService.createInvoice({ salesOrderId: orderId });
      } catch (err: any) {
        // If invoice was already created (e.g. idempotency retry), fetch it
        const existingInvoice = await salesService.getInvoiceBySalesOrderId(orderId);
        if (existingInvoice) {
          invoiceId = existingInvoice.id;
        } else {
          throw err;
        }
      }

      const invoice = await salesService.getInvoiceById(invoiceId);

      // Step 4: Fetch active payment methods and map to selected method
      const paymentMethods = await salesService.getPaymentMethods();
      const matchedMethod = paymentMethods.find(m => m.code === paymentMethod) || paymentMethods[0];

      if (!matchedMethod) {
        throw new Error('Không tìm thấy phương thức thanh toán phù hợp.');
      }

      // Step 5: Record Payment (which marks invoice as Paid and auto-completes order + decrements stock)
      const txnCode = `PAY-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const paymentId = await salesService.createPayment({
        invoiceId,
        paymentMethodId: matchedMethod.id,
        code: txnCode,
        amount: invoice.amount
      });

      return {
        orderId,
        invoiceId,
        paymentId,
        orderCode: order.code || (order as any).orderCode || orderId,
        invoiceCode: invoice.code,
        total: invoice.amount
      };
    },
    onSuccess: () => {
      // Invalidate relevant queries (e.g., inventory, sales orders)
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'variants'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'stock'] });
    }
  });
}
