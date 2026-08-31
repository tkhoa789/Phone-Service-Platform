import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../api/customer.api';
import type { CustomerListFilterParams, CreateCustomerCommand } from '../types/customer.types';
import toast from 'react-hot-toast';

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters: CustomerListFilterParams) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

export const useCustomers = (filters: CustomerListFilterParams) => {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => customerApi.getCustomers(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerApi.getCustomerById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: CreateCustomerCommand) => customerApi.createCustomer(command),
    onSuccess: () => {
      toast.success('Thêm khách hàng thành công!');
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
    onError: (error: any) => {
      // Allow components to catch and handle 400 validation errors
      if (error?.response?.status !== 400) {
        toast.error('Có lỗi xảy ra khi thêm khách hàng.');
      }
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; command: CreateCustomerCommand }) => customerApi.updateCustomer(params),
    onSuccess: (_, variables) => {
      toast.success('Cập nhật khách hàng thành công!');
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
    },
    onError: (error: any) => {
      if (error?.response?.status !== 400) {
        toast.error('Có lỗi xảy ra khi cập nhật khách hàng.');
      }
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerApi.deleteCustomer(id),
    onSuccess: () => {
      toast.success('Xóa khách hàng thành công!');
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
    onError: (error: any) => {
      if (error?.response?.data?.message) {
         toast.error(`Không thể xóa: ${error.response.data.message}`);
      } else {
         toast.error('Có lỗi xảy ra khi xóa khách hàng.');
      }
    },
  });
};

import { customerService } from '@/services/customerService';
export const useAllCustomers = () => {
  return useQuery({
    queryKey: [...customerKeys.all, 'all-list'],
    queryFn: () => customerService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};
