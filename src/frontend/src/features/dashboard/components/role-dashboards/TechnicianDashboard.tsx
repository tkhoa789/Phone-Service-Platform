import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../../stores/authStore';
import { useBranchStore } from '../../../../stores/branchStore';
import { useThemeStore } from '../../../../stores/themeStore';
import { serviceService } from '../../../../services/serviceService';
import { PageHeader } from '../../../../components/shared/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { WorkQueueTable } from '../widgets/WorkQueueTable';
import { QuickActions } from '../widgets/QuickActions';
import type { QuickActionItem } from '../widgets/QuickActions';
import { ExceptionPanel } from '../widgets/ExceptionPanel';
import { SupportingBadges } from '../widgets/SupportingBadges';
import type { SupportingBadgeItem } from '../widgets/SupportingBadges';
import { 
  Wrench, Package, ShieldCheck, Users, Clock, 
  Store, Cpu, Smartphone, RefreshCw, CheckCircle2, 
  AlertTriangle, ArrowRight, UserCheck, Sparkles, LogOut
} from 'lucide-react';
import type { RepairTicketDto } from '../../../../types/api.types';
import { useRepairStats, useAssignTechnician } from '../../../repairs/api/useRepairs';
import { repairSandboxService } from '../../../repairs/services/repairSandboxService';
import { useTechnicianDashboardTour } from '../../hooks/useTechnicianDashboardTour';
import { exitSandboxMode } from '../../../../utils/sandboxUtils';
import toast from 'react-hot-toast';

