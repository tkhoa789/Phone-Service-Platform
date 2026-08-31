import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory.service';
import type { CreateStockTakeCommand } from '../../../types/api.types';
import toast from 'react-hot-toast';

export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (warehouseId?: string) => [...inventoryKeys.lists(), { warehouseId }] as const,
  warehouses: () => [...inventoryKeys.all, 'warehouses'] as const,
  imei: (imeiNumber: string) => [...inventoryKeys.all, 'imei', imeiNumber] as const,
};

export const useInventoryList = (warehouseId?: string) => {
  return useQuery({
    queryKey: inventoryKeys.list(warehouseId),
    queryFn: () => inventoryService.getAll(warehouseId),
  });
};

export const useWarehouses = () => {
  return useQuery({
    queryKey: inventoryKeys.warehouses(),
    queryFn: () => inventoryService.getWarehouses(),
  });
};

export const useImeiLookup = (imeiNumber: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: inventoryKeys.imei(imeiNumber),
    queryFn: () => inventoryService.getByImei(imeiNumber),
    enabled: enabled && !!imeiNumber,
    retry: false, // Don't retry if IMEI not found
  });
};

export const useCreateStockTake = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: CreateStockTakeCommand) => inventoryService.createStockTake(command),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi lưu phiếu kiểm kê!');
    },
  });
};
