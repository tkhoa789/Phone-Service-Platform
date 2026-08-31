import { axiosClient } from '../utils/axiosClient';
import type { ApiResponse, BranchDto, CreateBranchCommand } from '../types/api.types';

export const branchService = {
  getAll: async (): Promise<BranchDto[]> => {
    const response = await axiosClient.get<ApiResponse<BranchDto[]>>('/Branch');
    return response.data.data;
  },

  getById: async (id: string): Promise<BranchDto> => {
    const response = await axiosClient.get<ApiResponse<BranchDto>>(`/Branch/${id}`);
    return response.data.data;
  },

  create: async (command: CreateBranchCommand): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/Branch', command);
    return response.data.data;
  },

  update: async (id: string, command: CreateBranchCommand): Promise<boolean> => {
    // Backend UpdateBranchCommand requires 'id' inside request body
    const response = await axiosClient.put<ApiResponse<boolean>>(`/Branch/${id}`, {
      id,
      ...command,
    });
    return response.data.data;
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<ApiResponse<boolean>>(`/Branch/${id}`);
    return response.data.data;
  },
};
