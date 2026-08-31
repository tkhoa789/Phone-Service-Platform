import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../../../services/salesService';
import type { CreateSalesOrderCommand } from '../../../types/api.types';

export function usePosCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ command, idempotencyKey }: { command: CreateSalesOrderCommand; idempotencyKey: string }) => {
      // Step 1: Create Order with Idempotency Key
      const orderId = await salesService.createOrder(command, idempotencyKey);
      
      // Step 2: Complete Order
      await salesService.updateOrderStatus(orderId, 'Completed');
      
      return orderId;
    },
    onSuccess: () => {
      // Invalidate relevant queries (e.g., inventory, sales orders)
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'variants'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    }
  });
}
