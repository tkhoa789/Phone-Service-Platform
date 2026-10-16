import { axiosClient } from '../utils/axiosClient';
import type { ApiResponse, UserDto } from '../types/api.types';

export interface CreateUserCommand {
  branchId?: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  roleIds?: string[];
  role?: string;
}

export interface UpdateUserCommand {
  id: string;
  branchId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  status?: 'Active' | 'Inactive' | 'Locked';
  roleIds?: string[];
  role?: string;
}

export const userService = {
  getAll: async (branchId?: string): Promise<UserDto[]> => {
    const validBranchId = branchId && branchId !== 'all' ? branchId : undefined;
    const response = await axiosClient.get<ApiResponse<UserDto[]>>('/User', {
      params: validBranchId ? { branchId: validBranchId } : undefined,
    });
    return response.data.data;
  },

  getById: async (id: string): Promise<UserDto> => {
    const response = await axiosClient.get<ApiResponse<UserDto>>(`/User/${id}`);
    return response.data.data;
  },

  create: async (command: CreateUserCommand): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/User', command);
    return response.data.data;
  },

  update: async (id: string, command: Partial<Omit<UpdateUserCommand, 'id'>>): Promise<boolean> => {
    const response = await axiosClient.put<ApiResponse<boolean>>(`/User/${id}`, {
      id,
      ...command,
    });
    return response.data.data;
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<ApiResponse<boolean>>(`/User/${id}`);
    return response.data.data;
  },
};
