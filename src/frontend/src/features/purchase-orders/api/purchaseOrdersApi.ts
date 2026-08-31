import { axiosClient as apiClient } from '../../../utils/axiosClient';
import type { ApiResponse } from '../../../types/api.types';
import type { 
  PurchaseOrderDto, 
  CreatePurchaseOrderCommand, 
  UpdatePurchaseOrderCommand, 
  CompletePurchaseOrderCommand 
} from '../types';

export const getPurchaseOrders = async (params?: { supplierId?: string; warehouseId?: string; status?: string }): Promise<PurchaseOrderDto[]> => {
  const query = new URLSearchParams();
  if (params?.supplierId) query.append('supplierId', params.supplierId);
  if (params?.warehouseId) query.append('warehouseId', params.warehouseId);
  if (params?.status) query.append('status', params.status);

  const queryString = query.toString();
  const url = queryString ? `/PurchaseOrder?${queryString}` : '/PurchaseOrder';
  const response = await apiClient.get<ApiResponse<PurchaseOrderDto[]>>(url);
  return response.data.data;
};

export const getPurchaseOrderById = async (id: string): Promise<PurchaseOrderDto> => {
  const response = await apiClient.get<ApiResponse<PurchaseOrderDto>>(`/PurchaseOrder/${id}`);
  return response.data.data;
};

export const createPurchaseOrder = async (data: CreatePurchaseOrderCommand): Promise<string> => {
  const response = await apiClient.post<ApiResponse<string>>('/PurchaseOrder', data);
  return response.data.data;
};

export const updatePurchaseOrder = async ({ id, data }: { id: string; data: UpdatePurchaseOrderCommand }): Promise<boolean> => {
  const response = await apiClient.put<ApiResponse<boolean>>(`/PurchaseOrder/${id}`, data);
  return response.data.data;
};

export const completePurchaseOrder = async ({ id, data }: { id: string; data: CompletePurchaseOrderCommand }): Promise<boolean> => {
  const response = await apiClient.put<ApiResponse<boolean>>(`/PurchaseOrder/${id}/complete`, data);
  return response.data.data;
};

export const cancelPurchaseOrder = async (id: string): Promise<boolean> => {
  const response = await apiClient.put<ApiResponse<boolean>>(`/PurchaseOrder/${id}/cancel`);
  return response.data.data;
};

export const deletePurchaseOrder = async (id: string): Promise<boolean> => {
  const response = await apiClient.delete<ApiResponse<boolean>>(`/PurchaseOrder/${id}`);
  return response.data.data;
};
