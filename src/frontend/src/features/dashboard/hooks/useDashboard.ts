import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../../services/dashboardService';
import { supplierApi } from '../../suppliers/api/supplier.api';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (branchId?: string) => [...dashboardKeys.all, 'stats', branchId || 'all'] as const,
  supplierDebt: () => [...dashboardKeys.all, 'supplierDebt'] as const,
};

export function useDashboardStats(branchId?: string, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.stats(branchId),
    queryFn: () => dashboardService.getStats(branchId && branchId !== 'all' ? branchId : undefined),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardSupplierDebt(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.supplierDebt(),
    queryFn: async () => {
      const suppliers = await supplierApi.getSuppliers();
      const totalDebt = suppliers.reduce((sum, s) => sum + (s.debtAmount || 0), 0);
      return {
        totalDebt,
        supplierCount: suppliers.length,
        indebtedSuppliersCount: suppliers.filter((s) => (s.debtAmount || 0) > 0).length,
      };
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
