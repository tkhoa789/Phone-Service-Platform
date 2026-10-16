import { axiosClient } from '../utils/axiosClient';
import type { ApiResponse, AuditLogDto, PagedResult } from '../types/api.types';

export const auditLogService = {
  getAll: async (params?: { pageIndex?: number; pageSize?: number; entityName?: string; action?: string; userId?: string }): Promise<AuditLogDto[]> => {
    const response = await axiosClient.get<ApiResponse<PagedResult<AuditLogDto> | AuditLogDto[]>>('/AuditLog', {
      params: {
        pageIndex: params?.pageIndex ?? 1,
        pageSize: params?.pageSize ?? 100,
        entityName: params?.entityName,
        action: params?.action,
        userId: params?.userId,
      }
    });
    const data = response.data?.data;
    if (Array.isArray(data)) return data;
    if (data?.items && Array.isArray(data.items)) return data.items;
    return [];
  },
};
