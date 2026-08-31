import { axiosClient } from '../utils/axiosClient';
import type { ApiResponse, VoucherDto } from '../types/api.types';

export interface CreateVoucherCommand {
  code: string;
  discountAmount: number;
  minOrderValue: number;
  usageLimit: number;
  expiryDate: string;
}

export interface UpdateVoucherCommand {
  id: string;
  discountAmount: number;
  minOrderValue: number;
  usageLimit: number;
  expiryDate: string;
  status: 'Active' | 'Used' | 'Expired' | 'Cancelled';
}

export const voucherService = {
  getAll: async (): Promise<VoucherDto[]> => {
    const response = await axiosClient.get<ApiResponse<VoucherDto[]>>('/Voucher');
    return response.data.data;
  },

  getById: async (id: string): Promise<VoucherDto> => {
    const response = await axiosClient.get<ApiResponse<VoucherDto>>(`/Voucher/${id}`);
    return response.data.data;
  },

  getByCode: async (code: string): Promise<VoucherDto> => {
    const response = await axiosClient.get<ApiResponse<VoucherDto>>(`/Voucher/code/${code}`);
    return response.data.data;
  },

  create: async (command: CreateVoucherCommand): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/Voucher', command);
    return response.data.data;
  },

  update: async (id: string, command: UpdateVoucherCommand): Promise<boolean> => {
    const response = await axiosClient.put<ApiResponse<boolean>>(`/Voucher/${id}`, command);
    return response.data.data;
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<ApiResponse<boolean>>(`/Voucher/${id}`);
    return response.data.data;
  },

  validate: async (code: string, orderValue: number = 0): Promise<VoucherDto> => {
    const response = await axiosClient.get<ApiResponse<VoucherDto>>('/Voucher/validate', {
      params: { code, orderValue },
    });
    return response.data.data;
  },
};
