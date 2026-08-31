import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseApi } from '../api/warehouse.api';
import type { WarehouseListFilterParams, CreateWarehouseCommand, UpdateWarehouseCommand } from '../types/warehouse.types';
import toast from 'react-hot-toast';

export const warehouseKeys = {
  all: ['warehouses'] as const,
  lists: () => [...warehouseKeys.all, 'list'] as const,
  list: (filters: WarehouseListFilterParams) => [...warehouseKeys.lists(), filters] as const,
  details: () => [...warehouseKeys.all, 'detail'] as const,
  detail: (id: string) => [...warehouseKeys.details(), id] as const,
};

export const useWarehouses = (filters: WarehouseListFilterParams) => {
  return useQuery({
    queryKey: warehouseKeys.list(filters),
    queryFn: () => warehouseApi.getWarehouses(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useWarehouse = (id: string) => {
  return useQuery({
    queryKey: warehouseKeys.detail(id),
    queryFn: () => warehouseApi.getWarehouseById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: CreateWarehouseCommand) => warehouseApi.createWarehouse(command),
    onSuccess: () => {
      toast.success('Thêm kho hàng thành công!');
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() });
    },
    onError: (error: any) => {
      if (error?.response?.status !== 400) {
        toast.error('Có lỗi xảy ra khi thêm kho hàng.');
      }
    },
  });
};

export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: UpdateWarehouseCommand) => warehouseApi.updateWarehouse(command),
    onSuccess: (_, variables) => {
      toast.success('Cập nhật kho hàng thành công!');
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(variables.id) });
    },
    onError: (error: any) => {
      if (error?.response?.status !== 400) {
        toast.error('Có lỗi xảy ra khi cập nhật kho hàng.');
      }
    },
  });
};

export const useDeleteWarehouse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => warehouseApi.deleteWarehouse(id),
    onSuccess: () => {
      toast.success('Xóa kho hàng thành công!');
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() });
    },
    onError: (error: any) => {
      if (error?.response?.data?.message) {
         toast.error(`Không thể xóa: ${error.response.data.message}`);
      } else {
         toast.error('Có lỗi xảy ra khi xóa kho hàng.');
      }
    },
  });
};
