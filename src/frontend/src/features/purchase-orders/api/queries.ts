import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getPurchaseOrders, 
  getPurchaseOrderById, 
  createPurchaseOrder, 
  updatePurchaseOrder, 
  completePurchaseOrder, 
  cancelPurchaseOrder, 
  deletePurchaseOrder 
} from './purchaseOrdersApi';

export const purchaseOrderKeys = {
  all: ['purchase-orders'] as const,
  lists: () => [...purchaseOrderKeys.all, 'list'] as const,
  list: (filters: string) => [...purchaseOrderKeys.lists(), { filters }] as const,
  details: () => [...purchaseOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...purchaseOrderKeys.details(), id] as const,
};

export const usePurchaseOrders = (params?: { supplierId?: string; warehouseId?: string; status?: string }) => {
  return useQuery({
    queryKey: purchaseOrderKeys.list(JSON.stringify(params)),
    queryFn: () => getPurchaseOrders(params),
  });
};

export const usePurchaseOrder = (id: string) => {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id),
    queryFn: () => getPurchaseOrderById(id),
    enabled: !!id,
  });
};

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
};

export const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePurchaseOrder,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.id) });
    },
  });
};

export const useCompletePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completePurchaseOrder,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.id) });
    },
  });
};

export const useCancelPurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelPurchaseOrder,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.id) });
    },
  });
};

export const useDeletePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
};
