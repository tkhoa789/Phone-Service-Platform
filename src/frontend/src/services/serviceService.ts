import { axiosClient } from '../utils/axiosClient';
import type {
  ApiResponse,
  RepairTicketDto,
  CreateRepairTicketCommand,
  AddRepairPartCommand,
  WarrantyTicketDto,
  CreateWarrantyTicketCommand,
  WarrantyCheckResultDto,
  CreateRepairChecklistCommand
} from '../types/api.types';

export const serviceService = {
  // Repairs
  getRepairs: async (params?: { pageIndex?: number; pageSize?: number; search?: string; status?: string }): Promise<{ items: RepairTicketDto[]; totalCount: number }> => {
    const response = await axiosClient.get<any>('/RepairTicket', { params });
    // Backend returns anonymous object: { success, message, data, pagination }
    const items = response.data?.data || response.data?.items || [];
    const totalCount = response.data?.pagination?.totalCount || items.length;
    return { items, totalCount };
  },

  getRepairById: async (id: string): Promise<RepairTicketDto> => {
    const response = await axiosClient.get<ApiResponse<RepairTicketDto>>(`/RepairTicket/${id}`);
    return response.data.data;
  },

  createRepairTicket: async (command: CreateRepairTicketCommand, idempotencyKey?: string): Promise<string> => {
    // Backend returns ApiResponse<Guid>
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined;
    const response = await axiosClient.post<ApiResponse<string>>('/RepairTicket', command, { headers });
    return response.data.data;
  },

  updateRepairStatus: async (id: string, status: string, note?: string): Promise<boolean> => {
    // Backend UpdateRepairStatusCommand requires 'repairTicketId' inside request body
    const response = await axiosClient.put<ApiResponse<boolean>>(`/RepairTicket/${id}/status`, {
      repairTicketId: id,
      status,
      note,
    });
    return response.data.data;
  },

  addRepairPart: async (command: AddRepairPartCommand): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>(`/RepairTicket/${command.repairTicketId}/parts`, command);
    return response.data.data;
  },

  deleteRepairTicket: async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<ApiResponse<boolean>>(`/RepairTicket/${id}`);
    return response.data.data;
  },

  createRepairChecklist: async (command: CreateRepairChecklistCommand): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/RepairTicket/checklist', command);
    return response.data.data;
  },

  collectRepairDeposit: async (id: string, command: Omit<import('../types/api.types').CreateRepairDepositCommand, 'repairTicketId'>, idempotencyKey?: string): Promise<string> => {
    const payload = { repairTicketId: id, ...command };
    const response = await axiosClient.post<ApiResponse<string>>(`/RepairTicket/${id}/deposit`, payload);
    return response.data.data;
  },

  // Warranties
  getWarranties: async (params?: { pageIndex?: number; pageSize?: number; search?: string }): Promise<{ items: WarrantyTicketDto[]; totalCount: number }> => {
    const response = await axiosClient.get<any>('/WarrantyTicket', { params });
    const items = response.data?.data || response.data?.items || [];
    const totalCount = response.data?.pagination?.totalCount || items.length;
    return { items, totalCount };
  },

  getWarrantyById: async (id: string): Promise<WarrantyTicketDto> => {
    const response = await axiosClient.get<ApiResponse<WarrantyTicketDto>>(`/WarrantyTicket/${id}`);
    return response.data.data;
  },

  checkWarrantyStatus: async (imei: string): Promise<WarrantyCheckResultDto> => {
    const response = await axiosClient.get<ApiResponse<WarrantyCheckResultDto>>(`/WarrantyTicket/check/${imei}`);
    return response.data.data;
  },

  createWarrantyTicket: async (command: CreateWarrantyTicketCommand): Promise<string> => {
    // Backend returns ApiResponse<Guid>
    const response = await axiosClient.post<ApiResponse<string>>('/WarrantyTicket', command);
    return response.data.data;
  },

  updateWarrantyStatus: async (id: string, status: string, action: string, description: string | null, newImei: string | null, rowVersion: string): Promise<boolean> => {
    // Backend UpdateWarrantyStatusCommand requires all these fields
    const response = await axiosClient.put<ApiResponse<boolean>>(`/WarrantyTicket/${id}/status`, {
      warrantyTicketId: id,
      status,
      action,
      description,
      newImei,
      rowVersion,
    });
    return response.data.data;
  },

  deleteWarrantyTicket: async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<ApiResponse<boolean>>(`/WarrantyTicket/${id}`);
    return response.data.data;
  },
};
