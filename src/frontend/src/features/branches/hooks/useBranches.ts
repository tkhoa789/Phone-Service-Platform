import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchService } from '../../../services/branchService';
import type { BranchDto, CreateBranchCommand } from '../../../types/api.types';
import toast from 'react-hot-toast';

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

export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBranchCommand) => branchService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateBranchCommand }) => branchService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => branchService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
    },
    onError: () => {
      toast.error('Không thể xóa chi nhánh đang hoạt động!');
    }
  });
}
