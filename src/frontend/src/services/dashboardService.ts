import { axiosClient } from '../utils/axiosClient';
import type { ApiResponse } from '../types/api.types';

export interface BranchRevenueDto {
  branchId: string;
  branchName: string;
  revenue: number;
}

export interface DailyRevenueDto {
  date: string;
  revenue: number;
}

export interface DeadStockDto {
  productVariantId: string;
  productName: string;
  sku: string;
  quantity: number;
  lastSoldDate: string | null;
  warehouseName: string;
  daysSinceLastSale: number;
}

export interface ManagerDashboardDto {
  totalRevenue: number;
  totalProfit?: number | null;
  unitsSold: number;
  openRepairs: number;
  openWarranties: number;
  branchRevenue: BranchRevenueDto[];
  thirtyDaysRevenue?: DailyRevenueDto[];
  topProducts: {
    productVariantId: string;
    productName: string;
    sku: string;
    quantitySold: number;
    revenue: number;
  }[];
  deadStock?: DeadStockDto[];
}

export const dashboardService = {
  getStats: async (branchId?: string): Promise<ManagerDashboardDto> => {
    const response = await axiosClient.get<ApiResponse<ManagerDashboardDto>>('/Dashboard', {
      params: { branchId },
    });
    return response.data.data;
  },
};
