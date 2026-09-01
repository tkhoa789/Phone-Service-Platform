import { useMutation, useQueryClient } from '@tanstack/react-query';
import { branchService } from '../../../services/branchService';
import type { BranchDto, CreateBranchCommand } from '../../../types/api.types';
import toast from 'react-hot-toast';

export { branchKeys, useBranches } from '../../../entities/branch/queries';
import { branchKeys } from '../../../entities/branch/queries';

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
      toast.error('KhÃ´ng thá»ƒ xÃ³a chi nhÃ¡nh Ä‘ang hoáº¡t Ä‘á»™ng!');
    }
  });
}
