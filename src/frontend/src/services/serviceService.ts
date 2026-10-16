import { axiosClient } from '../utils/axiosClient';
import { generateUUID } from '../utils/uuid';
import type {
  ApiResponse,
  RepairTicketDto,
  CreateRepairTicketCommand,
  AddRepairPartCommand,
  WarrantyTicketDto,
  CreateWarrantyTicketCommand,
  WarrantyCheckResultDto,
  CreateRepairChecklistCommand,
  SubmitDiagnosisCommand,
  ApproveRepairCommand,
  RejectRepairCommand,
  UseRepairPartCommand,
  ReturnRepairPartCommand,
  CompleteRepairCommand,
  DeliverRepairCommand,
  RepairQueueStatsDto,
  RejectWarrantyCommand,
  TransferToInHouseRepairCommand,
  ReplaceDeviceCommand,
  SendToVendorCommand,
  DeliverToCustomerCommand
} from '../types/api.types';

interface AnonymousPagedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  items?: T[];
  pagination?: {
    totalCount: number;
    pageIndex: number;
    pageSize: number;
    totalPages: number;
  };
  stats?: RepairQueueStatsDto;
}

export const serviceService = {
  // Repairs
  getRepairs: async (params?: { pageIndex?: number; pageSize?: number; search?: string; code?: string; status?: string; queue?: string; includeTest?: boolean }): Promise<{ items: RepairTicketDto[]; totalCount: number; stats?: RepairQueueStatsDto }> => {
    const code = params?.code || params?.search;
    const response = await axiosClient.get<AnonymousPagedResponse<RepairTicketDto>>('/RepairTicket', {
      params: {
        pageIndex: params?.pageIndex,
        pageSize: params?.pageSize,
        code,
        search: params?.search,
        status: params?.status,
        queue: params?.queue,
        includeTest: params?.includeTest,
      }
    });
    // Backend returns anonymous object: { success, message, data, pagination, stats }
    const items = response.data?.data || response.data?.items || [];
    const totalCount = response.data?.pagination?.totalCount || items.length;
    return { items, totalCount, stats: response.data?.stats };
  },

  getRepairStats: async (includeTest?: boolean): Promise<RepairQueueStatsDto> => {
    const response = await axiosClient.get<ApiResponse<RepairQueueStatsDto>>('/RepairTicket/stats', {
      params: { includeTest }
    });
    return response.data.data;
  },

  getRepairById: async (id: string): Promise<RepairTicketDto> => {
    const response = await axiosClient.get<ApiResponse<RepairTicketDto>>(`/RepairTicket/${id}`);
    return response.data.data;
  },

  createRepairTicket: async (command: CreateRepairTicketCommand, idempotencyKey?: string): Promise<string> => {
    // Backend returns ApiResponse<Guid>
    const headers = { 'Idempotency-Key': idempotencyKey || generateUUID() };
    const response = await axiosClient.post<ApiResponse<string>>('/RepairTicket', command, { headers });
    return response.data.data;
  },

  updateRepairStatus: async (id: string, status: string, note?: string, technicianId?: string, idempotencyKey?: string): Promise<boolean> => {
    // Backend UpdateRepairStatusCommand requires 'repairTicketId' inside request body
    const headers = { 'Idempotency-Key': idempotencyKey || generateUUID() };
    const response = await axiosClient.put<ApiResponse<boolean>>(`/RepairTicket/${id}/status`, {
      repairTicketId: id,
      status,
      note,
      technicianId,
    }, { headers });
    return response.data.data;
  },

  assignTechnician: async (id: string, technicianId: string, idempotencyKey?: string): Promise<boolean> => {
    const headers = { 'Idempotency-Key': idempotencyKey || generateUUID() };
    const response = await axiosClient.post<ApiResponse<boolean>>(`/RepairTicket/${id}/assign-technician`, {
      repairTicketId: id,
      technicianId,
    }, { headers });
    return response.data.data;
  },

  addRepairPart: async (command: AddRepairPartCommand & { issueImmediately?: boolean }, idempotencyKey?: string): Promise<string> => {
    const headers = { 'Idempotency-Key': idempotencyKey || generateUUID() };
    const payload = { ...command, issueImmediately: command.issueImmediately ?? true };
    const response = await axiosClient.post<ApiResponse<string>>(`/RepairTicket/${command.repairTicketId}/parts`, payload, { headers });
    return response.data.data;
  },

  startDiagnosis: async (id: string): Promise<boolean> => {
    const response = await axiosClient.post<ApiResponse<boolean>>(`/RepairTicket/${id}/start-diagnosis`);
    return response.data.data;
  },

  submitDiagnosis: async (command: SubmitDiagnosisCommand): Promise<boolean> => {
    const response = await axiosClient.post<ApiResponse<boolean>>(`/RepairTicket/${command.repairTicketId}/submit-diagnosis`, command);
    return response.data.data;
  },

  approveRepair: async (command: ApproveRepairCommand): Promise<boolean> => {
    const response = await axiosClient.post<ApiResponse<boolean>>(`/RepairTicket/${command.repairTicketId}/approve`, command);
    return response.data.data;
  },

  rejectRepair: async (command: RejectRepairCommand): Promise<boolean> => {
    const response = await axiosClient.post<ApiResponse<boolean>>(`/RepairTicket/${command.repairTicketId}/reject`, command);
    return response.data.data;
  },

  useRepairPart: async (command: UseRepairPartCommand): Promise<boolean> => {
    const response = await axiosClient.post<ApiResponse<boolean>>(`/RepairTicket/${command.repairTicketId}/parts/${command.repairPartId}/use`, command);
    return response.data.data;
  },

  returnRepairPart: async (command: ReturnRepairPartCommand): Promise<boolean> => {
    const response = await axiosClient.post<ApiResponse<boolean>>(`/RepairTicket/${command.repairTicketId}/part/${command.repairPartId}/return`, command);
    return response.data.data;
  },

  completeRepair: async (command: CompleteRepairCommand): Promise<boolean> => {
    const response = await axiosClient.post<ApiResponse<boolean>>(`/RepairTicket/${command.repairTicketId}/complete`, command);
    return response.data.data;
  },

  deliverRepair: async (command: DeliverRepairCommand): Promise<boolean> => {
    const response = await axiosClient.post<ApiResponse<boolean>>(`/RepairTicket/${command.repairTicketId}/deliver`, command);
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
    const key = idempotencyKey || (command as { idempotencyKey?: string })?.idempotencyKey;
    const headers = key ? { 'Idempotency-Key': key } : undefined;
    const response = await axiosClient.post<ApiResponse<string>>(`/RepairTicket/${id}/deposits`, payload, { headers });
    return response.data.data;
  },

  // Warranties
  getWarranties: async (params?: { pageIndex?: number; pageSize?: number; search?: string }): Promise<{ items: WarrantyTicketDto[]; totalCount: number }> => {
    const response = await axiosClient.get<AnonymousPagedResponse<WarrantyTicketDto>>('/WarrantyTicket', { params });
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

  deleteWarrantyTicket: async (id: string, rowVersion?: string): Promise<boolean> => {
    const config = rowVersion ? { data: { id, rowVersion } } : undefined;
    const response = await axiosClient.delete<ApiResponse<boolean>>(`/WarrantyTicket/${id}`, config);
    return response.data.data;
  },

  rejectWarranty: async (command: RejectWarrantyCommand): Promise<boolean> => {
    const response = await axiosClient.post<ApiResponse<boolean>>(`/WarrantyTicket/${command.warrantyTicketId}/reject`, command);
    return response.data.data;
  },

  transferToInHouseRepair: async (command: TransferToInHouseRepairCommand): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>(`/WarrantyTicket/${command.warrantyTicketId}/transfer-repair`, command);
    return response.data.data;
  },

  replaceWarrantyDevice: async (command: ReplaceDeviceCommand): Promise<boolean> => {
    const response = await axiosClient.post<ApiResponse<boolean>>(`/WarrantyTicket/${command.warrantyTicketId}/replace-device`, command);
    return response.data.data;
  },

  sendWarrantyToVendor: async (command: SendToVendorCommand): Promise<boolean> => {
    const response = await axiosClient.post<ApiResponse<boolean>>(`/WarrantyTicket/${command.warrantyTicketId}/send-vendor`, command);
    return response.data.data;
  },

  deliverWarrantyToCustomer: async (command: DeliverToCustomerCommand): Promise<boolean> => {
    const response = await axiosClient.post<ApiResponse<boolean>>(`/WarrantyTicket/${command.warrantyTicketId}/deliver`, command);
    return response.data.data;
  },
};
