import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, type CreateUserCommand, type UpdateUserCommand } from '../../../services/userService';
import type { UserDto } from '../../../types/api.types';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (branchId?: string) => [...userKeys.lists(), { branchId }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export const useUsers = (branchId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: userKeys.list(branchId),
    queryFn: () => userService.getAll(branchId),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getById(id),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: CreateUserCommand) => userService.create(command),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, command }: { id: string; command: Partial<Omit<UpdateUserCommand, 'id'>> }) => 
      userService.update(id, command),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};
