import { axiosClient } from '../../../utils/axiosClient';
import type { ApiResponse, PagedResult } from '../../../types/api.types';
import type {
  CustomerDto,
  CreateCustomerCommand,
  CustomerListFilterParams
} from '../types/customer.types';

export const customerApi = {
  getCustomers: async (params: CustomerListFilterParams): Promise<PagedResult<CustomerDto>> => {
    const response = await axiosClient.get<ApiResponse<PagedResult<CustomerDto>>>('/Customer', { 
      params: { 
        keyword: params.keyword,
        page: params.page,
        pageSize: params.pageSize
      } 
    });
    return response.data.data;
  },

  getCustomerById: async (id: string): Promise<CustomerDto> => {
    const response = await axiosClient.get<ApiResponse<CustomerDto>>(`/Customer/${id}`);
    return response.data.data;
  },

  getCustomerByPhone: async (phone: string): Promise<CustomerDto> => {
    const response = await axiosClient.get<ApiResponse<CustomerDto>>(`/Customer/phone/${phone}`);
    return response.data.data;
  },

  createCustomer: async (command: CreateCustomerCommand): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/Customer', command);
    return response.data.data;
  },

  updateCustomer: async (params: { id: string; command: CreateCustomerCommand }): Promise<boolean> => {
    const response = await axiosClient.put<ApiResponse<boolean>>(`/Customer/${params.id}`, {
      id: params.id,
      ...params.command,
    });
    return response.data.data;
  },

  deleteCustomer: async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<ApiResponse<boolean>>(`/Customer/${id}`);
    return response.data.data;
  },
};
