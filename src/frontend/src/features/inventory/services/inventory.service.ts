import { axiosClient } from '../../../utils/axiosClient';
import type { ApiResponse, InventoryDto, ImeiDto, WarehouseDto, CreateStockTakeCommand } from '../../../types/api.types';

export const inventoryService = {
  createStockTake: async (command: CreateStockTakeCommand): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/StockTake', command);
    return response.data.data;
  },
  getWarehouses: async (): Promise<WarehouseDto[]> => {
    const response = await axiosClient.get<ApiResponse<WarehouseDto[]>>('/Warehouse');
    return response.data.data;
  },

  getInventory: async (warehouseId?: string): Promise<InventoryDto[]> => {
    const response = await axiosClient.get<ApiResponse<InventoryDto[]>>('/Inventory', {
      params: { warehouseId },
    });
    return response.data.data;
  },

  getAll: async (warehouseId?: string): Promise<InventoryDto[]> => {
    const response = await axiosClient.get<ApiResponse<InventoryDto[]>>('/Inventory', {
      params: { warehouseId },
    });
    return response.data.data;
  },

  getImeiHistory: async (imeiNumber: string): Promise<ImeiDto> => {
    const response = await axiosClient.get<ApiResponse<ImeiDto>>(`/Inventory/imei/${imeiNumber}`);
    return response.data.data;
  },

  getByImei: async (imeiNumber: string): Promise<ImeiDto> => {
    const response = await axiosClient.get<ApiResponse<ImeiDto>>(`/Inventory/imei/${imeiNumber}`);
    return response.data.data;
  },

  updateImeiStatus: async (imeiId: string, status: string): Promise<boolean> => {
    const response = await axiosClient.put<ApiResponse<boolean>>(`/Inventory/imei/${imeiId}/status`, { status });
    return response.data.data;
  },
};
