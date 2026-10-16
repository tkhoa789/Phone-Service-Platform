import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory.service';
import type { CreateStockTakeCommand, CompleteStockTakeCommand } from '../../../types/api.types';
import toast from 'react-hot-toast';

export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (warehouseId?: string) => [...inventoryKeys.lists(), { warehouseId }] as const,
  warehouses: () => [...inventoryKeys.all, 'warehouses'] as const,
  imei: (imeiNumber: string) => [...inventoryKeys.all, 'imei', imeiNumber] as const,
  stockTakes: (warehouseId?: string, status?: string) => [...inventoryKeys.all, 'stockTakes', { warehouseId, status }] as const,
  stockTake: (id: string) => [...inventoryKeys.all, 'stockTake', id] as const,
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

export const useStockTakes = (warehouseId?: string, status?: string) => {
  return useQuery({
    queryKey: inventoryKeys.stockTakes(warehouseId, status),
    queryFn: () => inventoryService.getStockTakes(warehouseId, status),
  });
};

export const useStockTake = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: inventoryKeys.stockTake(id),
    queryFn: () => inventoryService.getStockTakeById(id),
    enabled: enabled && !!id,
  });
};

export const useCreateStockTake = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: CreateStockTakeCommand) => inventoryService.createStockTake(command),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi lưu phiếu kiểm kê!');
    },
  });
};

export const useStartStockTake = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventoryService.startStockTake(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi bắt đầu kiểm kê!');
    },
  });
};

export const useCompleteStockTake = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, command }: { id: string; command?: CompleteStockTakeCommand }) =>
      inventoryService.completeStockTake(id, command),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi hoàn tất cân bằng kho!');
    },
  });
};

export const useCancelStockTake = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventoryService.cancelStockTake(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi hủy phiếu kiểm kê!');
    },
  });
};

export const useDeleteStockTake = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventoryService.deleteStockTake(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa phiếu kiểm kê!');
    },
  });
};

