import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierApi } from '../api/supplier.api';
import type { SupplierListFilterParams, CreateSupplierCommand, PaySupplierDebtCommand } from '../types/supplier.types';
import toast from 'react-hot-toast';

export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (filters: SupplierListFilterParams) => [...supplierKeys.lists(), filters] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (id: string) => [...supplierKeys.details(), id] as const,
  ledgers: () => [...supplierKeys.all, 'ledger'] as const,
  ledger: (id: string) => [...supplierKeys.ledgers(), id] as const,
};

export const useSuppliers = (filters: SupplierListFilterParams) => {
  return useQuery({
    queryKey: supplierKeys.list(filters),
    queryFn: () => supplierApi.getSuppliers(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSupplier = (id: string) => {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => supplierApi.getSupplierById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSupplierLedger = (id: string) => {
  return useQuery({
    queryKey: supplierKeys.ledger(id),
    queryFn: () => supplierApi.getDebtLedger(id),
    enabled: !!id,
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: CreateSupplierCommand) => supplierApi.createSupplier(command),
    onSuccess: () => {
      toast.success('Thêm nhà cung cấp thành công!');
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
    onError: (error: any) => {
      if (error?.response?.status !== 400) {
        toast.error('Có lỗi xảy ra khi thêm nhà cung cấp.');
      }
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; command: Partial<CreateSupplierCommand> }) => supplierApi.updateSupplier(params),
    onSuccess: (_, variables) => {
      toast.success('Cập nhật nhà cung cấp thành công!');
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.id) });
    },
    onError: (error: any) => {
      if (error?.response?.status !== 400) {
        toast.error('Có lỗi xảy ra khi cập nhật nhà cung cấp.');
      }
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => supplierApi.deleteSupplier(id),
    onSuccess: () => {
      toast.success('Xóa nhà cung cấp thành công!');
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
    onError: (error: any) => {
      if (error?.response?.data?.message) {
         toast.error(`Không thể xóa: ${error.response.data.message}`);
      } else {
         toast.error('Có lỗi xảy ra khi xóa nhà cung cấp.');
      }
    },
  });
};

export const usePaySupplierDebt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: PaySupplierDebtCommand) => supplierApi.payDebt(command),
    onSuccess: (_, variables) => {
      toast.success('Thanh toán công nợ thành công!');
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.supplierId) });
      queryClient.invalidateQueries({ queryKey: supplierKeys.ledger(variables.supplierId) });
    },
    onError: (error: any) => {
      if (error?.response?.status !== 400) {
        toast.error('Có lỗi xảy ra khi thanh toán công nợ.');
      }
    },
  });
};
