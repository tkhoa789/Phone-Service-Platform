import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../../services/dashboardService';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardService.getStats(),
    staleTime: 5 * 60 * 1000,
  });
}
