import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/shared/PageHeader';
import { SearchInput } from '../../../components/shared/SearchInput';
import { DataTable } from '../../../components/shared/DataTable';
import { AppPagination } from '../../../components/shared/AppPagination';
import { Badge } from '../../../components/ui/Badge';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { useThemeStore } from '@/stores/themeStore';
import { useBranchStore } from '@/stores/branchStore';
import { useAuthStore } from '@/stores/authStore';
import { 
  useRepairs, 
  useRepairStats,
  useUpdateRepairStatus, 
  useAssignTechnician,
  useApproveRepair,
  useRejectRepair
} from '../api/useRepairs';
import { useUsers } from '@/features/users/hooks/useUsers';
import { getRepairStatusColor, getRepairStatusLabel, getValidTransitions, ALL_REPAIR_STATUSES, STATUS_TRANSITION_RULES } from '../utils/statusUtils';
import type { RepairTicketDto, RepairTicketStatus, UserDto } from '@/types/api.types';
import toast from 'react-hot-toast';
import { 
  Wrench, Printer, ShieldCheck, Plus, CheckCircle2, Filter, 
  UserPlus, UserCheck, Eye, HelpCircle, ChevronDown, ArrowRight, 
  Sparkles, X, Ban, Lock, XCircle, ShieldAlert, Zap, User, Clock, 
  ClipboardList, RotateCcw, ThumbsUp, ThumbsDown, LogOut 
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { operationalNotificationService } from '@/services/operationalNotificationService';

import { RepairK80ReceiptModal } from '../components/RepairK80ReceiptModal';
import { AppleCareProgressModal } from '../components/AppleCareProgressModal';
import { RepairChecklistModal } from '../components/RepairChecklistModal';
import { AddRepairPartModal } from '../components/AddRepairPartModal';
import { RepairDetailModal } from '../components/RepairDetailModal';
import { SubmitDiagnosisModal } from '../components/SubmitDiagnosisModal';
import { DeliverRepairModal } from '../components/DeliverRepairModal';
import { repairSandboxService } from '../services/repairSandboxService';
import { useTechnicianRepairsTour } from '../hooks/useTechnicianRepairsTour';
import { useManagerRepairsTour } from '../hooks/useManagerRepairsTour';
import { exitSandboxMode } from '../../../utils/sandboxUtils';

const STATUS_FILTERS: Array<{ id: string; labelVi: string; labelEn: string }> = [
  { id: 'ALL', labelVi: 'Tất cả trạng thái', labelEn: 'All Statuses' },
  { id: 'PendingAssignment', labelVi: '⚠️ Chờ Phân Công', labelEn: '⚠️ Pending Assignment' },
  { id: 'Received', labelVi: 'Tiếp Nhận', labelEn: 'Received' },
  { id: 'Diagnosing', labelVi: 'Đang Chẩn Đoán', labelEn: 'Diagnosing' },
  { id: 'WaitingApproval', labelVi: 'Chờ KH Duyệt Giá', labelEn: 'Waiting Approval' },
  { id: 'WaitingForParts', labelVi: 'Chờ Linh Kiện', labelEn: 'Waiting Parts' },
  { id: 'Repairing', labelVi: 'Đang Sửa Chữa', labelEn: 'Repairing' },
  { id: 'WaitingQC', labelVi: 'Chờ Kiểm Định QC', labelEn: 'Waiting QC' },
  { id: 'Completed', labelVi: 'Đã Hoàn Thành', labelEn: 'Completed' },
  { id: 'WaitingPickup', labelVi: 'Chờ Khách Lấy Máy', labelEn: 'Waiting Pickup' },
  { id: 'Delivered', labelVi: 'Đã Bàn Giao Máy', labelEn: 'Delivered' },
  { id: 'Cancelled', labelVi: 'Đã Hủy Phiếu', labelEn: 'Cancelled' },
];

export const RepairListPage: React.FC = () => {
  const { language } = useThemeStore();
  const isVi = language === 'vi';
  const navigate = useNavigate();
  const { activeBranchId } = useBranchStore();
  const { user, hasRole, roles } = useAuthStore();
  const isManagerOrAdmin = hasRole('Manager') || hasRole('Admin') || hasRole('Owner') || roles.includes('Manager') || roles.includes('Admin') || roles.includes('Owner');
  const isTechnician = hasRole('Technician') || roles.includes('Technician');
  const isSales = hasRole('Sales') || roles.includes('Sales');

  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || searchParams.get('search') || '';
  const initialStatus = searchParams.get('status') || 'ALL';
  const initialTab = (searchParams.get('tab') as any) || 'ALL';
  const ticketIdParam = searchParams.get('ticketId');

  const isSandboxMode = searchParams.get('mode') === 'training';
  const [sandboxTick, setSandboxTick] = useState(0);

  const { startTour: startTechnicianTour } = useTechnicianRepairsTour();
  const { startTour: startManagerRepairsTour } = useManagerRepairsTour();
  const startRepairsTour = isManagerOrAdmin ? startManagerRepairsTour : startTechnicianTour;

  useEffect(() => {
    const handleSandboxUpdate = () => setSandboxTick(t => t + 1);
    window.addEventListener('psp_sandbox_repairs_updated', handleSandboxUpdate);
    return () => window.removeEventListener('psp_sandbox_repairs_updated', handleSandboxUpdate);
  }, []);

  useEffect(() => {
    if (searchParams.get('tour') === 'auto') {
      const timer = setTimeout(() => {
        startRepairsTour();
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('tour');
        setSearchParams(newParams, { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams, startRepairsTour]);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(initialCode);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [workQueueTab, setWorkQueueTab] = useState<'ALL' | 'UNASSIGNED' | 'MY_TICKETS' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED'>(initialTab);
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
  const [selectedGuideStatus, setSelectedGuideStatus] = useState<string>('Received');
  
  const { data: realData, isLoading: isRealLoading, refetch: realRefetch } = useRepairs({ 
    pageIndex: page, 
    pageSize: 10, 
    search: search.trim() || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    queue: workQueueTab === 'ALL' ? undefined : workQueueTab,
  });

  const { data: realQueueStats, refetch: realRefetchStats } = useRepairStats();

  const sandboxRepairs = useMemo(() => {
    if (!isSandboxMode) return [];
    return repairSandboxService.getRepairs({
      search: search.trim() || undefined,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      queue: workQueueTab === 'ALL' ? undefined : workQueueTab,
      technicianId: user?.id,
    });
  }, [isSandboxMode, search, statusFilter, workQueueTab, user?.id, sandboxTick]);

  const sandboxStats = useMemo(() => {
    if (!isSandboxMode) return null;
    return repairSandboxService.getRepairStats(user?.id);
  }, [isSandboxMode, user?.id, sandboxTick]);

  const data = useMemo(() => {
    if (isSandboxMode) {
      return {
        items: sandboxRepairs,
        totalCount: sandboxRepairs.length,
        pageIndex: page,
        pageSize: 10,
        totalPages: 1,
        stats: sandboxStats,
      };
    }
    return realData;
  }, [isSandboxMode, sandboxRepairs, sandboxStats, page, realData]);

  const queueStats = isSandboxMode ? sandboxStats : realQueueStats;
  const isLoading = isSandboxMode ? false : isRealLoading;
  const refetch = isSandboxMode ? () => setSandboxTick(t => t + 1) : realRefetch;
  const refetchStats = isSandboxMode ? () => setSandboxTick(t => t + 1) : realRefetchStats;

  // Chỉ nạp danh sách user khi là Quản lý/Admin để tránh 403 Forbidden cho Kỹ thuật viên
  const effectiveBranchId = (activeBranchId && activeBranchId !== 'all') ? activeBranchId : user?.branchId;
  const { data: users = [] } = useUsers(effectiveBranchId, isManagerOrAdmin);
  const branchTechnicians = users.filter((u: UserDto) => {
    if (u.status !== 'Active') return false;
    const hasTechRole = u.roles?.some(r => r.toLowerCase().includes('tech') || r.toLowerCase().includes('technician'));
    return hasTechRole || u.roles?.length === 0;
  });

  // Helper chuẩn hóa kiểm tra KTV: kiểm tra Guid rỗng và so sánh không phân biệt hoa thường
  const isTechnicianAssigned = (techId?: string | null) => {
    if (!techId) return false;
    if (techId === '00000000-0000-0000-0000-000000000000') return false;
    return true;
  };

  const isMyTicket = (techId?: string | null) => {
    if (!user?.id || !techId) return false;
    if (techId === '00000000-0000-0000-0000-000000000000') return false;
    return techId.toLowerCase() === user.id.toLowerCase();
  };

  const isTicketUnassigned = (ticket: RepairTicketDto) => {
    return (!isTechnicianAssigned(ticket.technicianId) || ticket.status === 'PendingAssignment') &&
      !['Completed', 'Delivered', 'Cancelled'].includes(ticket.status);
  };

  // Thống kê chính xác 100% hàng chờ công việc từ Database (không phụ thuộc vào phân trang 10 items)
  const stats = useMemo(() => {
    const s = queueStats || data?.stats;
    return {
      unassigned: s?.unassignedCount ?? 0,
      myTasks: s?.myTasksCount ?? 0,
      inProgress: s?.inProgressCount ?? 0,
      completed: s?.completedCount ?? 0,
      delivered: s?.deliveredCount ?? 0,
      total: s?.totalCount ?? (data?.totalCount || 0)
    };
  }, [queueStats, data?.stats, data?.totalCount]);

  const handleTabChange = (newTab: 'ALL' | 'UNASSIGNED' | 'MY_TICKETS' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED') => {
    setWorkQueueTab(newTab);
    if (newTab !== 'ALL') {
      setStatusFilter('ALL');
    }
    setPage(1);
  };

  // Danh sách hiển thị đã được server lọc theo Queue và sắp xếp ưu tiên theo trạng thái / thời gian
  const displayedTickets = data?.items || [];

  const updateStatus = useUpdateRepairStatus();
  const assignTechnician = useAssignTechnician();

  const [selectedDetail, setSelectedDetail] = useState<RepairTicketDto | null>(null);
  const [selectedPrint, setSelectedPrint] = useState<RepairTicketDto | null>(null);
  const [selectedTracker, setSelectedTracker] = useState<RepairTicketDto | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<RepairTicketDto | null>(null);
  const [selectedPart, setSelectedPart] = useState<RepairTicketDto | null>(null);
  const [selectedAssignTech, setSelectedAssignTech] = useState<RepairTicketDto | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [selectedDiagnosisTicket, setSelectedDiagnosisTicket] = useState<RepairTicketDto | null>(null);
  const [selectedDeliverTicket, setSelectedDeliverTicket] = useState<RepairTicketDto | null>(null);

  const approveRepair = useApproveRepair();
  const rejectRepair = useRejectRepair();

  // Tự động mở chi tiết phiếu nếu có ticketId hoặc code trên URL (hỗ trợ cả khi phiếu ở trang 2+)
  useEffect(() => {
    if (ticketIdParam) {
      if (data?.items) {
        const target = data.items.find(t => t.id === ticketIdParam || t.ticketCode === ticketIdParam);
        if (target) {
          if (!selectedDetail || selectedDetail.id !== target.id) {
            setSelectedDetail(target);
          }
          return;
        }
      }
      // Fallback nếu ticket không nằm ở trang hiện tại (trang 2+, bộ lọc khác...)
      if (!selectedDetail || selectedDetail.id !== ticketIdParam) {
        setSelectedDetail({ id: ticketIdParam } as any);
      }
    } else if (initialCode && data?.items) {
      const target = data.items.find(t => t.ticketCode?.toLowerCase() === initialCode.toLowerCase());
      if (target && (!selectedDetail || selectedDetail.id !== target.id)) {
        setSelectedDetail(target);
      }
    }
  }, [ticketIdParam, initialCode, data?.items]);

  const handleApproveRepair = (ticket: RepairTicketDto) => {
    if (isSandboxMode) {
      repairSandboxService.updateStatus(ticket.id, 'Repairing', 'Khách hàng phê duyệt báo giá sửa chữa trong chế độ Sandbox.');
      toast.success(isVi ? '[SANDBOX] Khách đã phê duyệt sửa chữa! Phiếu chuyển sang Đang sửa chữa.' : '[SANDBOX] Repair approved!');
      return;
    }
    const cost = ticket.totalAmount || ticket.totalCost || ticket.estimatedCost || 0;
    approveRepair.mutate(
      {
        repairTicketId: ticket.id,
        approvedAmount: cost,
        approvalMethod: 'Khách xác nhận qua điện thoại / trực tiếp',
        note: 'Kỹ thuật viên xác nhận khách hàng đồng ý sửa chữa.',
      },
      {
        onSuccess: () => {
          toast.success(isVi ? 'Khách đã phê duyệt sửa chữa! Phiếu chuyển sang Đang sửa chữa.' : 'Repair approved!');
          operationalNotificationService.dispatchNotification({
            title: `⚡ Khách hàng ĐÃ DUYỆT báo giá: ${ticket.ticketCode || (ticket as any).code}`,
            content: `Khách hàng ${ticket.customerName || ''} đã đồng ý báo giá sửa chữa (${cost.toLocaleString('vi-VN')}₫). KTV tiến hành sửa chữa ngay!`,
            type: 'REPAIR_APPROVED',
            targetRoles: ['Technician'],
            branchId: (ticket as any).branchId || user?.branchId,
            link: '/repairs?tab=MY_TICKETS',
          });
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || (isVi ? 'Không thể duyệt đơn' : 'Failed to approve'));
        },
      }
    );
  };

  const handleRejectRepair = (ticket: RepairTicketDto) => {
    if (!window.confirm(isVi ? `Xác nhận hủy phiếu ${ticket.ticketCode} do khách từ chối sửa chữa?` : 'Cancel ticket due to customer rejection?')) return;
    if (isSandboxMode) {
      repairSandboxService.updateStatus(ticket.id, 'Cancelled', 'Khách hàng từ chối sửa chữa trong chế độ Sandbox.');
      toast.success(isVi ? '[SANDBOX] Đã ghi nhận hủy phiếu theo phản hồi của khách.' : '[SANDBOX] Ticket cancelled.');
      return;
    }
    rejectRepair.mutate(
      {
        repairTicketId: ticket.id,
        reason: 'Khách hàng từ chối phương án sửa chữa',
      },
      {
        onSuccess: () => {
          toast.success(isVi ? 'Đã ghi nhận hủy phiếu theo phản hồi của khách.' : 'Ticket cancelled.');
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || (isVi ? 'Không thể hủy' : 'Failed to reject'));
        },
      }
    );
  };

  const handleStatusChange = (ticket: RepairTicketDto, newStatus: RepairTicketStatus) => {
    if (isSandboxMode) {
      repairSandboxService.updateStatus(ticket.id, newStatus);
      toast.success(isVi ? `[SANDBOX] Đã chuyển trạng thái: ${getRepairStatusLabel(newStatus, language)}` : `[SANDBOX] Status updated: ${getRepairStatusLabel(newStatus, language)}`);
      return;
    }
    updateStatus.mutate(
      { id: ticket.id, status: newStatus, technicianId: ticket.technicianId },
      {
        onSuccess: () => {
          toast.success(isVi ? `Đã chuyển trạng thái: ${getRepairStatusLabel(newStatus, language)}` : 'Status updated');
          if (newStatus === 'Completed' || newStatus === 'WaitingPickup') {
            operationalNotificationService.dispatchNotification({
              title: `🔔 Ca sửa chữa đã hoàn thành: ${ticket.ticketCode || (ticket as any).code}`,
              content: `Phiếu sửa chữa ${ticket.ticketCode || (ticket as any).code} (${ticket.customerName || 'Khách hàng'}, ${ticket.productName || ticket.deviceModel || 'Thiết bị'}) đã hoàn tất kiểm định. Sales/Thu ngân liên hệ khách nhận máy và thu tiền.`,
              type: 'REPAIR_COMPLETED',
              targetRoles: ['Sales', 'Manager'],
              branchId: (ticket as any).branchId || user?.branchId,
              link: '/repairs?status=Completed',
            });
          }
          refetch();
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || (isVi ? 'Không thể cập nhật trạng thái' : 'Failed to update status');
          toast.error(msg);
        }
      }
    );
  };

  const handleQuickSelfAssign = (ticket: RepairTicketDto) => {
    if (!user) return;
    if (isSandboxMode) {
      repairSandboxService.claimTicket(ticket.id, user.id, user.fullName || user.username);
      const code = ticket.ticketCode || (ticket as any).code || '';
      toast.success(
        isVi 
          ? `[SANDBOX] Đã nhận đơn ${code}! Đã tự động chuyển sang tab "Đơn Của Tôi".` 
          : `[SANDBOX] Assigned ticket ${code}! Switched to My Tickets.`
      );
      setWorkQueueTab('MY_TICKETS');
      return;
    }
    assignTechnician.mutate(
      { id: ticket.id, technicianId: user.id },
      {
        onSuccess: () => {
          const code = ticket.ticketCode || (ticket as any).code || '';
          toast.success(
            isVi 
              ? `Đã nhận đơn ${code}! Đã tự động chuyển sang tab "Đơn Của Tôi".` 
              : `Assigned ticket ${code}! Switched to My Tickets.`
          );
          setWorkQueueTab('MY_TICKETS');
          refetch();
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || (isVi ? 'Không thể nhận việc' : 'Failed to assign');
          toast.error(msg);
        }
      }
    );
  };

  const handleSaveAssignTechnician = () => {
    if (!selectedAssignTech || !selectedTechId) return;
    if (isSandboxMode) {
      const techUser = users.find(u => u.id === selectedTechId);
      repairSandboxService.claimTicket(selectedAssignTech.id, selectedTechId, techUser?.fullName || 'KTV Phân công');
      toast.success(isVi ? '[SANDBOX] Đã phân công kỹ thuật viên thành công!' : '[SANDBOX] Technician assigned successfully!');
      setSelectedAssignTech(null);
      return;
    }
    assignTechnician.mutate(
      {
        id: selectedAssignTech.id,
        technicianId: selectedTechId,
      },
      {
        onSuccess: () => {
          toast.success(isVi ? 'Đã phân công kỹ thuật viên thành công!' : 'Technician assigned successfully!');
          operationalNotificationService.dispatchNotification({
            title: `🛠️ Phân công ca sửa chữa mới: ${selectedAssignTech.ticketCode || (selectedAssignTech as any).code}`,
            content: `Quản lý đã điều phối phân công phụ trách ca sửa chữa ${selectedAssignTech.ticketCode || (selectedAssignTech as any).code} (${selectedAssignTech.customerName || ''} - ${selectedAssignTech.productName || selectedAssignTech.deviceModel || 'thiết bị'}). Vui lòng nhận máy và kiểm tra.`,
            type: 'REPAIR_ASSIGNED',
            targetRoles: ['Technician'],
            branchId: (selectedAssignTech as any).branchId || user?.branchId,
            link: '/repairs?tab=MY_TICKETS',
          });
          setSelectedAssignTech(null);
          refetch();
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || (isVi ? 'Không thể phân công kỹ thuật viên' : 'Failed to assign technician');
          toast.error(msg);
        }
      }
    );
  };


  return (
    <div className="p-6 space-y-6 font-sans">
      <PageHeader
        id="tour-repair-header"
        title={isVi ? 'Quản Lý Dịch Vụ Sửa Chữa' : 'Repair Service Management'}
        description={
          isVi 
            ? 'Theo dõi phiếu tiếp nhận, chuẩn đoán lỗi, phân công kỹ thuật, biên bản QC và xuất linh kiện thay thế' 
            : 'Track repair tickets, diagnostics, technician assignment, QC checklist, and parts replacement'
        }
        icon={<Wrench className="w-6 h-6 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <Button 
              id="tour-repair-guide-btn"
              type="button" 
              onClick={startRepairsTour}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 border border-sky-400/40 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
              <span>{isVi ? 'Hướng dẫn sử dụng' : 'User Guide'}</span>
            </Button>
            <Button 
              variant="primary" 
              onClick={() => navigate('/repairs/intake')}
              className="neu-raised flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isVi ? 'Tiếp Nhận Sửa Chữa Mới' : 'New Repair Ticket'}</span>
            </Button>
          </div>
        }
      />

      {/* Sandbox Alert Banner */}
      {isSandboxMode && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 neu-raised">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground flex items-center gap-2">
                <span>{isVi ? 'Chế độ Thực hành Kỹ thuật viên (Technician Sandbox)' : 'Technician Sandbox Training'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30">
                  ISOLATED
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isVi 
                  ? 'Dữ liệu sửa chữa giả lập độc lập trên trình duyệt. Bạn có thể tự do nhận việc, chuyển đổi trạng thái quy trình, nạp linh kiện thay thế và bàn giao máy mà không làm ảnh hưởng CSDL thật.' 
                  : 'Simulated repair tickets isolated in browser. Practice claiming tickets, workflow transitions, parts replacement, and handover safely.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                repairSandboxService.resetToDefault();
                toast.success(isVi ? 'Đã khôi phục dữ liệu thực hành mặc định' : 'Reset sandbox data to default');
              }}
              className="text-xs neu-raised border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isVi ? 'Đặt lại mẫu' : 'Reset Demo'}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                exitSandboxMode({
                  searchParams,
                  setSearchParams,
                  language,
                });
              }}
              className="text-xs neu-raised bg-card border-border hover:bg-rose-500/10 hover:border-rose-500/40 text-muted-foreground hover:text-rose-500 flex items-center gap-1.5 cursor-pointer font-semibold"
              title={isVi ? 'Thoát khỏi chế độ thực hành ngay lập tức' : 'Exit sandbox mode immediately'}
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>{isVi ? 'Thoát Thực Hành' : 'Exit Sandbox'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Quick Metrics Bar for Technicians & Workshop */}
      <div id="tour-repair-kpis" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Chờ nhận việc */}
        <button
          type="button"
          onClick={() => handleTabChange(workQueueTab === 'UNASSIGNED' ? 'ALL' : 'UNASSIGNED')}
          className={`p-3.5 rounded-3xl border text-left transition-all cursor-pointer neu-raised ${
            workQueueTab === 'UNASSIGNED'
              ? 'bg-amber-500/15 border-amber-500/50 ring-2 ring-amber-500/30 shadow-xs'
              : 'bg-card border-border/40 hover:border-amber-500/40 hover:bg-amber-500/[0.03]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{isVi ? 'Chờ Nhận Việc' : 'Pending Intake'}</span>
            </span>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              Ưu tiên 1
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
              {stats.unassigned}
            </span>
            <span className="text-xs text-muted-foreground">
              {isVi ? 'máy chưa có thợ' : 'unassigned'}
            </span>
          </div>
        </button>

        {/* Card 2: Việc của tôi */}
        <button
          type="button"
          onClick={() => handleTabChange(workQueueTab === 'MY_TICKETS' ? 'ALL' : 'MY_TICKETS')}
          className={`p-3.5 rounded-3xl border text-left transition-all cursor-pointer neu-raised ${
            workQueueTab === 'MY_TICKETS'
              ? 'bg-indigo-500/15 border-indigo-500/50 ring-2 ring-indigo-500/30 shadow-xs'
              : 'bg-card border-border/40 hover:border-indigo-500/40 hover:bg-indigo-500/[0.03]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-500" />
              <span>{isVi ? 'Đơn Của Tôi' : 'My Tickets'}</span>
            </span>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
              KTV
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {stats.myTasks}
            </span>
            <span className="text-xs text-muted-foreground">
              {isVi ? 'máy bạn phụ trách' : 'assigned to you'}
            </span>
          </div>
        </button>

        {/* Card 3: Đang xử lý */}
        <button
          type="button"
          onClick={() => handleTabChange(workQueueTab === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          className={`p-3.5 rounded-3xl border text-left transition-all cursor-pointer neu-raised ${
            workQueueTab === 'IN_PROGRESS'
              ? 'bg-primary/15 border-primary/50 ring-2 ring-primary/30 shadow-xs'
              : 'bg-card border-border/40 hover:border-primary/40 hover:bg-primary/[0.03]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-primary" />
              <span>{isVi ? 'Đang Sửa Chữa' : 'In Progress'}</span>
            </span>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
              Xưởng
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-foreground">
              {stats.inProgress}
            </span>
            <span className="text-xs text-muted-foreground">
              {isVi ? 'máy trong quy trình' : 'active jobs'}
            </span>
          </div>
        </button>

        {/* Card 4: Đã hoàn tất */}
        <button
          type="button"
          onClick={() => {
            handleTabChange(workQueueTab === 'COMPLETED' ? 'ALL' : 'COMPLETED');
          }}
          className={`p-3.5 rounded-3xl border text-left transition-all cursor-pointer neu-raised ${
            workQueueTab === 'COMPLETED'
              ? 'bg-emerald-500/15 border-emerald-500/50 ring-2 ring-emerald-500/30 shadow-xs'
              : 'bg-card border-border/40 hover:border-emerald-500/40 hover:bg-emerald-500/[0.03]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{isVi ? 'Đã Xong Chờ Giao' : 'Completed / Ready'}</span>
            </span>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              {isVi ? 'Chờ lấy' : 'Ready'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {stats.completed}
            </span>
            <span className="text-xs text-muted-foreground">
              {isVi ? 'máy xong chờ khách lấy' : 'ready for pickup'}
            </span>
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-card border border-border/40 neu-raised flex flex-col gap-4">
        {/* Work Queue Segmented Filter Tabs */}
        <div id="tour-repair-tabs" className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border/30">
          {[
            { id: 'ALL', labelVi: '📋 Tất Cả Đơn', icon: ClipboardList, count: stats.total },
            { id: 'UNASSIGNED', labelVi: '⚡ Chờ Nhận Việc', icon: Zap, count: stats.unassigned, highlight: 'amber' },
            { id: 'MY_TICKETS', labelVi: '🛠️ Đơn Của Tôi', icon: User, count: stats.myTasks, highlight: 'indigo' },
            { id: 'IN_PROGRESS', labelVi: '⏳ Đang Sửa Chữa', icon: Clock, count: stats.inProgress },
            { id: 'COMPLETED', labelVi: '✅ Đã Xong Chờ Giao', icon: CheckCircle2, count: stats.completed, highlight: 'emerald' },
            { id: 'DELIVERED', labelVi: '📦 Đã Bàn Giao', icon: CheckCircle2, count: stats.delivered, highlight: 'blue' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id as any)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 cursor-pointer border ${
                workQueueTab === tab.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/20'
                  : 'bg-card border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.labelVi}</span>
              <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                workQueueTab === tab.id
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : tab.highlight === 'amber' && tab.count > 0
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold'
                  : tab.highlight === 'indigo' && tab.count > 0
                  ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold'
                  : tab.highlight === 'emerald' && tab.count > 0
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold'
                  : tab.highlight === 'blue' && tab.count > 0
                  ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
          <div className="w-full md:w-96">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={isVi ? 'Tìm kiếm mã phiếu, tên khách, SĐT, IMEI...' : 'Search by code, customer, phone, IMEI...'}
              className="w-full text-xs neu-inset bg-background/50 border-border/40 text-foreground"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto justify-between md:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWorkflowGuide(prev => !prev)}
              className={`text-xs h-9 px-3.5 rounded-2xl flex items-center gap-2 transition-all cursor-pointer font-semibold ${
                showWorkflowGuide
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20 shadow-sm'
                  : 'neu-inset text-muted-foreground hover:text-foreground hover:border-border/60'
              }`}
              title={isVi ? 'Xem sơ đồ quy trình chuyển trạng thái đơn sửa chữa' : 'View status transition workflow'}
            >
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span>{isVi ? 'Hướng dẫn chuyển trạng thái' : 'Status Workflow Guide'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showWorkflowGuide ? 'rotate-180' : ''}`} />
            </Button>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:inline" />
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  if (e.target.value !== 'ALL') {
                    setWorkQueueTab('ALL');
                  }
                  setPage(1);
                }}
                className="text-xs h-9 min-w-[190px] neu-inset bg-card"
              >
                {STATUS_FILTERS.map(f => (
                  <option key={f.id} value={f.id}>
                    {isVi ? f.labelVi : f.labelEn}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Status Transition Workflow Guide Panel (Backend State Machine Strict Rules) */}
        {showWorkflowGuide && (
          <div className="pt-4 border-t border-border/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Guide Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent p-3.5 rounded-2xl border border-amber-500/25">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span>{isVi ? 'Quy Tắc Chuyển Trạng Thái Sửa Chữa (Căn Cứ Backend State Machine)' : 'Repair Status Transition Rules (Backend State Machine)'}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Fail-Closed & RBAC
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isVi
                      ? 'Quy định nghiêm ngặt từ Backend: Mỗi trạng thái CHỈ ĐƯỢC PHÉP chuyển sang đâu và TUYỆT ĐỐI KHÔNG ĐƯỢC chuyển sang đâu để tránh lỗi 409 Conflict.'
                      : 'Strict backend rules: Each status defines exactly what transitions are ALLOWED vs FORBIDDEN (409 Conflict).'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowWorkflowGuide(false)}
                className="self-end sm:self-center text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer border border-border/30 bg-card neu-raised shrink-0 font-medium"
              >
                <X className="w-4 h-4" />
                <span>{isVi ? 'Thu gọn' : 'Collapse'}</span>
              </button>
            </div>

            {/* Visual Linear Lifecycle Pipeline */}
            <div className="p-3 rounded-2xl bg-muted/20 border border-border/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isVi ? 'Sơ đồ tiến trình vòng đời tiêu chuẩn (Bấm vào bước để xem quy tắc):' : 'Standard Lifecycle Pipeline (Click a step to view rules):'}</span>
                </span>
                <span className="text-[10.5px] text-muted-foreground font-mono">
                  Linear State Machine
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
                {[
                  { id: 'PendingAssignment', labelVi: '1. Chờ Phân Công', color: 'amber' },
                  { id: 'Received', labelVi: '2. Tiếp Nhận', color: 'blue' },
                  { id: 'Diagnosing', labelVi: '3. Chẩn Đoán', color: 'amber' },
                  { id: 'Repairing', labelVi: '4. Đang Sửa', color: 'indigo' },
                  { id: 'WaitingQC', labelVi: '5. Chờ QC', color: 'purple' },
                  { id: 'Completed', labelVi: '6. Hoàn Thành', color: 'emerald' },
                  { id: 'WaitingPickup', labelVi: '7. Chờ Giao', color: 'teal' },
                  { id: 'Delivered', labelVi: '8. Bàn Giao', color: 'emerald' },
                ].map((step, idx) => (
                  <React.Fragment key={step.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedGuideStatus(step.id)}
                      className={`px-2.5 py-1.5 rounded-xl font-semibold shrink-0 transition-all cursor-pointer border flex items-center gap-1 text-[11px] ${
                        selectedGuideStatus === step.id
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/25 font-bold'
                          : 'bg-card border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70'
                      }`}
                    >
                      <span>{step.labelVi}</span>
                    </button>
                    {idx < 7 && <ArrowRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />}
                  </React.Fragment>
                ))}

                <div className="h-4 w-px bg-border/60 mx-1 shrink-0" />

                {/* Branch States */}
                <button
                  type="button"
                  onClick={() => setSelectedGuideStatus('WaitingApproval')}
                  className={`px-2 py-1 rounded-xl text-[10.5px] font-semibold shrink-0 transition-all cursor-pointer border ${
                    selectedGuideStatus === 'WaitingApproval'
                      ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:border-rose-500/60'
                  }`}
                  title={isVi ? 'Nhánh rẽ từ Chẩn Đoán khi cần duyệt giá' : 'Branch from Diagnosing'}
                >
                  {isVi ? 'Chờ Duyệt Giá' : 'Waiting Approval'}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGuideStatus('WaitingForParts')}
                  className={`px-2 py-1 rounded-xl text-[10.5px] font-semibold shrink-0 transition-all cursor-pointer border ${
                    selectedGuideStatus === 'WaitingForParts'
                      ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:border-amber-500/60'
                  }`}
                  title={isVi ? 'Nhánh rẽ từ Chẩn Đoán/Sửa Chữa khi hết phụ tùng' : 'Branch when waiting parts'}
                >
                  {isVi ? 'Chờ Linh Kiện' : 'Waiting Parts'}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGuideStatus('Cancelled')}
                  className={`px-2 py-1 rounded-xl text-[10.5px] font-semibold shrink-0 transition-all cursor-pointer border ${
                    selectedGuideStatus === 'Cancelled'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:border-rose-500/60'
                  }`}
                  title={isVi ? 'Nhánh hủy phiếu (tự động hoàn kho linh kiện)' : 'Cancelled branch'}
                >
                  {isVi ? 'Đã Hủy Phiếu' : 'Cancelled'}
                </button>
              </div>
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
              <span className="text-[11px] text-muted-foreground font-semibold shrink-0 mr-1">
                {isVi ? 'Chọn trạng thái tra cứu:' : 'Select status:'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedGuideStatus('Received')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
                  selectedGuideStatus === 'Received'
                    ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/50 ring-2 ring-blue-500/30 font-bold'
                    : 'bg-card border-border/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                ⭐ {isVi ? '2. Tiếp Nhận (Ví dụ)' : '2. Received (Example)'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedGuideStatus('ALL')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
                  selectedGuideStatus === 'ALL'
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card border-border/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                {isVi ? 'Tất cả (11 trạng thái)' : 'All (11 statuses)'}
              </button>
              {STATUS_TRANSITION_RULES.filter(r => r.status !== 'Received').map((r) => {
                const isSelected = selectedGuideStatus === r.status;
                return (
                  <button
                    key={r.status}
                    type="button"
                    onClick={() => setSelectedGuideStatus(r.status)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
                      isSelected
                        ? `${r.badgeClass} ring-2 ring-primary/30 font-bold`
                        : 'bg-card border-border/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {r.stepNumber}. {r.labelVi}
                  </button>
                );
              })}
            </div>

            {/* Transition Rules Cards List */}
            <div className="grid grid-cols-1 gap-3.5">
              {STATUS_TRANSITION_RULES.filter(
                (r) => selectedGuideStatus === 'ALL' || selectedGuideStatus === r.status
              ).map((rule) => (
                <div
                  key={rule.status}
                  className="p-4 rounded-2xl bg-card border border-border/50 neu-raised space-y-3 transition-all hover:border-border/80"
                >
                  {/* Card Header: Current Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/30 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-semibold">
                        {isVi ? 'Khi phiếu đang ở trạng thái:' : 'Current ticket status:'}
                      </span>
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${rule.badgeClass}`}>
                        {isVi ? `BƯỚC ${rule.stepNumber}: ${rule.labelVi}` : `STEP ${rule.stepNumber}: ${rule.labelEn}`} ({rule.status})
                      </span>
                    </div>
                    <span className="text-[10.5px] font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-lg border border-border/20">
                      Căn cứ Backend: RepairCommandHandlers.cs:393-438
                    </span>
                  </div>

                  {/* Summary Callout Banner */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs">
                    <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-0.5">
                      <span>💡</span>
                      <span>{isVi ? 'NGUYÊN TẮC CỐT LÕI CỦA TRẠNG THÁI NÀY:' : 'CORE OPERATIONAL PRINCIPLE:'}</span>
                    </div>
                    <p className="text-foreground/90 font-medium leading-relaxed pl-5">
                      {rule.summaryVi}
                    </p>
                  </div>

                  {/* Backend Code Snippet Box */}
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/30 font-mono text-[11px] text-muted-foreground space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pb-1 border-b border-border/20 font-sans font-semibold">
                      <span>⚙️ Biểu thức logic đối chiếu tại Backend API (RepairCommandHandlers.cs)</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">isValidTransition Check</span>
                    </div>
                    <pre className="text-foreground whitespace-pre-wrap leading-relaxed overflow-x-auto py-1 text-[11px] font-mono">
                      {rule.backendCodeSnippet}
                    </pre>
                    <div className="text-[10.5px] text-rose-600 dark:text-rose-400 font-sans font-medium pt-0.5">
                      ⚠️ {isVi 
                        ? 'Backend chỉ cho phép các trạng thái được liệt kê trong biểu thức trên. Mọi giá trị khác đều lập tức bị từ chối với mã lỗi HTTP 409 Conflict.' 
                        : 'Backend rejects all other statuses with HTTP 409 Conflict.'}
                    </div>
                  </div>

                  {/* 2-Column Grid: Allowed vs Forbidden */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Column 1: ALLOWED (Chỉ được phép) */}
                    <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/25 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>{isVi ? '✅ CHỈ ĐƯỢC PHÉP CHUYỂN SANG:' : '✅ ALLOWED TRANSITIONS:'}</span>
                        </div>
                        <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                          {rule.allowed.length} {isVi ? 'hướng hợp lệ' : 'valid paths'}
                        </span>
                      </div>

                      {rule.allowed.length === 0 ? (
                        <div className="p-3 rounded-lg bg-card/60 border border-border/30 text-xs text-muted-foreground italic leading-relaxed">
                          {isVi
                            ? 'Đây là trạng thái kết thúc (Terminal State). Chu trình sửa chữa đã hoàn tất 100%, Backend khóa hoàn toàn và không cho phép chuyển tiếp sang bất kỳ trạng thái nào khác.'
                            : 'Terminal state. Repair lifecycle completed. No further transitions allowed.'}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {rule.allowed.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-card border border-emerald-500/20 text-xs shadow-xs space-y-1"
                            >
                              <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                                <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>{item.labelVi}</span>
                                <span className="font-mono text-[10px] text-muted-foreground font-normal">
                                  ({item.status})
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground pl-5 leading-relaxed">
                                <strong className="text-foreground">{isVi ? 'Tình huống:' : 'Condition:'}</strong> {item.conditionVi}
                              </p>
                              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 pl-5 leading-relaxed">
                                <strong className="text-emerald-800 dark:text-emerald-200">{isVi ? 'Thao tác KTV:' : 'Action:'}</strong> {item.actionVi}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Column 2: FORBIDDEN (Tuyệt đối không được) */}
                    <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/25 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                          <Ban className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          <span>{isVi ? '🛑 TUYỆT ĐỐI KHÔNG ĐƯỢC (Backend chặn 409):' : '🛑 FORBIDDEN (409 Conflict):'}</span>
                        </div>
                        <span className="text-[10px] font-mono bg-rose-500/15 text-rose-700 dark:text-rose-300 px-1.5 py-0.2 rounded font-bold">
                          HTTP 409 Conflict
                        </span>
                      </div>

                      <div className="space-y-2">
                        {rule.forbidden.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-card border border-rose-500/20 text-xs shadow-xs space-y-1"
                          >
                            <div className="font-bold text-rose-700 dark:text-rose-300 flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>{item.targetLabelVi || item.labelVi}</span>
                              </div>
                              <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold shrink-0">
                                409
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground pl-5 leading-relaxed">
                              {item.reasonVi}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Backend Technical Rule / Constraint & Automations */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/30 text-xs text-muted-foreground space-y-1.5">
                    <div className="flex items-start gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground">{isVi ? 'Ràng buộc Backend:' : 'Backend Rule:'}</strong>{' '}
                        <span>{rule.backendRuleVi}</span>
                      </div>
                    </div>

                    {rule.backendAutomations && rule.backendAutomations.length > 0 && (
                      <div className="pl-5 pt-1 border-t border-border/20 space-y-0.5 text-[11px]">
                        <span className="font-semibold text-foreground/80">{isVi ? 'Cơ chế tự động hóa ngầm của Backend:' : 'Backend Automations:'}</span>
                        {rule.backendAutomations.map((auto, aIdx) => (
                          <div key={aIdx} className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="text-emerald-500 text-[10px]">✔</span>
                            <span>{auto}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Important Operational Notes for Technicians */}
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="text-amber-500">💡</span>
                  <span>{isVi ? '4 Quy tắc cốt lõi Kỹ thuật viên cần ghi nhớ:' : '4 Core Operational Rules for Technicians:'}</span>
                </div>
                <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                  <span>• <strong>Không nhảy cóc:</strong> Tuyệt đối không nhảy từ Tiếp Nhận sang Sửa Chữa hay Hoàn Thành (Backend chặn lỗi 409 Conflict).</span>
                  <span>• <strong>Chỉ đơn của mình:</strong> KTV chỉ nhận việc và thao tác đơn thuộc chi nhánh mình (gán người khác bị 403 Forbidden).</span>
                  <span>• <strong>Đổi nhanh:</strong> Bấm trực tiếp vào cột "Trạng thái" trong bảng dưới để chuyển bước hợp lệ.</span>
                  <span>• <strong>Tự động hoàn kho:</strong> Khi Hủy phiếu, Backend tự động trả linh kiện về kho và khôi phục IMEI.</span>
                </div>
              </div>

              <div className="shrink-0 font-mono text-[10.5px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/25 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Auto Idempotency-Key Active</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <DataTable 
        isLoading={isLoading} 
        isEmpty={!displayedTickets.length} 
        emptyTitle={isVi ? 'Không có phiếu sửa chữa nào' : 'No repair tickets found'}
      >
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b border-border/40">
            <tr>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isVi ? 'Mã Phiếu' : 'Ticket Code'}
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isVi ? 'Khách Hàng' : 'Customer'}
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isVi ? 'Thiết Bị & IMEI' : 'Device & IMEI'}
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isVi ? 'Hiện Tượng Lỗi' : 'Fault Description'}
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isVi ? 'Ngoại Quan' : 'Cosmetic Condition'}
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isVi ? 'Chi Phí / Cọc' : 'Cost / Deposit'}
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isVi ? 'Kỹ Thuật Viên' : 'Technician'}
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isVi ? 'Trạng Thái' : 'Status'}
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isVi ? 'Thao Tác' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border/30">
            {displayedTickets.map((r: RepairTicketDto, idx: number) => {
              const transitions = getValidTransitions(r.status);
              const totalCost = (r.actualCost && r.actualCost > 0) 
                ? r.actualCost 
                : ((r.totalAmount && r.totalAmount > 0) ? r.totalAmount : (r.estimatedCost ?? 0));
              const isUnassigned = isTicketUnassigned(r);
              const isMyTask = isMyTicket(r.technicianId);
              const isClosed = ['Completed', 'Delivered', 'Cancelled'].includes(r.status);
              const hasTechAssigned = isTechnicianAssigned(r.technicianId);

              let rowClass = 'hover:bg-muted/15 transition-colors';
              if (!isClosed) {
                if (isUnassigned) {
                  rowClass = 'bg-amber-500/[0.04] border-l-4 border-l-amber-500 hover:bg-amber-500/[0.08] transition-colors';
                } else if (isMyTask) {
                  rowClass = 'bg-indigo-500/[0.04] border-l-4 border-l-indigo-500 hover:bg-indigo-500/[0.08] transition-colors';
                }
              }

              return (
                <tr key={r.id || idx} className={rowClass}>
                  {/* Mã Phiếu */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold font-mono text-primary text-xs">
                        {r.ticketCode || (r as any).code || 'REP-Ticket'}
                      </span>
                      {isUnassigned && !isClosed && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 animate-pulse">
                          ⚡ Chờ nhận
                        </span>
                      )}
                      {isMyTask && !isClosed && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40">
                          👤 Của bạn
                        </span>
                      )}
                      {r.isTest && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          TEST
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(r.createdAt || (r as any).receivedDate || Date.now()).toLocaleDateString('vi-VN')}
                    </div>
                  </td>

                  {/* Khách Hàng */}
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-foreground text-xs">{r.customerName || 'Khách lẻ'}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{r.customerPhone || 'N/A'}</div>
                  </td>

                  {/* Thiết Bị & IMEI */}
                  <td className="px-4 py-3.5 min-w-[150px] max-w-[200px]">
                    <div className="font-medium text-foreground text-xs truncate" title={r.customModelName ? `${r.productName || 'Thiết bị'} (${r.customModelName})` : r.productName || r.deviceModel || 'Thiết bị di động'}>
                      {r.productName || r.deviceModel || 'Thiết bị di động'}
                    </div>
                    {r.customModelName && (
                      <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[160px]" title={r.customModelName}>
                        {r.customModelName}
                      </span>
                    )}
                    <div className="text-[11px] text-muted-foreground font-mono truncate">
                      {r.imei || (r as any).serialImei ? `IMEI: ${r.imei || (r as any).serialImei}` : <span className="italic text-muted-foreground/50">Chưa có IMEI</span>}
                    </div>
                  </td>

                  {/* Hiện Tượng Lỗi */}
                  <td className="px-4 py-3.5 min-w-[160px] max-w-[220px]">
                    <div 
                      className="text-xs text-foreground line-clamp-2 leading-relaxed" 
                      title={r.problemDescription || 'Chưa ghi nhận'}
                    >
                      {r.problemDescription || <span className="text-muted-foreground/50 italic text-[11px]">Chưa ghi nhận</span>}
                    </div>
                  </td>

                  {/* Ngoại Quan */}
                  <td className="px-4 py-3.5 min-w-[140px] max-w-[200px]">
                    {r.exteriorCondition ? (
                      <div 
                        className="text-xs text-muted-foreground line-clamp-2 leading-relaxed" 
                        title={r.exteriorCondition}
                      >
                        {r.exteriorCondition}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50 text-[11px] italic">Bình thường</span>
                    )}
                  </td>

                  {/* Chi Phí / Cọc */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="font-semibold font-mono text-xs text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totalCost)}
                    </div>
                    {(() => {
                      const totalDeposit = (r.deposits || []).reduce((acc, d) => acc + (d.amount || 0), 0);
                      return totalDeposit > 0 ? (
                        <div className="text-[10px] text-primary font-medium">
                          {isVi ? `Đã cọc: ${formatCurrency(totalDeposit)}` : `Deposit: ${formatCurrency(totalDeposit)}`}
                        </div>
                      ) : (
                        <div className="text-[10px] text-muted-foreground">
                          {isVi ? 'Chưa đặt cọc' : 'No deposit'}
                        </div>
                      );
                    })()}
                  </td>
                  
                  {/* Technician Assignment Cell */}
                  <td className="px-4 py-3.5">
                    {hasTechAssigned ? (
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                          isMyTask
                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                            : 'bg-muted border-border/40 text-muted-foreground'
                        }`}>
                          {(r.technicianName || 'K').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-foreground truncate max-w-[110px] flex items-center gap-1">
                            <span>{r.technicianName || (isMyTask ? (user?.fullName || user?.username) : 'Kỹ thuật viên')}</span>
                            {isMyTask && (
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">(Bạn)</span>
                            )}
                          </p>
                          {isManagerOrAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAssignTech(r);
                                setSelectedTechId(r.technicianId || '');
                              }}
                              className="text-[10px] text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 underline block text-left cursor-pointer"
                            >
                              {isVi ? 'Đổi người' : 'Change'}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isTechnician && !isManagerOrAdmin && !isClosed && (
                          <button
                            id={idx === 0 ? "tour-repair-claim-btn" : undefined}
                            type="button"
                            onClick={() => handleQuickSelfAssign(r)}
                            disabled={assignTechnician.isPending}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ring-1 ring-emerald-500/30"
                            title={isVi ? 'Nhận xử lý đơn này ngay' : 'Take task now'}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{isVi ? 'Nhận việc ngay' : 'Take task'}</span>
                          </button>
                        )}

                        {isManagerOrAdmin && !isClosed && (
                          <button
                            id={idx === 0 ? "tour-repair-manager-assign" : undefined}
                            type="button"
                            onClick={() => {
                              setSelectedAssignTech(r);
                              setSelectedTechId('');
                            }}
                            className="text-xs px-2.5 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>{isVi ? '+ Giao việc' : '+ Assign'}</span>
                          </button>
                        )}

                        {((!isTechnician && !isManagerOrAdmin) || isClosed) && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30">
                            {isVi ? 'Chờ giao' : 'Unassigned'}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Status & Transition Select */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1 items-start">
                      <Badge 
                        variant={getRepairStatusColor(r.status)} 
                        className={`text-[11px] font-semibold ${
                          r.status === 'PendingAssignment' 
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 ring-1 ring-amber-500/20' 
                            : ''
                        }`}
                      >
                        {getRepairStatusLabel(r.status, language)}
                      </Badge>
                      {(isTechnician || isManagerOrAdmin) && (
                        <Select 
                          id={idx === 0 ? "tour-repair-status-dropdown" : undefined}
                          className="h-7 text-[11px] w-full min-w-[140px] mt-0.5 neu-inset bg-card" 
                          value="" 
                          onChange={(e) => handleStatusChange(r, e.target.value as RepairTicketStatus)} 
                          disabled={updateStatus.isPending}
                        >
                          <option value="" disabled>{isVi ? 'Chuyển bước...' : 'Transition...'}</option>
                          {transitions.length > 0 && (
                            <optgroup label={isVi ? '── Chuyển tiếp hợp lệ ──' : '── Valid Next Steps ──'}>
                              {transitions.map(ts => (
                                <option key={ts} value={ts}>{getRepairStatusLabel(ts, language)}</option>
                              ))}
                            </optgroup>
                          )}
                          <optgroup label={isVi ? '── Tất cả trạng thái khác ──' : '── All Other Statuses ──'}>
                            {ALL_REPAIR_STATUSES.filter(s => s !== r.status && !transitions.includes(s)).map(s => (
                              <option key={s} value={s}>{getRepairStatusLabel(s, language)}</option>
                            ))}
                          </optgroup>
                        </Select>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    <div 
                      id={idx === 0 ? "tour-repair-actions" : undefined}
                      className="flex items-center justify-end gap-1.5 flex-wrap"
                    >
                      {/* One-Click Fast Transition Button for Current Technician */}
                      {isMyTask && !isClosed && (
                        <>
                          {r.status === 'Received' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(r, 'Diagnosing')}
                              disabled={updateStatus.isPending}
                              className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                              title={isVi ? 'Bắt đầu kiểm tra & chẩn đoán lỗi' : 'Start diagnosing'}
                            >
                              <Wrench className="w-3 h-3" />
                              <span>{isVi ? 'Chẩn đoán' : 'Diagnose'}</span>
                            </button>
                          )}

                          {r.status === 'Diagnosing' && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedDiagnosisTicket(r)}
                                className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                title={isVi ? 'Lập biên bản chẩn đoán kỹ thuật & phân nhánh' : 'Submit diagnosis'}
                              >
                                <ClipboardList className="w-3 h-3" />
                                <span>{isVi ? 'Chẩn đoán' : 'Diagnose'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(r, 'Repairing')}
                                disabled={updateStatus.isPending}
                                className="px-2 py-1 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                title={isVi ? 'Chuyển thẳng sang Sửa chữa' : 'Direct to repair'}
                              >
                                <span>{isVi ? 'Sửa ngay' : 'Repair'}</span>
                              </button>
                            </div>
                          )}

                          {r.status === 'WaitingApproval' && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleApproveRepair(r)}
                                disabled={approveRepair.isPending}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                title={isVi ? 'Khách hàng đồng ý sửa chữa' : 'Customer approved'}
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>{isVi ? 'Khách duyệt' : 'Approved'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectRepair(r)}
                                disabled={rejectRepair.isPending}
                                className="px-2 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title={isVi ? 'Khách hàng từ chối sửa' : 'Customer rejected'}
                              >
                                <ThumbsDown className="w-3 h-3" />
                                <span>{isVi ? 'Từ chối' : 'Reject'}</span>
                              </button>
                            </div>
                          )}

                          {r.status === 'WaitingForParts' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(r, 'Repairing')}
                              disabled={updateStatus.isPending}
                              className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                              title={isVi ? 'Đã có linh kiện, tiếp tục sửa chữa' : 'Parts arrived, repair'}
                            >
                              <Wrench className="w-3 h-3" />
                              <span>{isVi ? 'Đã có linh kiện' : 'Parts Ready'}</span>
                            </button>
                          )}

                          {r.status === 'Repairing' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(r, 'WaitingQC')}
                              disabled={updateStatus.isPending}
                              className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                              title={isVi ? 'Đã sửa xong, gửi máy sang kiểm định QC' : 'Finish repair, send to QC'}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isVi ? 'Gửi QC' : 'Send QC'}</span>
                            </button>
                          )}

                          {r.status === 'WaitingQC' && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(r, 'Completed')}
                                disabled={updateStatus.isPending}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                title={isVi ? 'Máy đạt chuẩn kiểm định QC, hoàn thành phiếu' : 'Pass QC, complete ticket'}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{isVi ? 'Đạt QC' : 'Pass QC'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(r, 'Repairing')}
                                disabled={updateStatus.isPending}
                                className="px-2 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title={isVi ? 'QC không đạt, yêu cầu sửa lại' : 'QC failed, rework'}
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>{isVi ? 'Sửa lại' : 'Rework'}</span>
                              </button>
                            </div>
                          )}

                          {r.status === 'Completed' && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(r, 'WaitingPickup')}
                                disabled={updateStatus.isPending}
                                className="px-2.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                title={isVi ? 'Báo khách hàng đến nhận máy' : 'Notify customer ready for pickup'}
                              >
                                <Clock className="w-3 h-3" />
                                <span>{isVi ? 'Chờ nhận' : 'Pickup'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedDeliverTicket(r)}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                title={isVi ? 'Khách đã có mặt, bàn giao máy ngay' : 'Customer arrived, deliver device'}
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>{isVi ? 'Giao máy' : 'Deliver'}</span>
                              </button>
                            </div>
                          )}

                          {r.status === 'WaitingPickup' && (
                            <button
                              type="button"
                              onClick={() => setSelectedDeliverTicket(r)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95"
                              title={isVi ? 'Quyết toán và bàn giao máy cho khách' : 'Handover device to customer'}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{isVi ? 'Bàn Giao Máy' : 'Deliver'}</span>
                            </button>
                          )}
                        </>
                      )}

                      {/* Front Desk / Sales Quick Actions (Quote Approval & Customer Device Pickup) */}
                      {!isMyTask && !isClosed && (isSales || isManagerOrAdmin) && (
                        <>
                          {r.status === 'WaitingApproval' && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleApproveRepair(r)}
                                disabled={approveRepair.isPending}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                title={isVi ? 'Khách hàng đồng ý sửa chữa' : 'Customer approved'}
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>{isVi ? 'Khách duyệt' : 'Approved'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectRepair(r)}
                                disabled={rejectRepair.isPending}
                                className="px-2 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title={isVi ? 'Khách hàng từ chối sửa' : 'Customer rejected'}
                              >
                                <ThumbsDown className="w-3 h-3" />
                                <span>{isVi ? 'Từ chối' : 'Reject'}</span>
                              </button>
                            </div>
                          )}

                          {(r.status === 'WaitingPickup' || r.status === 'Completed') && (
                            <button
                              type="button"
                              onClick={() => setSelectedDeliverTicket(r)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95"
                              title={isVi ? 'Quyết toán và bàn giao máy cho khách' : 'Handover device to customer'}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{isVi ? 'Bàn Giao Máy' : 'Deliver'}</span>
                            </button>
                          )}
                        </>
                      )}

                      {/* Standard Action Icon Buttons */}
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setSelectedDetail(r)}
                        title={isVi ? 'Xem & Sửa chi tiết đơn' : 'View & Edit Details'}
                        className="h-8 w-8 p-0 neu-raised text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setSelectedPrint(r)}
                        title={isVi ? 'In biên nhận K80' : 'Print K80 Receipt'}
                        className="h-8 w-8 p-0 neu-raised"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setSelectedTracker(r)}
                        title={isVi ? 'Xem tiến độ quy trình' : 'Workflow Timeline'}
                        className="h-8 w-8 p-0 neu-raised text-primary"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setSelectedChecklist(r)}
                        title={isVi ? 'Biên bản kiểm định & QC máy' : 'Functional QC Checklist'}
                        className="h-8 w-8 p-0 neu-raised text-purple-500"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </Button>
                      {(isTechnician || isManagerOrAdmin) && ['Diagnosing', 'Repairing', 'WaitingForParts'].includes(r.status) && (
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setSelectedPart(r)}
                          title={isVi ? 'Xuất linh kiện thay thế' : 'Issue Repair Part'}
                          className="h-8 w-8 p-0 neu-raised text-amber-500"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DataTable>

      {/* Pagination */}
      {data && (
        <AppPagination
          currentPage={page}
          pageSize={10}
          totalItems={data.totalCount || 0}
          onPageChange={setPage}
        />
      )}

      {/* Assign Technician Modal */}
      {selectedAssignTech && (
        <Dialog
          open
          onOpenChange={() => setSelectedAssignTech(null)}
          title={isVi ? 'Phân Công Kỹ Thuật Viên Phụ Trách' : 'Assign Repair Technician'}
        >
          <div className="space-y-4 py-2">
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/30 text-xs space-y-1">
              <p className="font-semibold text-foreground">
                {isVi ? 'Phiếu sửa chữa: ' : 'Ticket: '}
                <span className="font-mono text-primary">{selectedAssignTech.ticketCode || selectedAssignTech.code}</span>
              </p>
              <p className="text-muted-foreground">
                {isVi ? 'Khách hàng: ' : 'Customer: '}
                <span className="font-medium text-foreground">{selectedAssignTech.customerName}</span> • {selectedAssignTech.productName || selectedAssignTech.deviceModel}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-2">
                {isVi ? 'Chọn Kỹ thuật viên phụ trách:' : 'Select Assigned Technician:'}
              </label>
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full neu-inset bg-card border border-border/40 rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">{isVi ? '— Chưa phân công (Bỏ trống) —' : '— Unassigned —'}</option>
                {branchTechnicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} {t.roles?.length ? `(${t.roles.join(', ')})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border/30">
              <Button
                variant="ghost"
                onClick={() => setSelectedAssignTech(null)}
                disabled={assignTechnician.isPending}
              >
                {isVi ? 'Hủy bỏ' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveAssignTechnician}
                disabled={assignTechnician.isPending}
                className="flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                {assignTechnician.isPending
                  ? (isVi ? 'Đang lưu...' : 'Saving...')
                  : (isVi ? 'Xác Nhận Phân Công' : 'Confirm Assignment')}
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Detail Modal */}
      {selectedDetail && (
        <RepairDetailModal
          ticket={selectedDetail}
          onClose={() => {
            setSelectedDetail(null);
            setSearch('');
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.delete('ticketId');
              next.delete('code');
              next.delete('search');
              return next;
            });
            if (isTechnician || ticketIdParam || initialCode) {
              navigate('/dashboard');
            } else {
              refetch();
            }
          }}
          onPrint={(t) => setSelectedPrint(t)}
          onOpenAddPart={(t) => setSelectedPart(t)}
          onOpenChecklist={(t) => setSelectedChecklist(t)}
          onOpenDeliver={(t) => setSelectedDeliverTicket(t)}
        />
      )}

      {/* Modal Actions */}
      {selectedPrint && (
        <RepairK80ReceiptModal 
          ticket={selectedPrint} 
          onClose={() => setSelectedPrint(null)} 
        />
      )}

      {selectedTracker && (
        <AppleCareProgressModal 
          ticket={selectedTracker} 
          onClose={() => setSelectedTracker(null)} 
        />
      )}

      {selectedChecklist && (
        <RepairChecklistModal 
          ticket={selectedChecklist} 
          onClose={() => setSelectedChecklist(null)} 
          onSuccess={refetch}
        />
      )}

      {selectedPart && (
        <AddRepairPartModal 
          repairTicketId={selectedPart.id} 
          onClose={() => setSelectedPart(null)} 
          onSuccess={refetch}
        />
      )}

      {selectedDiagnosisTicket && (
        <SubmitDiagnosisModal
          ticket={selectedDiagnosisTicket}
          onClose={() => setSelectedDiagnosisTicket(null)}
          onSuccess={() => {
            setSelectedDiagnosisTicket(null);
            refetch();
          }}
        />
      )}

      {selectedDeliverTicket && (
        <DeliverRepairModal
          isOpen={Boolean(selectedDeliverTicket)}
          ticket={selectedDeliverTicket}
          onClose={() => setSelectedDeliverTicket(null)}
          onDeliveredSuccess={(deliveredTicket) => {
            refetch();
            refetchStats();
            setSelectedPrint(deliveredTicket);
          }}
        />
      )}
    </div>
  );
};
