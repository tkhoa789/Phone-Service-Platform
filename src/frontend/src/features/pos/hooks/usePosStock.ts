import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../../../utils/axiosClient';

// Minimal types for POS stock needs
interface Warehouse {
  id: string;
  branchId: string;
}

interface Inventory {
  warehouseId: string;
  productVariantId: string;
  quantity: number;
}

export function usePosStock(branchId?: string) {
  return useQuery({
    queryKey: ['pos-stock', branchId],
    queryFn: async () => {
      if (!branchId) return {};

      // 1. Get warehouses for this branch
      const whRes = await axiosClient.get<{data: Warehouse[]}>(`/Warehouse/branch/${branchId}`);
      const warehouses = whRes.data.data || [];
      if (warehouses.length === 0) return {};

      const branchWarehouseIds = new Set(warehouses.map(w => w.id));

      // 2. Get inventory for this branch (backend auto-filters by user branch scope)
      const invRes = await axiosClient.get<any>('/Inventory');
      const rawData = invRes.data?.data;
      const inventoryList: Inventory[] = Array.isArray(rawData) ? rawData : (rawData?.items || []);

      // 3. Map to variantId -> stockQuantity (aggregated across branch warehouses)
      const stockMap: Record<string, number> = {};
      inventoryList.forEach(inv => {
        if (branchWarehouseIds.has(inv.warehouseId)) {
          stockMap[inv.productVariantId] = (stockMap[inv.productVariantId] || 0) + inv.quantity;
        }
      });

      return stockMap;
    },
    enabled: !!branchId,
    staleTime: 60 * 1000,
  });
}
