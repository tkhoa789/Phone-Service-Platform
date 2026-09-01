import { useQuery } from '@tanstack/react-query';
import { branchService } from '../../services/branchService';

export const branchKeys = {
  all: ['branches'] as const,
  lists: () => [...branchKeys.all, 'list'] as const,
  list: (filters: string) => [...branchKeys.lists(), { filters }] as const,
  details: () => [...branchKeys.all, 'detail'] as const,
  detail: (id: string) => [...branchKeys.details(), id] as const,
};

export function useBranches() {
  return useQuery({
    queryKey: branchKeys.lists(),
    queryFn: () => branchService.getAll(),
  });
}
