import { axiosClient } from '../../../utils/axiosClient';
import type { ApiResponse } from '../../../types/api.types';
import type {
  SupplierDto,
  CreateSupplierCommand,
  SupplierDebtTransactionDto,
  PaySupplierDebtCommand,
  SupplierListFilterParams,
} from '../types/supplier.types';

export const supplierApi = {
  getSuppliers: async (filters?: SupplierListFilterParams): Promise<SupplierDto[]> => {
    const response = await axiosClient.get<ApiResponse<SupplierDto[]>>('/Supplier');
    let items = response.data.data || [];
    
    // Client-side filtering
    if (filters?.keyword) {
      const kw = filters.keyword.toLowerCase();
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(kw) ||
          s.code.toLowerCase().includes(kw) ||
          s.phone.includes(kw)
      );
    }
    return items;
  },

  getSupplierById: async (id: string): Promise<SupplierDto> => {
    const response = await axiosClient.get<ApiResponse<SupplierDto>>(`/Supplier/${id}`);
    return response.data.data;
  },

  createSupplier: async (command: CreateSupplierCommand): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/Supplier', command);
    return response.data.data;
  },

  updateSupplier: async (params: { id: string; command: Partial<CreateSupplierCommand> }): Promise<boolean> => {
    const response = await axiosClient.put<ApiResponse<boolean>>(`/Supplier/${params.id}`, {
      id: params.id,
      ...params.command,
    });
    return response.data.data;
  },

  deleteSupplier: async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<ApiResponse<boolean>>(`/Supplier/${id}`);
    return response.data.data;
  },

  payDebt: async (command: PaySupplierDebtCommand): Promise<boolean> => {
    const response = await axiosClient.post<ApiResponse<boolean>>(`/Supplier/${command.supplierId}/pay`, command);
    return response.data.data;
  },

  getDebtLedger: async (supplierId: string): Promise<SupplierDebtTransactionDto[]> => {
    const response = await axiosClient.get<ApiResponse<SupplierDebtTransactionDto[]>>(`/Supplier/${supplierId}/ledger`);
    return response.data.data || [];
  },
};
