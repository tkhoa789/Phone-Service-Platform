import { axiosClient } from '../utils/axiosClient';
import type { ApiResponse, CustomerDto, CreateCustomerCommand } from '../types/api.types';

export const customerService = {
  getAll: async (search?: string): Promise<CustomerDto[]> => {
    const response = await axiosClient.get<ApiResponse<CustomerDto[]>>('/Customer', {
      params: { search },
    });
    return response.data.data;
  },

  getById: async (id: string): Promise<CustomerDto> => {
    const response = await axiosClient.get<ApiResponse<CustomerDto>>(`/Customer/${id}`);
    return response.data.data;
  },

  create: async (command: CreateCustomerCommand): Promise<CustomerDto> => {
    const response = await axiosClient.post<ApiResponse<CustomerDto>>('/Customer', command);
    return response.data.data;
  },
};
