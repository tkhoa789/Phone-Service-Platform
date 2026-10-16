import { axiosClient } from '../../../utils/axiosClient';
import type { ApiResponse, InventoryDto, ImeiDto, WarehouseDto, CreateStockTakeCommand, StockTakeDto, CompleteStockTakeCommand } from '../../../types/api.types';

export const inventoryService = {
  createStockTake: async (command: CreateStockTakeCommand): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/StockTake', command);
    return response.data.data;
  },
  getStockTakes: async (warehouseId?: string, status?: string): Promise<StockTakeDto[]> => {
    const response = await axiosClient.get<ApiResponse<StockTakeDto[]>>('/StockTake', {
      params: { warehouseId, status }
    });
    return response.data.data;
  },
  getStockTakeById: async (id: string): Promise<StockTakeDto> => {
    const response = await axiosClient.get<ApiResponse<StockTakeDto>>(`/StockTake/${id}`);
    return response.data.data;
  },
  startStockTake: async (id: string): Promise<boolean> => {
    const response = await axiosClient.put<ApiResponse<boolean>>(`/StockTake/${id}/start`);
    return response.data.data;
  },
  completeStockTake: async (id: string, command?: CompleteStockTakeCommand): Promise<boolean> => {
    const response = await axiosClient.put<ApiResponse<boolean>>(`/StockTake/${id}/complete`, command ?? { id });
    return response.data.data;
  },
  cancelStockTake: async (id: string): Promise<boolean> => {
    const response = await axiosClient.put<ApiResponse<boolean>>(`/StockTake/${id}/cancel`);
    return response.data.data;
  },
  deleteStockTake: async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<ApiResponse<boolean>>(`/StockTake/${id}`);
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

  // ============================================
  // WAREHOUSE TRANSFER APIs
  // ============================================
  createTransfer: async (command: import('../../../types/api.types').CreateWarehouseTransferCommand): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/WarehouseTransfer', command);
    return response.data.data;
  },

  getTransfers: async (params?: { fromWarehouseId?: string; toWarehouseId?: string; status?: string }): Promise<import('../../../types/api.types').WarehouseTransferDto[]> => {
    const response = await axiosClient.get<ApiResponse<import('../../../types/api.types').WarehouseTransferDto[]>>('/WarehouseTransfer', {
      params,
    });
    return response.data.data;
  },

  getTransferById: async (id: string): Promise<import('../../../types/api.types').WarehouseTransferDto> => {
    const response = await axiosClient.get<ApiResponse<import('../../../types/api.types').WarehouseTransferDto>>(`/WarehouseTransfer/${id}`);
    return response.data.data;
  },

  shipTransfer: async (id: string, command: import('../../../types/api.types').ShipWarehouseTransferCommand): Promise<boolean> => {
    const response = await axiosClient.put<ApiResponse<boolean>>(`/WarehouseTransfer/${id}/ship`, command);
    return response.data.data;
  },

  receiveTransfer: async (id: string, command: import('../../../types/api.types').ReceiveWarehouseTransferCommand): Promise<boolean> => {
    const response = await axiosClient.put<ApiResponse<boolean>>(`/WarehouseTransfer/${id}/receive`, command);
    return response.data.data;
  },

  cancelTransfer: async (id: string): Promise<boolean> => {
    const response = await axiosClient.put<ApiResponse<boolean>>(`/WarehouseTransfer/${id}/cancel`);
    return response.data.data;
  },
};