export const TechnicianDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { activeBranchId, activeBranchName } = useBranchStore();
  const { language } = useThemeStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const isSandboxMode = 
    searchParams.get('mode') === 'training' || 
    location.search.includes('sandbox=true') ||
    (typeof window !== 'undefined' && sessionStorage.getItem('psp_sandbox_mode') === 'true');

  const [sandboxTick, setSandboxTick] = useState(0);
  const { startTour } = useTechnicianDashboardTour();

  useEffect(() => {
    const handleUpdate = () => setSandboxTick((t) => t + 1);
    window.addEventListener('psp_sandbox_repairs_updated', handleUpdate);
    return () => window.removeEventListener('psp_sandbox_repairs_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (searchParams.get('tour') === 'auto' || searchParams.get('tour') === 'true') {
      const timer = setTimeout(() => {
        startTour();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, startTour]);

  const [activeTab, setActiveTab] = useState<'myRepairs' | 'intakeQueue' | 'readyQueue'>('myRepairs');

  const { data: liveRepairStats, refetch: refetchStats } = useRepairStats();
  const assignTechnicianMutation = useAssignTechnician();

  // Query branch repair tickets
  const { 
    data: repairsData, 
    isLoading: liveLoading, 
    isError,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['repairs', 'dashboard-queue', activeBranchId],
    queryFn: () => serviceService.getRepairs({ pageSize: 50 }),
    refetchInterval: isSandboxMode ? false : 8000,
    refetchOnWindowFocus: !isSandboxMode,
    enabled: !isSandboxMode,
  });

  const sandboxTickets = useMemo(() => {
    if (!isSandboxMode) return [];
    return repairSandboxService.getRepairs(user?.id);
  }, [isSandboxMode, user?.id, sandboxTick]);

  const sandboxStats = useMemo(() => {
    if (!isSandboxMode) return null;
    return repairSandboxService.getRepairStats(user?.id);
  }, [isSandboxMode, user?.id, sandboxTick]);

  const allTickets = isSandboxMode ? sandboxTickets : (repairsData?.items || []);
  const repairStats = isSandboxMode ? sandboxStats : liveRepairStats;
  const isLoading = isSandboxMode ? false : liveLoading;

  const isMyTicket = (techId?: string | null) => 
    Boolean(user?.id && techId && techId !== '00000000-0000-0000-0000-000000000000' && techId.toLowerCase() === user.id.toLowerCase());

  const isUnassignedTicket = (t: RepairTicketDto) => 
    (!t.technicianId || t.technicianId === '00000000-0000-0000-0000-000000000000' || t.status === 'PendingAssignment') && 
    !['Completed', 'Delivered', 'Cancelled'].includes(t.status);

  // 1. My Work (Assigned to logged in technician)
  const myAssignedTickets = allTickets.filter(
    (t) => isMyTicket(t.technicianId) && t.status !== 'Delivered' && t.status !== 'Cancelled'
  );
  const myActiveTickets = myAssignedTickets.filter(
    (t) => t.status === 'Repairing' || t.status === 'Diagnosing'
  );

  // 2. Blocked tickets: WaitingForParts or WaitingApproval (Dữ liệu từ Database chuẩn 100%)
  const blockedPartsTickets = allTickets.filter((t) => t.status === 'WaitingForParts');
  const blockedApprovalTickets = allTickets.filter((t) => t.status === 'WaitingApproval');
  const totalBlocked = (repairStats?.waitingForPartsCount ?? blockedPartsTickets.length) + (repairStats?.waitingApprovalCount ?? blockedApprovalTickets.length);

  // 3. Branch Intake Queue: unassigned or pending assignment
  const intakeTickets = allTickets.filter(isUnassignedTicket);

  // 4. Completed / Ready for Pickup
  const readyTickets = allTickets.filter(
    (t) => t.status === 'Completed' || t.status === 'WaitingPickup'
  );

  const displayedQueue = 
    activeTab === 'myRepairs' 
      ? myAssignedTickets 
      : activeTab === 'intakeQueue' 
      ? intakeTickets 
      : readyTickets;

  const quickActionsList: QuickActionItem[] = [
    {
      title: language === 'vi' ? 'Bàn Sửa Chữa Tiếp Nhận' : 'Repair Workstation',
      description: language === 'vi' ? 'Tiếp nhận máy sửa chữa mới, lập biên bản chẩn đoán kỹ thuật và cập nhật tiến độ.' : 'Intake device, diagnose faults and update progress.',
      icon: <Wrench className="w-5 h-5" />,
      iconColor: 'text-amber-500',
      badge: language === 'vi' ? 'Chính' : 'Primary',
      onClick: () => navigate('/repairs'),
    },
    {
      title: language === 'vi' ? 'Linh Kiện & Phụ Tùng Thay Thế' : 'Replacement Parts',
      description: language === 'vi' ? 'Tra cứu tồn kho linh kiện thay thế, màn hình, pin và đặt phụ tùng sửa chữa.' : 'Search replacement screens, batteries, and spare parts.',
      icon: <Package className="w-5 h-5" />,
      iconColor: 'text-blue-500',
      onClick: () => navigate('/products'),
    },
    {
      title: language === 'vi' ? 'Lịch Sử Sửa Chữa & Bảo Hành' : 'Repair & Warranty History',
      description: language === 'vi' ? 'Tra cứu lịch sử bảo hành, serial linh kiện đã từng thay thế để tránh lỗi tái phát.' : 'Audit previous repair logs and component serials.',
      icon: <ShieldCheck className="w-5 h-5" />,
      iconColor: 'text-emerald-500',
      onClick: () => navigate('/warranties'),
    },
    {
      title: language === 'vi' ? 'Liên Hệ Khách Hàng Chủ Máy' : 'Customer Directory & Contact',
      description: language === 'vi' ? 'Tra cứu hồ sơ khách hàng, số điện thoại, lịch sử máy và các đơn sửa chữa liên quan.' : 'Search customer profile, phone numbers, and past repair history.',
      icon: <Users className="w-5 h-5" />,
      iconColor: 'text-purple-500',
      onClick: () => navigate('/customers'),
    },
  ];

  // Supporting compact badges (placed at bottom)
  const summaryBadges: SupportingBadgeItem[] = [
    {
      id: 'active-repairs',
      label: language === 'vi' ? 'Ca Đang Phụ Trách' : 'My Assigned Repairs',
      value: repairStats?.myTasksCount ?? myAssignedTickets.length,
      unit: language === 'vi' ? 'ca' : 'tickets',
      icon: <Wrench className="w-4 h-4" />,
      iconColor: 'text-amber-500',
      variant: (repairStats?.myTasksCount ?? myAssignedTickets.length) > 0 ? 'warning' : 'default',
      onClick: () => navigate('/repairs?tab=MY_TICKETS'),
    },
    {
      id: 'blocked-parts',
      label: language === 'vi' ? 'Kẹt Chờ Linh Kiện' : 'Waiting for Parts',
      value: repairStats?.waitingForPartsCount ?? blockedPartsTickets.length,
      unit: language === 'vi' ? 'ca' : 'tickets',
      icon: <Package className="w-4 h-4" />,
      iconColor: 'text-rose-500',
      variant: (repairStats?.waitingForPartsCount ?? blockedPartsTickets.length) > 0 ? 'danger' : 'muted',
      onClick: () => navigate('/repairs?status=WaitingForParts'),
    },
    {
      id: 'intake-backlog',
      label: language === 'vi' ? 'Chờ Tiếp Nhận Chi Nhánh' : 'Intake Backlog',
      value: repairStats?.unassignedCount ?? intakeTickets.length,
      unit: language === 'vi' ? 'máy' : 'devices',
      icon: <Smartphone className="w-4 h-4" />,
      iconColor: 'text-blue-500',
      variant: 'info',
      onClick: () => navigate('/repairs?tab=UNASSIGNED'),
    },
    {
      id: 'completed-today',
      label: language === 'vi' ? 'Đã Xong Chờ Giao' : 'Ready / Pickup',
      value: repairStats?.completedCount ?? readyTickets.length,
      unit: language === 'vi' ? 'máy' : 'devices',
      icon: <CheckCircle2 className="w-4 h-4" />,
      iconColor: 'text-emerald-500',
      variant: 'success',
      onClick: () => navigate('/repairs?tab=COMPLETED'),
    },
    {
      id: 'delivered-summary',
      label: language === 'vi' ? 'Đã Bàn Giao Khách' : 'Delivered Devices',
      value: repairStats?.deliveredCount ?? 0,
      unit: language === 'vi' ? 'máy' : 'devices',
      icon: <CheckCircle2 className="w-4 h-4" />,
      iconColor: 'text-blue-500',
      variant: 'default',
      onClick: () => navigate('/repairs?tab=DELIVERED'),
    },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Page Header with Primary Action Button */}
      <PageHeader
        title={language === 'vi' ? 'Không Gian Kỹ Thuật Viên Sửa Chữa' : 'Technician Repair Workbench'}
        description={
          language === 'vi'
            ? `Bàn làm việc kỹ thuật: quản lý ca sửa chữa được phân công, gỡ điểm nghẽn linh kiện và nhận máy mới. Xưởng: ${activeBranchName}.`
            : `Technical workbench: manage assigned repair tickets, resolve parts bottlenecks, and intake devices. Scope: ${activeBranchName}.`
        }
        icon={<Wrench className="w-6 h-6 text-amber-500" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="gap-1.5 text-xs h-9 px-3 neu-raised active:shadow-inset"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isRefetching ? 'animate-spin' : ''}`} />
              <span>{language === 'vi' ? 'Làm mới' : 'Refresh'}</span>
            </Button>

            <Button
              id="tour-tech-guide-btn"
              type="button"
              onClick={() => {
                if (!isSandboxMode) {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('mode', 'training');
                  setSearchParams(newParams);
                  toast.success(
                    language === 'vi'
                      ? 'Đã bật Chế độ Thực hành & Khởi động Hướng dẫn!'
                      : 'Sandbox Mode & Guided Tour activated!',
                    { icon: '👨‍🔧' }
                  );
                }
                setTimeout(() => {
                  startTour();
                }, 250);
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 border border-sky-400/40 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
              <span>{language === 'vi' ? 'Hướng dẫn sử dụng' : 'User Guide'}</span>
            </Button>

            <Button
              id="tour-tech-go-repairs"
              variant="primary"
              onClick={() => navigate(isSandboxMode ? '/repairs?mode=training' : '/repairs')}
              className="gap-2 text-xs h-9 px-4 shadow-md font-semibold"
            >
              <Wrench className="w-4 h-4" />
              <span>{language === 'vi' ? 'Bàn Sửa Chữa Tiếp Nhận' : 'Repair Workstation'}</span>
            </Button>
          </div>
        }
      />

      {/* Sandbox Alert Banner */}
      {isSandboxMode && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              {language === 'vi'
                ? 'Chế độ Thực hành: Dữ liệu ca sửa chữa giả lập an toàn'
                : 'Sandbox Mode: Isolated technician training data active'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                repairSandboxService.resetToDefault();
                toast.success(
                  language === 'vi' ? 'Đã đặt lại dữ liệu thực hành KTV!' : 'Reset sandbox data successfully!',
                  { icon: '🔄' }
                );
              }}
              className="h-8 text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 mr-1.5" />
              <span>{language === 'vi' ? 'Khôi phục mẫu' : 'Reset Sandbox'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exitSandboxMode({
                  searchParams,
                  setSearchParams,
                  language,
                });
              }}
              className="h-8 text-xs bg-card border-border hover:bg-rose-500/10 hover:border-rose-500/40 text-muted-foreground hover:text-rose-500 cursor-pointer font-semibold"
              title={language === 'vi' ? 'Thoát khỏi chế độ thực hành ngay lập tức' : 'Exit sandbox mode immediately'}
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
              <span>{language === 'vi' ? 'Thoát Thực Hành' : 'Exit Sandbox'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* 2. Role Context Ribbon */}
      <div id="tour-tech-ribbon" className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="warning" className="font-semibold uppercase tracking-wider text-[11px]">
            {language === 'vi' ? 'Kỹ Thuật Viên Sửa Chữa (Technician)' : 'Repair Technician'}
          </Badge>
          <span className="text-muted-foreground hidden sm:inline">•</span>
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium text-foreground">{activeBranchName}</span>
          </span>
          {user?.fullName && (
            <>
              <span className="text-muted-foreground hidden sm:inline">•</span>
              <span className="text-muted-foreground font-mono">
                {user.fullName}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{language === 'vi' ? 'Khu Vực Kỹ Thuật Đang Mở' : 'Workshop Active'}</span>
        </div>
      </div>

      {/* 3. Operational Blockers: Waiting for Parts or Customer Approval */}
      {totalBlocked > 0 && (
        <div id="tour-tech-exceptions">
          <ExceptionPanel
            severity="warning"
            title={language === 'vi' ? 'Điểm Nghẽn Kỹ Thuật: Ca Đang Dừng Chờ Linh Kiện / Chờ Khách' : 'Operational Blocker: Repairs Waiting for Parts or Approval'}
            description={
              language === 'vi'
                ? `Có ${totalBlocked} ca sửa chữa đang bị dừng lại. Vui lòng kiểm tra kho linh kiện hoặc liên hệ khách để tiếp tục xử lý.`
                : `There are ${totalBlocked} repair tickets currently blocked.`
            }
            count={totalBlocked}
            actionText={language === 'vi' ? 'Tra cứu kho linh kiện' : 'Check Parts Stock'}
            onActionClick={() => navigate('/products')}
            items={[
              ...blockedPartsTickets.slice(0, 2).map((t) => ({
                id: t.id,
                title: `${t.ticketCode || t.id.slice(0, 8)} — ${t.deviceModel || 'Thiết bị'}`,
                subtitle: `Lỗi: ${t.problemDescription || 'Chờ linh kiện thay thế'}`,
                badge: language === 'vi' ? 'Chờ linh kiện' : 'Waiting Parts',
                actionText: language === 'vi' ? 'Kiểm tra kho' : 'Stock Check',
                onAction: () => navigate('/products'),
              })),
              ...blockedApprovalTickets.slice(0, 2).map((t) => ({
                id: t.id,
                title: `${t.ticketCode || t.id.slice(0, 8)} — ${t.deviceModel || 'Thiết bị'}`,
                subtitle: `Khách: ${t.customerName || 'Khách lẻ'} • Đang chờ duyệt báo giá hoặc mật khẩu`,
                badge: language === 'vi' ? 'Chờ khách duyệt' : 'Waiting Customer',
                actionText: language === 'vi' ? 'Xem chi tiết' : 'View Detail',
                onAction: () => navigate(`/repairs?code=${t.ticketCode || ''}&ticketId=${t.id}`),
              })),
            ]}
          />
        </div>
      )}

      {/* 4. Core Work Queue: Workbench with Functional Tab Bar */}
      <div className="space-y-3">
        <div id="tour-tech-queues" className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-2">
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'myRepairs' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('myRepairs')}
              className="text-xs h-8 gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Ca Của Tôi' : 'My Repairs'}</span>
              <Badge variant={activeTab === 'myRepairs' ? 'outline' : 'primary'} className="text-[10px] ml-1">
                {repairStats?.myTasksCount ?? myAssignedTickets.length}
              </Badge>
            </Button>

            <Button
              variant={activeTab === 'intakeQueue' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('intakeQueue')}
              className="text-xs h-8 gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Hàng Đợi Tiếp Nhận Chi Nhánh' : 'Branch Intake Queue'}</span>
              <Badge variant={activeTab === 'intakeQueue' ? 'outline' : 'primary'} className="text-[10px] ml-1">
                {repairStats?.unassignedCount ?? intakeTickets.length}
              </Badge>
            </Button>

            <Button
              variant={activeTab === 'readyQueue' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('readyQueue')}
              className="text-xs h-8 gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Đã Xong Chờ Giao' : 'Ready for Pickup'}</span>
              <Badge variant={activeTab === 'readyQueue' ? 'outline' : 'primary'} className="text-[10px] ml-1">
                {repairStats?.completedCount ?? readyTickets.length}
              </Badge>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/repairs')}
            className="text-xs text-primary"
          >
            <span>{language === 'vi' ? 'Mở bảng Kanban sửa chữa' : 'Open Kanban Workbench'}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <div id="tour-tech-active-table">
          <WorkQueueTable<RepairTicketDto>
            title={
              activeTab === 'myRepairs'
                ? (language === 'vi' ? 'Ca Sửa Chữa Đang Xử Lý Của Tôi' : 'My Active Repair Tickets')
                : activeTab === 'intakeQueue'
                ? (language === 'vi' ? 'Hàng Đợi Máy Mới Vào Quầy Chờ Chẩn Đoán' : 'Branch Intake Queue')
                : (language === 'vi' ? 'Thiết Bị Đã Sửa Xong Chờ Kiểm Tra / Trả Khách' : 'Ready for QC & Customer Handover')
            }
            description={
              activeTab === 'myRepairs'
                ? (language === 'vi' ? 'Các thiết bị đang nằm trên bàn làm việc được gán cho bạn' : 'Tickets assigned directly to your bench')
                : activeTab === 'intakeQueue'
                ? (language === 'vi' ? 'Các thiết bị mới tiếp nhận cần kiểm tra tình trạng ban đầu' : 'Newly received branch devices awaiting initial triage')
                : (language === 'vi' ? 'Máy đã sửa xong, hoàn tất checklist để chuyển trả khách' : 'Repaired devices awaiting final sign-off')
            }
            icon={<Wrench className="w-4 h-4" />}
            iconColor="text-amber-500"
            data={displayedQueue}
            isLoading={isLoading}
            emptyMessage={
              activeTab === 'myRepairs'
                ? (language === 'vi' ? 'Bàn sửa chữa của bạn hiện không có ca nào đang xử lý.' : 'No active repairs on your workbench.')
                : activeTab === 'intakeQueue'
                ? (language === 'vi' ? 'Không có thiết bị mới chờ chẩn đoán.' : 'No incoming devices in the intake queue.')
                : (language === 'vi' ? 'Không có ca nào chờ bàn giao.' : 'No completed repairs awaiting pickup.')
            }
            actionText={language === 'vi' ? 'Mở bàn sửa chữa' : 'Open Workbench'}
            onActionClick={() => navigate(isSandboxMode ? '/repairs?mode=training' : '/repairs')}
            onRowClick={(t: RepairTicketDto) =>
              navigate(
                isSandboxMode
                  ? `/repairs?mode=training&code=${t.ticketCode || ''}&ticketId=${t.id}`
                  : `/repairs?code=${t.ticketCode || ''}&ticketId=${t.id}`
              )
            }
            columns={[
              {
                key: 'ticketCode',
                header: language === 'vi' ? 'Mã phiếu' : 'Ticket Code',
                render: (t) => (
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {t.ticketCode || (t as any).code || t.id.slice(0, 8)}
                  </span>
                ),
              },
              {
                key: 'deviceModel',
                header: language === 'vi' ? 'Thiết bị & Model' : 'Device Model',
                render: (t) => (
                  <div className="font-medium text-foreground">
                    <span>{t.deviceModel || 'Điện thoại'}</span>
                    {t.customerName && (
                      <span className="text-[11px] text-muted-foreground block truncate">
                        {t.customerName}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                key: 'problemDescription',
                header: language === 'vi' ? 'Mô tả lỗi' : 'Reported Fault',
                render: (t) => (
                  <span className="text-muted-foreground line-clamp-1 max-w-[200px]" title={t.problemDescription}>
                    {t.problemDescription || '—'}
                  </span>
                ),
              },
              {
                key: 'status',
                header: language === 'vi' ? 'Trạng thái' : 'Status',
                align: 'center',
                render: (t) => (
                  <Badge
                    variant={
                      t.status === 'Completed' || t.status === 'WaitingPickup'
                        ? 'success'
                        : t.status === 'WaitingForParts' || t.status === 'WaitingApproval'
                        ? 'danger'
                        : t.status === 'Repairing'
                        ? 'warning'
                        : 'primary'
                    }
                    className="text-[10px]"
                  >
                    {t.status === 'Received'
                      ? (language === 'vi' ? 'Tiếp nhận' : 'Received')
                      : t.status === 'Diagnosing'
                      ? (language === 'vi' ? 'Chẩn đoán' : 'Diagnosing')
                      : t.status === 'Repairing'
                      ? (language === 'vi' ? 'Đang sửa' : 'Repairing')
                      : t.status === 'WaitingForParts'
                      ? (language === 'vi' ? 'Chờ linh kiện' : 'Waiting Parts')
                      : t.status === 'WaitingApproval'
                      ? (language === 'vi' ? 'Chờ khách' : 'Waiting Client')
                      : t.status === 'Completed'
                      ? (language === 'vi' ? 'Đã sửa xong' : 'Completed')
                      : (t.status || '—')}
                  </Badge>
                ),
              },
              {
                key: 'action',
                header: language === 'vi' ? 'Thao tác' : 'Action',
                align: 'center',
                render: (t: RepairTicketDto) => {
                  const unassigned = isUnassignedTicket(t);
                  return (
                    <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {unassigned && (
                        <button
                          type="button"
                          disabled={assignTechnicianMutation.isPending}
                          onClick={async () => {
                            if (isSandboxMode) {
                              try {
                                repairSandboxService.claimTicket(
                                  t.id,
                                  user?.id || 'demo-tech-current',
                                  user?.fullName || 'KTV Thực Hành Demo'
                                );
                                toast.success(
                                  language === 'vi'
                                    ? 'Đã nhận việc thành công (Sandbox)!'
                                    : 'Ticket assigned to you (Sandbox)!',
                                  { icon: '🎯' }
                                );
                              } catch (err: any) {
                                toast.error(err.message || 'Lỗi nhận việc');
                              }
                              return;
                            }
                            try {
                              await assignTechnicianMutation.mutateAsync({ id: t.id, technicianId: user!.id });
                              toast.success(language === 'vi' ? 'Đã nhận việc thành công!' : 'Ticket assigned to you!');
                              refetch();
                              refetchStats();
                            } catch (err: any) {
                              toast.error(err?.response?.data?.message || (language === 'vi' ? 'Không thể nhận việc' : 'Failed to assign'));
                            }
                          }}
                          className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95"
                          title={language === 'vi' ? 'Tự ghi danh nhận xử lý ca này' : 'Self-assign ticket'}
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>{language === 'vi' ? 'Nhận việc' : 'Take'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            isSandboxMode
                              ? `/repairs?mode=training&code=${t.ticketCode || ''}&ticketId=${t.id}`
                              : `/repairs?code=${t.ticketCode || ''}&ticketId=${t.id}`
                          )
                        }
                        className="px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                        title={language === 'vi' ? 'Mở chi tiết ca sửa chữa' : 'Open repair ticket'}
                      >
                        <Wrench className="w-3 h-3" />
                        <span>{language === 'vi' ? 'Xử lý' : 'Work'}</span>
                      </button>
                    </div>
                  );
                },
              },
            ]}
          />
        </div>
      </div>

      {/* 5. Operational Launchers: Quick Actions Grid */}
      <QuickActions
        title={language === 'vi' ? 'Lối Tắt Nghiệp Vụ Kỹ Thuật' : 'Technician Operational Launchers'}
        description={language === 'vi' ? 'Truy cập nhanh vào các công cụ bàn sửa chữa' : 'One-click shortcuts to workbench tools'}
        actions={quickActionsList}
        columns={4}
      />

      {/* 6. Supporting Productivity Badges (Positioned at bottom, compact) */}
      <SupportingBadges
        title={language === 'vi' ? 'Tóm Tắt Khối Lượng Kỹ Thuật' : 'Workshop Workload Summary'}
        items={summaryBadges}
      />
    </div>
  );
};
