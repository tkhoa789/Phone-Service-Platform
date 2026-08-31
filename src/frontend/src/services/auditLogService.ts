import { axiosClient } from '../utils/axiosClient';
import type { ApiResponse, AuditLogDto } from '../types/api.types';

export const auditLogService = {
  getAll: async (params?: { entityName?: string; performedBy?: string }): Promise<AuditLogDto[]> => {
    const response = await axiosClient.get<ApiResponse<any>>('/AuditLog', { params });
    const data = response.data?.data;
    if (Array.isArray(data)) return data;
    if (data?.items && Array.isArray(data.items)) return data.items;
    return [];
  },

  getById: async (id: string): Promise<AuditLogDto> => {
    const response = await axiosClient.get<ApiResponse<AuditLogDto>>(`/AuditLog/${id}`);
    return response.data.data;
  },
};
