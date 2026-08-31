import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceService } from '@/services/serviceService';
import type { CreateRepairTicketCommand, AddRepairPartCommand, CreateRepairChecklistCommand } from '@/types/api.types';

export const repairKeys = {
  all: ['repairs'] as const,
  lists: () => [...repairKeys.all, 'list'] as const,
  list: (filters: string) => [...repairKeys.lists(), { filters }] as const,
  details: () => [...repairKeys.all, 'detail'] as const,
  detail: (id: string) => [...repairKeys.details(), id] as const,
};

export const useRepairs = (params?: { pageIndex?: number; pageSize?: number; search?: string; status?: string }) => {
  return useQuery({
    queryKey: repairKeys.list(JSON.stringify(params)),
    queryFn: () => serviceService.getRepairs(params),
  });
};

export const useRepairDetails = (id: string | undefined) => {
  return useQuery({
    queryKey: repairKeys.detail(id!),
    queryFn: () => serviceService.getRepairById(id!),
    enabled: !!id,
  });
};

export const useCreateRepairTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ command, idempotencyKey }: { command: CreateRepairTicketCommand; idempotencyKey: string }) =>
      serviceService.createRepairTicket(command, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairKeys.lists() });
    },
  });
};

export const useUpdateRepairStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      serviceService.updateRepairStatus(id, status, note),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.lists() });
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(variables.id) });
    },
  });
};

export const useAddRepairPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: AddRepairPartCommand) => serviceService.addRepairPart(command),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(variables.repairTicketId) });
      queryClient.invalidateQueries({ queryKey: repairKeys.lists() });
    },
  });
};

export const useCreateRepairChecklist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: CreateRepairChecklistCommand) => serviceService.createRepairChecklist(command),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(variables.repairTicketId) });
    },
  });
};

export const useCollectRepairDeposit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, command, idempotencyKey }: { id: string; command: Omit<import('@/types/api.types').CreateRepairDepositCommand, 'repairTicketId'>; idempotencyKey: string }) =>
      serviceService.collectRepairDeposit(id, command, idempotencyKey),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: repairKeys.lists() });
    },
  });
};

export const useDeleteRepairTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => serviceService.deleteRepairTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairKeys.lists() });
    },
  });
};

