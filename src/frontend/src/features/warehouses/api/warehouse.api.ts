import { axiosClient } from '../../../utils/axiosClient';
import type { ApiResponse } from '../../../types/api.types';
import type {
  WarehouseDto,
  CreateWarehouseCommand,
  UpdateWarehouseCommand,
  WarehouseListFilterParams,
} from '../types/warehouse.types';

export const warehouseApi = {
  getWarehouses: async (filters?: WarehouseListFilterParams): Promise<WarehouseDto[]> => {
    let url = '/Warehouse';
    if (filters?.branchId) {
      url = `/Warehouse/branch/${filters.branchId}`;
    }
    
    const response = await axiosClient.get<ApiResponse<WarehouseDto[]>>(url);
    let items = response.data.data || [];
    
    // Client-side keyword filtering
    if (filters?.keyword) {
      const kw = filters.keyword.toLowerCase();
      items = items.filter(
        (w) =>
          w.name.toLowerCase().includes(kw) ||
          w.code.toLowerCase().includes(kw) ||
          (w.branchName && w.branchName.toLowerCase().includes(kw))
      );
    }
    return items;
  },

  getWarehouseById: async (id: string): Promise<WarehouseDto> => {
    const response = await axiosClient.get<ApiResponse<WarehouseDto>>(`/Warehouse/${id}`);
    return response.data.data;
  },

  createWarehouse: async (command: CreateWarehouseCommand): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/Warehouse', command);
    return response.data.data;
  },

  updateWarehouse: async (command: UpdateWarehouseCommand): Promise<boolean> => {
    const response = await axiosClient.put<ApiResponse<boolean>>(`/Warehouse/${command.id}`, command);
    return response.data.data;
  },

  deleteWarehouse: async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<ApiResponse<boolean>>(`/Warehouse/${id}`);
    return response.data.data;
  },
};
