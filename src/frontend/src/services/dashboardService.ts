import { axiosClient } from '../utils/axiosClient';
import type { ApiResponse } from '../types/api.types';

export interface BranchRevenueDto {
  branchId: string;
  branchName: string;
  revenue: number;
}

export interface ManagerDashboardDto {
  totalRevenue: number;
  totalProfit: number;
  unitsSold: number;
  openRepairs: number;
  openWarranties: number;
  branchRevenue: BranchRevenueDto[];
  topProducts: {
    productVariantId: string;
    productName: string;
    sku: string;
    quantitySold: number;
    revenue: number;
  }[];
}

export const dashboardService = {
  getStats: async (branchId?: string): Promise<ManagerDashboardDto> => {
    const response = await axiosClient.get<ApiResponse<ManagerDashboardDto>>('/Dashboard', {
      params: { branchId },
    });
    return response.data.data;
  },
};
