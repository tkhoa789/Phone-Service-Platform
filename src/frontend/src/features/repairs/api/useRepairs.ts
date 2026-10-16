import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceService } from '@/services/serviceService';
import type { 
  CreateRepairTicketCommand, 
  AddRepairPartCommand, 
  CreateRepairChecklistCommand,
  SubmitDiagnosisCommand,
  ApproveRepairCommand,
  RejectRepairCommand,
  UseRepairPartCommand,
  ReturnRepairPartCommand,
  CompleteRepairCommand,
  DeliverRepairCommand
} from '@/types/api.types';

export const repairKeys = {
  all: ['repairs'] as const,
  lists: () => [...repairKeys.all, 'list'] as const,
  list: (filters: string) => [...repairKeys.lists(), { filters }] as const,
  details: () => [...repairKeys.all, 'detail'] as const,
  detail: (id: string) => [...repairKeys.details(), id] as const,
};

export const useRepairs = (params?: { pageIndex?: number; pageSize?: number; search?: string; status?: string; queue?: string; includeTest?: boolean }) => {
  return useQuery({
    queryKey: repairKeys.list(JSON.stringify(params)),
    queryFn: () => serviceService.getRepairs(params),
    refetchInterval: 8000, // Tự động kéo mới danh sách sau mỗi 8 giây (Real-time sync)
    refetchOnWindowFocus: true, // Lập tức kéo mới khi người dùng chuyển lại tab
  });
};

export const useRepairStats = (includeTest?: boolean, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...repairKeys.all, 'stats', includeTest] as const,
    queryFn: () => serviceService.getRepairStats(includeTest),
    staleTime: 2 * 1000,
    refetchInterval: 4000, // Tự động kéo mới số liệu thống kê sau mỗi 4 giây (Real-time sync)
    refetchOnWindowFocus: true, // Lập tức kéo mới khi người dùng chuyển lại tab
    ...options,
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
      queryClient.invalidateQueries({ queryKey: repairKeys.all });
    },
  });
};

export const useUpdateRepairStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note, technicianId }: { id: string; status: string; note?: string; technicianId?: string }) =>
      serviceService.updateRepairStatus(id, status, note, technicianId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all });
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(variables.id) });
    },
  });
};

export const useAssignTechnician = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, technicianId }: { id: string; technicianId: string }) =>
      serviceService.assignTechnician(id, technicianId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all });
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
      queryClient.invalidateQueries({ queryKey: repairKeys.all });
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
      queryClient.invalidateQueries({ queryKey: repairKeys.all });
    },
  });
};

export const useDeleteRepairTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => serviceService.deleteRepairTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all });
    },
  });
};

export const useStartDiagnosis = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => serviceService.startDiagnosis(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all });
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(id) });
    },
  });
};

export const useSubmitDiagnosis = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: SubmitDiagnosisCommand) => serviceService.submitDiagnosis(command),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all });
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(variables.repairTicketId) });
    },
  });
};

export const useApproveRepair = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: ApproveRepairCommand) => serviceService.approveRepair(command),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all });
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(variables.repairTicketId) });
    },
  });
};

export const useRejectRepair = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: RejectRepairCommand) => serviceService.rejectRepair(command),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all });
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(variables.repairTicketId) });
    },
  });
};

export const useUseRepairPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: UseRepairPartCommand) => serviceService.useRepairPart(command),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all });
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(variables.repairTicketId) });
    },
  });
};

export const useReturnRepairPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: ReturnRepairPartCommand) => serviceService.returnRepairPart(command),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all });
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(variables.repairTicketId) });
    },
  });
};

export const useCompleteRepair = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: CompleteRepairCommand) => serviceService.completeRepair(command),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all });
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(variables.repairTicketId) });
    },
  });
};

export const useDeliverRepair = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: DeliverRepairCommand) => serviceService.deliverRepair(command),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all });
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(variables.repairTicketId) });
    },
  });
};

