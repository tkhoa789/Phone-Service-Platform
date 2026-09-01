import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../../../utils/axiosClient';

// Minimal types for POS stock needs
interface Warehouse {
  id: string;
  branchId: string;
}

interface Inventory {
  productVariantId: string;
  quantity: number;
}

export function usePosStock(branchId?: string) {
  return useQuery({
    queryKey: ['pos-stock', branchId],
    queryFn: async () => {
      if (!branchId) return {};

      // 1. Get warehouse for this branch
      const whRes = await axiosClient.get<{data: Warehouse[]}>(`/Warehouse/branch/${branchId}`);
      const warehouses = whRes.data.data || [];
      if (warehouses.length === 0) return {};

      const warehouseId = warehouses[0].id;

      // 2. Get inventory for this warehouse
      const invRes = await axiosClient.get<{data: Inventory[]}>('/Inventory', {
        params: { warehouseId }
      });
      const inventoryList = invRes.data.data || [];

      // 3. Map to variantId -> stockQuantity
      const stockMap: Record<string, number> = {};
      inventoryList.forEach(inv => {
        stockMap[inv.productVariantId] = inv.quantity;
      });

      return stockMap;
    },
    enabled: !!branchId,
    staleTime: 60 * 1000,
  });
}
