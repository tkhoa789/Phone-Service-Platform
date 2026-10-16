import React, { useState } from 'react';
import { 
  useRepairDetails, 
  useUpdateRepairStatus, 
  useAssignTechnician,
  useApproveRepair,
  useRejectRepair,
  useUseRepairPart,
  useReturnRepairPart
} from '../api/useRepairs';
import { SubmitDiagnosisModal } from './SubmitDiagnosisModal';
import { useAuthStore } from '@/stores/authStore';
import { useBranchStore } from '@/stores/branchStore';
import { useThemeStore } from '@/stores/themeStore';
import { useUsers } from '@/features/users/hooks/useUsers';
import { 
  X, Wrench, UserCheck, Smartphone, Calendar, DollarSign, 
  Package, ShieldCheck, CheckCircle2, AlertTriangle, Printer, 
  Clock, Edit3, Save, Phone, User, Tag, ChevronRight, 
  FileText, ArrowRight, UserPlus, Info, AlertCircle, RefreshCw,
  HelpCircle, ThumbsUp, ThumbsDown, Check, RotateCcw, Plus
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import toast from 'react-hot-toast';
import { operationalNotificationService } from '@/services/operationalNotificationService';
import type { RepairTicketDto, RepairTicketStatus, UserDto } from '@/types/api.types';
import { getValidTransitions, ALL_REPAIR_STATUSES } from '../utils/statusUtils';

interface Props {
  ticket: RepairTicketDto;
  onClose: () => void;
  onPrint?: (ticket: RepairTicketDto) => void;
  onOpenAddPart?: (ticket: RepairTicketDto) => void;
  onOpenChecklist?: (ticket: RepairTicketDto) => void;
  onOpenDeliver?: (ticket: RepairTicketDto) => void;
}

export const getRepairStatusBadgeVariant = (status: RepairTicketStatus): 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' => {
  switch (status) {
    case 'PendingAssignment':
      return 'warning';
    case 'Received':
      return 'info';
    case 'Diagnosing':
      return 'outline';
    case 'WaitingApproval':
    case 'WaitingForParts':
      return 'warning';
    case 'Repairing':
      return 'primary';
    case 'WaitingQC':
      return 'info';
    case 'Completed':
    case 'WaitingPickup':
    case 'Delivered':
      return 'success';
    case 'Cancelled':
      return 'danger';
    default:
      return 'default';
  }
};

export const getRepairStatusText = (status: RepairTicketStatus, language: 'vi' | 'en'): string => {
  const vi: Record<RepairTicketStatus, string> = {
    PendingAssignment: 'Chờ phân công',
    Received: 'Đã tiếp nhận',
    Diagnosing: 'Đang kiểm tra / Chẩn đoán',
    WaitingApproval: 'Chờ khách xác nhận',
    WaitingForParts: 'Chờ linh kiện',
    Repairing: 'Đang sửa chữa',
    WaitingQC: 'Chờ kiểm định QC',
    Completed: 'Hoàn thành sửa chữa',
    WaitingPickup: 'Chờ khách nhận máy',
    Delivered: 'Đã bàn giao máy',
    Cancelled: 'Đã hủy đơn',
  };
  const en: Record<RepairTicketStatus, string> = {
    PendingAssignment: 'Pending Assignment',
    Received: 'Received',
    Diagnosing: 'Diagnosing',
    WaitingApproval: 'Waiting Approval',
    WaitingForParts: 'Waiting For Parts',
    Repairing: 'Repairing',
    WaitingQC: 'Waiting QC',
    Completed: 'Completed',
    WaitingPickup: 'Ready for Pickup',
    Delivered: 'Delivered',
    Cancelled: 'Cancelled',
  };
  return (language === 'vi' ? vi[status] : en[status]) || status;
};

export const RepairDetailModal: React.FC<Props> = ({
  ticket: initialTicket,
  onClose,
  onPrint,
  onOpenAddPart,
  onOpenChecklist,
  onOpenDeliver,
}) => {
  const { language } = useThemeStore();
  const isVi = language === 'vi';
  const { user, hasRole, roles } = useAuthStore();
  const { activeBranchId } = useBranchStore();

  const isManagerOrAdmin = hasRole('Manager') || hasRole('Admin') || hasRole('Owner') || roles.includes('Manager') || roles.includes('Admin') || roles.includes('Owner');
  const isTechnician = hasRole('Technician') || roles.includes('Technician');
  const isSales = hasRole('Sales') || roles.includes('Sales');

  // Fetch live fresh ticket details
  const { data: ticket = initialTicket, refetch, isRefetching } = useRepairDetails(initialTicket.id);

  // Users for assignment (only loaded for managers/admins to avoid 403 for technicians)
  const effectiveBranchId = (activeBranchId && activeBranchId !== 'all') ? activeBranchId : ((ticket as any).branchId || user?.branchId);
  const { data: users = [] } = useUsers(effectiveBranchId, isManagerOrAdmin);
  const branchTechnicians = users.filter((u: UserDto) => {
    if (u.status !== 'Active') return false;
    const hasTechRole = u.roles?.some(r => r.toLowerCase().includes('tech') || r.toLowerCase().includes('technician'));
    return hasTechRole || u.roles?.length === 0;
  });

  const updateStatus = useUpdateRepairStatus();
  const assignTechnician = useAssignTechnician();
  const approveRepair = useApproveRepair();
  const rejectRepair = useRejectRepair();
  const useRepairPart = useUseRepairPart();
  const returnRepairPart = useReturnRepairPart();

  const [activeTab, setActiveTab] = useState<'overview' | 'techStatus' | 'partsCosts' | 'checklist' | 'timeline'>('overview');
  const [selectedTechId, setSelectedTechId] = useState<string>(ticket.technicianId || '');
  const [selectedNewStatus, setSelectedNewStatus] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [showDiagnosisModal, setShowDiagnosisModal] = useState<boolean>(false);
  const [showRejectPrompt, setShowRejectPrompt] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [partToReturn, setPartToReturn] = useState<any | null>(null);

  const formatCurrency = (val?: number) => {
    return (val || 0).toLocaleString('vi-VN') + ' ₫';
  };

  const isUnassigned = !ticket.technicianId || ticket.technicianId === '00000000-0000-0000-0000-000000000000' || ticket.status === 'PendingAssignment';
  const isSelfAssigned = Boolean(
    user?.id &&
    ticket.technicianId &&
    ticket.technicianId !== '00000000-0000-0000-0000-000000000000' &&
    ticket.technicianId.toLowerCase() === user.id.toLowerCase()
  );

  // Self-assign action
  const handleSelfAssign = () => {
    if (!user) return;
    assignTechnician.mutate(
      { id: ticket.id, technicianId: user.id },
      {
        onSuccess: () => {
          toast.success(isVi ? 'Bạn đã nhận xử lý phiếu này thành công!' : 'Ticket assigned to you!');
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || (isVi ? 'Không thể nhận phiếu' : 'Failed to assign'));
        }
      }
    );
  };

  // Delegate / Assign technician action (Manager/Admin)
  const handleAssignTechnician = () => {
    if (!selectedTechId) return;
    assignTechnician.mutate(
      { id: ticket.id, technicianId: selectedTechId },
      {
        onSuccess: () => {
          toast.success(isVi ? 'Đã điều phối kỹ thuật viên thành công!' : 'Technician assigned successfully!');
          operationalNotificationService.dispatchNotification({
            title: `🛠️ Phân công ca sửa chữa mới: ${ticket.code || ticket.ticketCode}`,
            content: `Quản lý đã điều phối phân công phụ trách ca sửa chữa ${ticket.code || ticket.ticketCode} (${ticket.customerName || ''} - ${ticket.productName || ticket.deviceModel || 'thiết bị'}). Vui lòng tiếp nhận máy và kiểm tra.`,
            type: 'REPAIR_ASSIGNED',
            targetRoles: ['Technician'],
            branchId: (ticket as any).branchId || user?.branchId,
            link: '/repairs?tab=MY_TICKETS',
          });
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || (isVi ? 'Không thể phân công kỹ thuật viên' : 'Failed to assign'));
        }
      }
    );
  };

  // Status transition action
  const handleStatusChange = () => {
    if (!selectedNewStatus) return;
    if (selectedNewStatus === 'Delivered' && onOpenDeliver) {
      onOpenDeliver(ticket);
      setSelectedNewStatus('');
      return;
    }
    updateStatus.mutate(
      {
        id: ticket.id,
        status: selectedNewStatus,
        note: statusNote.trim() || undefined,
        technicianId: ticket.technicianId,
      },
      {
        onSuccess: () => {
          toast.success(isVi ? `Đã chuyển trạng thái: ${getRepairStatusText(selectedNewStatus as RepairTicketStatus, language)}` : 'Status updated');
          
          // Khi ca sửa chữa hoàn tất -> Báo cho Sales/Thu ngân liên hệ khách nhận máy và thanh toán
          if (selectedNewStatus === 'Completed' || selectedNewStatus === 'WaitingPickup') {
            operationalNotificationService.dispatchNotification({
              title: `🔔 Ca sửa chữa đã hoàn thành: ${ticket.code || ticket.ticketCode}`,
              content: `Phiếu sửa chữa ${ticket.code || ticket.ticketCode} (${ticket.customerName || 'Khách hàng'}, ${ticket.productName || ticket.deviceModel || 'Thiết bị'}) đã sửa xong. Thu ngân/Sales liên hệ khách thanh toán số dư ${formatCurrency(balanceDue)} và bàn giao máy.`,
              type: 'REPAIR_COMPLETED',
              targetRoles: ['Sales', 'Manager'],
              branchId: (ticket as any).branchId || user?.branchId,
              link: '/repairs?status=Completed',
            });
          }

          setSelectedNewStatus('');
          setStatusNote('');
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || (isVi ? 'Không thể chuyển trạng thái' : 'Failed to update status'));
        }
      }
    );
  };

  // Calculate totals based on real cash flow: Labor + Parts (excluding returned) - Deposits = Balance Due
  const activeParts = (ticket.parts || []).filter(p => p.status !== 'Returned');
  const partsTotal = activeParts.reduce((acc, p) => acc + (p.totalPrice || ((p.quantity || 1) * (p.unitPrice || 0))), 0);
  const laborCost = ticket.laborCost || 0;
  const totalDeposit = (ticket.deposits || []).reduce((acc, d) => acc + (d.amount || 0), 0);
  const calculatedTotal = (ticket.actualCost && ticket.actualCost > 0)
    ? ticket.actualCost
    : (laborCost + partsTotal > 0 ? (laborCost + partsTotal) : (ticket.estimatedCost || ticket.totalAmount || 0));
  const totalCost = calculatedTotal;
  const balanceDue = Math.max(0, calculatedTotal - totalDeposit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-sans animate-in fade-in duration-200">
      <Card className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-card border border-border/60 shadow-2xl rounded-3xl overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-border/40 bg-card/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-heading font-bold text-foreground font-mono">
                  {ticket.code || ticket.ticketCode}
                </h2>
                <Badge 
                  variant={getRepairStatusBadgeVariant(ticket.status)}
                  className={`text-xs px-2.5 py-0.5 font-semibold ${
                    ticket.status === 'PendingAssignment' 
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 ring-1 ring-amber-500/30 animate-pulse' 
                      : ''
                  }`}
                >
                  {getRepairStatusText(ticket.status, language)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <span>{isVi ? 'Tiếp nhận lúc:' : 'Received:'} {new Date(ticket.receivedDate || ticket.createdAt).toLocaleString('vi-VN')}</span>
                {ticket.receivedByName && <span>• {isVi ? 'Bởi:' : 'By:'} {ticket.receivedByName}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {(ticket.status === 'Completed' || ticket.status === 'WaitingPickup') && onOpenDeliver && (
              <Button
                size="sm"
                onClick={() => onOpenDeliver(ticket)}
                className="h-9 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 rounded-xl shadow-md shadow-emerald-600/20"
                title={isVi ? 'Bàn giao thiết bị cho khách hàng & quyết toán' : 'Deliver device to customer'}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{isVi ? 'Bàn Giao Máy' : 'Deliver'}</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="neu-raised h-9 px-3 text-xs flex items-center gap-1.5"
              title={isVi ? 'Làm mới dữ liệu' : 'Refresh'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isVi ? 'Làm mới' : 'Refresh'}</span>
            </Button>

            {onPrint && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPrint(ticket)}
                className="neu-raised h-9 px-3 text-xs flex items-center gap-1.5 text-primary hover:text-primary"
                title={isVi ? 'In biên nhận K80' : 'Print K80'}
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isVi ? 'In K80' : 'Print K80'}</span>
              </Button>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-card border border-border/40 hover:bg-rose-500/10 hover:text-rose-500 flex items-center justify-center text-muted-foreground transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-border/30 bg-muted/20 overflow-x-auto">
          {[
            { id: 'overview', labelVi: 'Tổng Quan & Thiết Bị', labelEn: 'Overview & Device', icon: Smartphone },
            { id: 'techStatus', labelVi: 'Kỹ Thuật & Trạng Thái', labelEn: 'Tech & Status', icon: UserCheck },
            { id: 'partsCosts', labelVi: `Linh Kiện & Chi Phí (${activeParts.length})`, labelEn: `Parts & Costs (${activeParts.length})`, icon: DollarSign },
            { id: 'checklist', labelVi: 'Biên Bản QC 8 Điểm', labelEn: 'QC Checklist', icon: ShieldCheck },
            { id: 'timeline', labelVi: 'Lịch Sử Tiến Độ', labelEn: 'Timeline', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-card rounded-t-xl shadow-xs'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{isVi ? tab.labelVi : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: OVERVIEW & DEVICE */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Alert banner for PendingAssignment */}
              {isUnassigned && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                        {isVi ? 'Phiếu này chưa được phân công kỹ thuật viên!' : 'This ticket is not yet assigned!'}
                      </p>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                        {isVi ? 'Đang ở trạng thái Chờ phân công. Kỹ thuật viên có thể tự nhận việc hoặc Quản lý điều phối.' : 'In Pending Assignment status. Technician can self-assign or Manager can delegate.'}
                      </p>
                    </div>
                  </div>

                  {isTechnician && !isSelfAssigned && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSelfAssign}
                      disabled={assignTechnician.isPending}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 px-3 shrink-0"
                    >
                      <UserCheck className="w-3.5 h-3.5 mr-1" />
                      {isVi ? 'Nhận xử lý đơn này ngay' : 'Take Task Now'}
                    </Button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information Card */}
                <div className="p-5 rounded-2xl bg-card border border-border/40 neu-raised space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" />
                    {isVi ? 'Thông tin Khách hàng' : 'Customer Information'}
                  </h3>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-muted-foreground">{isVi ? 'Họ và tên:' : 'Full Name:'}</span>
                      <p className="font-bold text-sm text-foreground">{ticket.customerName || 'Khách vãng lai'}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground">{isVi ? 'Số điện thoại:' : 'Phone Number:'}</span>
                      {ticket.customerPhone ? (
                        <a
                          href={`tel:${ticket.customerPhone}`}
                          className="font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 hover:underline mt-0.5"
                          title={isVi ? 'Nhấn để gọi trực tiếp cho khách chủ máy' : 'Click to call customer'}
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{ticket.customerPhone}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-sans font-normal border border-emerald-500/20">
                            {isVi ? 'Gọi ngay' : 'Call'}
                          </span>
                        </a>
                      ) : (
                        <p className="font-mono font-semibold text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{isVi ? 'Chưa cung cấp' : 'Not provided'}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Device & Model Information Card */}
                <div className="p-5 rounded-2xl bg-card border border-border/40 neu-raised space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-500" />
                    {isVi ? 'Thiết bị & Nhận diện' : 'Device & Identification'}
                  </h3>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-muted-foreground">{isVi ? 'Dòng máy / Model:' : 'Model:'}</span>
                      <p className="font-bold text-sm text-foreground">
                        {ticket.customModelName || ticket.productName || ticket.deviceModel || 'Thiết bị di động'}
                      </p>
                      {ticket.customModelName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold inline-block mt-0.5">
                          {isVi ? 'Model tự nhập ngoài danh mục' : 'Custom unlisted model'}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground">IMEI / Serial:</span>
                      <p className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                        {ticket.imei || (ticket as any).serialImei || <span className="italic text-muted-foreground font-normal">Chưa có IMEI</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Problem Description & Exterior Condition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-card border border-border/40 neu-raised space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {isVi ? 'Hiện tượng Lỗi ban đầu' : 'Initial Fault Description'}
                  </h3>
                  <div className="p-3 rounded-xl bg-background/60 border border-border/30 text-xs text-foreground leading-relaxed min-h-[70px]">
                    {ticket.problemDescription || (isVi ? 'Chưa ghi nhận mô tả lỗi' : 'No description provided')}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/40 neu-raised space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-500" />
                    {isVi ? 'Tình trạng Ngoại quan Máy' : 'Cosmetic Condition'}
                  </h3>
                  <div className="p-3 rounded-xl bg-background/60 border border-border/30 text-xs text-muted-foreground leading-relaxed min-h-[70px]">
                    {ticket.exteriorCondition || (isVi ? 'Bình thường / Không có trầy xước đặc biệt' : 'Normal condition')}
                  </div>
                </div>
              </div>

              {/* Technical Diagnosis & Customer Approval Section */}
              {(ticket.diagnosisRootCause || ticket.status === 'Diagnosing' || ticket.status === 'WaitingApproval') && (
                <div className="p-5 rounded-2xl bg-card border border-indigo-500/30 neu-raised space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {isVi ? 'Biên Bản Chẩn Đoán Kỹ Thuật' : 'Technical Diagnostic & Solution'}
                    </h3>

                    <div className="flex items-center gap-2">
                      {ticket.diagnosedAt && (
                        <span className="text-[10.5px] text-muted-foreground font-mono">
                          {new Date(ticket.diagnosedAt).toLocaleString('vi-VN')}
                        </span>
                      )}
                      {onOpenAddPart && ['Diagnosing', 'Repairing', 'WaitingForParts'].includes(ticket.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenAddPart(ticket)}
                          className="h-8 text-xs font-bold px-3 text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/10 flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isVi ? 'Thêm linh kiện' : 'Add Part'}</span>
                        </Button>
                      )}
                      {ticket.status === 'Diagnosing' && isSelfAssigned && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setShowDiagnosisModal(true)}
                          className="h-8 text-xs font-bold px-3"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          {ticket.diagnosisRootCause ? (isVi ? 'Sửa chẩn đoán' : 'Edit Diagnosis') : (isVi ? 'Lập chẩn đoán ngay' : 'Submit Diagnosis')}
                        </Button>
                      )}
                    </div>
                  </div>

                  {ticket.diagnosisRootCause ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-background/60 border border-border/30 space-y-1">
                        <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {isVi ? 'Nguyên nhân hư hỏng phát hiện:' : 'Identified Root Cause:'}
                        </span>
                        <p className="text-xs text-foreground leading-relaxed font-medium">
                          {ticket.diagnosisRootCause}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-background/60 border border-border/30 space-y-1">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          {isVi ? 'Phương án kỹ thuật đề xuất:' : 'Proposed Technical Solution:'}
                        </span>
                        <p className="text-xs text-foreground leading-relaxed font-medium">
                          {ticket.diagnosisProposedSolution || (isVi ? 'Theo quy trình chuẩn' : 'Standard repair')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3">
                      <span>{isVi ? 'Máy đang trong giai đoạn chẩn đoán. Kỹ thuật viên phụ trách cần kiểm tra thực tế và nộp biên bản chẩn đoán.' : 'Device under diagnostic. Please inspect and submit diagnostic report.'}</span>
                      {isSelfAssigned && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setShowDiagnosisModal(true)}
                          className="h-8 text-xs shrink-0 font-bold"
                        >
                          {isVi ? 'Lập chẩn đoán' : 'Diagnose'}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Customer Approval Section Banner */}
                  {ticket.status === 'WaitingApproval' && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-5 h-5 text-amber-500 shrink-0" />
                          <div>
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block">
                              {isVi ? 'Đang chờ Khách hàng xác nhận báo giá / phương án sửa chữa' : 'Waiting for Customer Approval'}
                            </span>
                            <span className="text-[11px] text-amber-600 dark:text-amber-400">
                              {isVi ? 'Báo giá dự kiến:' : 'Quoted Amount:'} <strong className="font-mono">{formatCurrency(totalCost)}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Customer Approval Status Badge */}
                        <Badge variant="warning" className="text-xs font-bold self-start sm:self-auto">
                          {ticket.customerApprovalStatus === 'Approved' ? (isVi ? 'Đã duyệt' : 'Approved') :
                           ticket.customerApprovalStatus === 'Rejected' ? (isVi ? 'Từ chối' : 'Rejected') :
                           (isVi ? 'Chờ phản hồi' : 'Pending')}
                        </Badge>
                      </div>

                      {/* Approval Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={approveRepair.isPending}
                          onClick={() => {
                            approveRepair.mutate(
                              {
                                repairTicketId: ticket.id,
                                approvedAmount: totalCost,
                                approvalMethod: 'Điện thoại / Trực tiếp',
                                note: 'Khách hàng đồng ý phương án chẩn đoán và báo giá.',
                              },
                              {
                                onSuccess: () => {
                                  toast.success(isVi ? 'Khách đã phê duyệt sửa chữa! Đơn chuyển sang Đang sửa chữa.' : 'Customer approved!');
                                  operationalNotificationService.dispatchNotification({
                                    title: `⚡ Khách hàng ĐÃ DUYỆT báo giá: ${ticket.code || ticket.ticketCode}`,
                                    content: `Khách hàng ${ticket.customerName || ''} đã đồng ý phương án và báo giá ${formatCurrency(totalCost)}. KTV tiến hành xuất linh kiện và thực hiện sửa chữa ngay!`,
                                    type: 'REPAIR_APPROVED',
                                    targetRoles: ['Technician'],
                                    branchId: (ticket as any).branchId || user?.branchId,
                                    link: '/repairs?tab=MY_TICKETS',
                                  });
                                  refetch();
                                },
                                onError: (err: any) => {
                                  toast.error(err?.response?.data?.message || (isVi ? 'Không thể duyệt' : 'Failed to approve'));
                                },
                              }
                            );
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                          {isVi ? 'Khách đồng ý sửa (Tiến hành)' : 'Customer Approved'}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={rejectRepair.isPending}
                          onClick={() => setShowRejectPrompt(true)}
                          className="neu-raised text-rose-600 hover:bg-rose-500/10 font-bold text-xs h-8 px-3"
                        >
                          <ThumbsDown className="w-3.5 h-3.5 mr-1" />
                          {isVi ? 'Khách từ chối sửa' : 'Customer Rejected'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TECH & STATUS */}
          {activeTab === 'techStatus' && (
            <div className="space-y-6">
              {/* Technician Assignment Management Box */}
              <div className="p-5 rounded-2xl bg-card border border-border/40 neu-raised space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-500" />
                    {isVi ? 'Phân công Kỹ thuật viên phụ trách' : 'Assigned Technician'}
                  </h3>
                  {ticket.technicianName ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {ticket.technicianName}
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 border border-amber-500/30 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {isVi ? 'Chưa phân công' : 'Unassigned'}
                    </span>
                  )}
                </div>

                {/* Self assign button - Chỉ dành cho KTV độc lập, Quản lý không tự nhận đơn */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  {isTechnician && !isManagerOrAdmin && (
                    <Button
                      variant="outline"
                      onClick={handleSelfAssign}
                      disabled={isSelfAssigned || assignTechnician.isPending}
                      className={`h-10 text-xs font-bold flex items-center justify-center gap-2 ${
                        isSelfAssigned
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 cursor-default'
                          : 'neu-raised hover:neu-pressed text-foreground'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{isSelfAssigned ? (isVi ? '✓ Bạn đang phụ trách phiếu này' : '✓ You are assigned') : (isVi ? 'Tự ghi danh cho tôi (Tôi phụ trách)' : 'Assign to Me')}</span>
                    </Button>
                  )}

                  {/* Manager / Admin delegation dropdown */}
                  {isManagerOrAdmin && (
                    <div className="flex-1 flex items-center gap-2">
                      <select
                        value={selectedTechId}
                        onChange={(e) => setSelectedTechId(e.target.value)}
                        className="flex-1 h-10 neu-inset bg-background/50 border border-border/40 rounded-xl px-3 text-xs text-foreground focus:outline-none"
                      >
                        <option value="">{isVi ? '— Chọn kỹ thuật viên chi nhánh —' : '— Select branch technician —'}</option>
                        {branchTechnicians.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName} ({t.username})
                          </option>
                        ))}
                      </select>

                      <Button
                        variant="primary"
                        onClick={handleAssignTechnician}
                        disabled={!selectedTechId || selectedTechId.toLowerCase() === (ticket.technicianId || '').toLowerCase() || assignTechnician.isPending}
                        className="h-10 px-4 text-xs font-bold shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                        {isVi ? 'Giao việc' : 'Assign'}
                      </Button>
                    </div>
                  )}
                </div>

                {!isManagerOrAdmin && !isTechnician && (
                  <p className="text-[11px] text-muted-foreground italic">
                    {isVi ? '* Bạn không có thẩm quyền điều phối công việc cho kỹ thuật viên.' : '* You do not have permission to delegate technicians.'}
                  </p>
                )}
              </div>

              {/* Ready for pickup banner */}
              {ticket.status === 'WaitingPickup' && onOpenDeliver && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {isVi ? 'Thiết bị đã hoàn tất, đang chờ khách đến nhận máy' : 'Device ready for customer pickup'}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {isVi ? 'Nhấn Bàn Giao để quyết toán chi phí, xác nhận người nhận và in phiếu bảo hành.' : 'Click Deliver to settle payments, confirm receiver, and print receipt.'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => onOpenDeliver(ticket)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 rounded-xl shadow-md shrink-0"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{isVi ? 'Bàn Giao Cho Khách' : 'Deliver Device'}</span>
                  </Button>
                </div>
              )}

              {/* Status Transition Management Box */}
              {(() => {
                const validTransitions = getValidTransitions(ticket.status);
                if (!isTechnician && !isManagerOrAdmin) {
                  return (
                    <div className="p-5 rounded-2xl bg-card border border-border/40 neu-raised space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <Info className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>
                          {isVi
                            ? 'Quyền hạn chuyển bước kỹ thuật thuộc về Kỹ thuật viên phụ trách hoặc Quản lý chi nhánh.'
                            : 'Status transition controls are restricted to Technicians and Managers.'}
                        </span>
                      </div>
                    </div>
                  );
                }

                const isTerminal = validTransitions.length === 0;

                return (
                  <div className="p-5 rounded-2xl bg-card border border-border/40 neu-raised space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-primary" />
                        {isVi ? 'Chuyển đổi Trạng thái Sửa chữa' : 'Update Status'}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {isVi ? 'Tuân thủ State Machine' : 'State Machine Protected'}
                      </span>
                    </div>

                    {isTerminal ? (
                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/30 text-xs text-muted-foreground flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>
                          {isVi 
                            ? `Phiếu sửa chữa đang ở trạng thái kết thúc (${getRepairStatusText(ticket.status, language)}). Quy trình kỹ thuật đã đóng hoàn toàn.`
                            : `Ticket is in a terminal state (${getRepairStatusText(ticket.status, language)}). No further transitions allowed.`}
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Quick One-Click Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-border/30">
                          <span className="text-[11px] font-semibold text-muted-foreground">{isVi ? 'Chuyển nhanh:' : 'Quick Next:'}</span>
                          {validTransitions.map((ts) => (
                            <button
                              key={ts}
                              type="button"
                              disabled={updateStatus.isPending}
                              onClick={() => {
                                if (ts === 'Delivered' && onOpenDeliver) {
                                  onOpenDeliver(ticket);
                                  return;
                                }
                                updateStatus.mutate(
                                  { id: ticket.id, status: ts, technicianId: ticket.technicianId },
                                  {
                                    onSuccess: () => {
                                      toast.success(isVi ? `Đã chuyển sang: ${getRepairStatusText(ts, language)}` : 'Status updated');
                                      refetch();
                                    },
                                    onError: (err: any) => {
                                      toast.error(err?.response?.data?.message || (isVi ? 'Không thể chuyển trạng thái' : 'Failed to update status'));
                                    }
                                  }
                                );
                              }}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                                ts === 'Delivered'
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                  : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30'
                              }`}
                            >
                              {ts === 'Delivered' ? <UserCheck className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                              <span>{ts === 'Delivered' ? (isVi ? 'Bàn giao cho khách' : 'Deliver') : getRepairStatusText(ts, language)}</span>
                            </button>
                          ))}
                          {onOpenAddPart && ['Diagnosing', 'Repairing', 'WaitingForParts'].includes(ticket.status) && (
                            <button
                              type="button"
                              onClick={() => onOpenAddPart(ticket)}
                              className="px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-all cursor-pointer active:scale-95 ml-auto"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{isVi ? '+ Thêm linh kiện từ kho' : '+ Add Part'}</span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] text-muted-foreground block mb-1">
                              {isVi ? 'Hoặc chọn trạng thái hợp lệ:' : 'Or Select Valid Status:'}
                            </label>
                            <select
                              value={selectedNewStatus}
                              onChange={(e) => setSelectedNewStatus(e.target.value)}
                              className="w-full h-10 neu-inset bg-background/50 border border-border/40 rounded-xl px-3 text-xs text-foreground focus:outline-none"
                            >
                              <option value="">{isVi ? '— Chọn trạng thái mới —' : '— Select new status —'}</option>
                              {validTransitions.length > 0 && (
                                <optgroup label={isVi ? '── Chuyển tiếp hợp lệ ──' : '── Valid Transitions ──'}>
                                  {validTransitions.map((s) => (
                                    <option key={s} value={s}>
                                      {getRepairStatusText(s, language)}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              <optgroup label={isVi ? '── Không hợp lệ (Hệ thống chặn 409) ──' : '── Blocked by State Machine ──'}>
                                {ALL_REPAIR_STATUSES.filter(s => s !== ticket.status && !validTransitions.includes(s)).map((s) => (
                                  <option key={s} value={s} disabled>
                                    {getRepairStatusText(s, language)} ({isVi ? 'Không hợp lệ' : 'Blocked'})
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] text-muted-foreground block mb-1">
                              {isVi ? 'Ghi chú chuyển trạng thái (Tùy chọn):' : 'Status Note (Optional):'}
                            </label>
                            <Input
                              type="text"
                              value={statusNote}
                              onChange={(e) => setStatusNote(e.target.value)}
                              placeholder={isVi ? 'Nhập ghi chú hoặc lý do...' : 'Enter note...'}
                              className="h-10 text-xs neu-inset bg-background/50"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <Button
                            variant="primary"
                            onClick={handleStatusChange}
                            disabled={!selectedNewStatus || updateStatus.isPending}
                            className="h-9 px-5 text-xs font-bold"
                          >
                            <Save className="w-3.5 h-3.5 mr-1" />
                            {isVi ? 'Cập nhật trạng thái' : 'Update Status'}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: PARTS & COSTS */}
          {activeTab === 'partsCosts' && (
            <div className="space-y-6">
              {/* Financial Summary Cards - Dòng tiền thực tế */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-2xl bg-card border border-border/40 neu-inset text-center">
                  <span className="text-[10.5px] text-muted-foreground font-semibold block">{isVi ? 'Báo giá dự kiến' : 'Estimated'}</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-foreground mt-0.5 block">
                    {formatCurrency(ticket.estimatedCost)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-border/40 neu-inset text-center">
                  <span className="text-[10.5px] text-muted-foreground font-semibold block">{isVi ? 'Tiền công thợ' : 'Labor Cost'}</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-indigo-500 mt-0.5 block">
                    {formatCurrency(laborCost)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-border/40 neu-inset text-center">
                  <span className="text-[10.5px] text-muted-foreground font-semibold block">
                    {isVi ? `Linh kiện (${activeParts.length})` : `Parts (${activeParts.length})`}
                  </span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-amber-500 mt-0.5 block">
                    {formatCurrency(partsTotal)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-indigo-500/30 neu-inset text-center bg-indigo-500/5">
                  <span className="text-[10.5px] text-indigo-600 dark:text-indigo-400 font-bold block">{isVi ? 'Tổng chi phí thực tế' : 'Actual Total'}</span>
                  <span className="text-xs sm:text-sm font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                    {formatCurrency(calculatedTotal)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-border/40 neu-inset text-center">
                  <span className="text-[10.5px] text-muted-foreground font-semibold block">{isVi ? 'Đã đặt cọc' : 'Deposited'}</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-0.5 block">
                    {formatCurrency(totalDeposit)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-emerald-500/30 neu-inset text-center bg-emerald-500/5">
                  <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold block">{isVi ? 'Còn lại phải thu' : 'Balance Due'}</span>
                  <span className="text-xs sm:text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>

              {/* Replacement Parts Table */}
              <div className="p-5 rounded-2xl bg-card border border-border/40 neu-raised space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {isVi ? 'Linh kiện thay thế xuất kho' : 'Issued Replacement Parts'}
                    </h3>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({activeParts.length} {isVi ? 'linh kiện tính tiền' : 'active'})
                    </span>
                  </div>

                  {(isTechnician || isManagerOrAdmin) && onOpenAddPart && ['Diagnosing', 'Repairing', 'WaitingForParts'].includes(ticket.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenAddPart(ticket)}
                      className="neu-raised h-8 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isVi ? 'Xuất thêm linh kiện' : 'Issue Part'}</span>
                    </Button>
                  )}
                </div>

                {(!ticket.parts || ticket.parts.length === 0) ? (
                  <div className="p-8 text-center bg-muted/10 rounded-2xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Package className="w-7 h-7" />
                    </div>
                    <div className="max-w-md">
                      <p className="text-sm font-bold text-foreground">
                        {isVi ? 'Chưa xuất linh kiện thay thế nào cho phiếu này' : 'No replacement parts issued yet'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isVi ? 'Nếu ca sửa chữa này cần sử dụng linh kiện từ kho (màn hình, pin, camera...), bấm nút to bên dưới để chọn xuất kho:' : 'If this repair requires replacement parts from stock, click below to issue:'}
                      </p>
                    </div>
                    {(isTechnician || isManagerOrAdmin) && onOpenAddPart && ['Diagnosing', 'Repairing', 'WaitingForParts'].includes(ticket.status) && (
                      <Button
                        size="lg"
                        onClick={() => onOpenAddPart(ticket)}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 mt-1 cursor-pointer transition-transform transform hover:scale-105 active:scale-95"
                      >
                        <span className="text-xl leading-none font-black">+</span>
                        <span>{isVi ? 'THÊM LINH KIỆN TỪ KHO' : 'ADD REPLACEMENT PART'}</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-border/40 text-muted-foreground font-semibold text-[11px]">
                          <th className="py-2.5 px-3">{isVi ? 'Linh kiện' : 'Part Name'}</th>
                          <th className="py-2.5 px-3 text-center">{isVi ? 'Số lượng' : 'Qty'}</th>
                          <th className="py-2.5 px-3 text-right">{isVi ? 'Đơn giá' : 'Unit Price'}</th>
                          <th className="py-2.5 px-3 text-right">{isVi ? 'Thành tiền' : 'Subtotal'}</th>
                          <th className="py-2.5 px-3 text-center">{isVi ? 'Trạng thái' : 'Status'}</th>
                          <th className="py-2.5 px-3 text-right">{isVi ? 'Thao tác' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20 font-mono">
                        {ticket.parts.map((p) => {
                          const isReturned = p.status === 'Returned';
                          return (
                            <tr key={p.id} className={isReturned ? 'opacity-50 line-through bg-muted/5' : ''}>
                              <td className="py-2.5 px-3 font-sans">
                                <p className="font-semibold text-foreground text-xs">{p.productName || 'Linh kiện'}</p>
                                <span className="text-[10px] text-muted-foreground font-mono">{p.productSku}</span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-foreground">{p.quantity}</td>
                              <td className="py-2.5 px-3 text-right">{formatCurrency(p.unitPrice)}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-amber-600 dark:text-amber-400">
                                {formatCurrency(p.totalPrice || ((p.quantity || 1) * (p.unitPrice || 0)))}
                              </td>
                              <td className="py-2.5 px-3 text-center font-sans">
                                <Badge 
                                  variant={
                                    p.status === 'Installed' ? 'success' :
                                    p.status === 'Issued' ? 'primary' :
                                    p.status === 'Reserved' ? 'warning' : 'outline'
                                  } 
                                  className="text-[10px]"
                                >
                                  {p.status === 'Installed' ? (isVi ? 'Đã lắp ráp' : 'Installed') :
                                   p.status === 'Issued' ? (isVi ? 'Đã xuất kho' : 'Issued') :
                                   p.status === 'Reserved' ? (isVi ? 'Chờ xuất kho' : 'Reserved') :
                                   p.status === 'Returned' ? (isVi ? 'Đã hoàn kho' : 'Returned') :
                                   (p.status || (isVi ? 'Đã xuất kho' : 'Issued'))}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3 text-right font-sans">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {/* Action: Install part */}
                                  {!isReturned && p.status !== 'Installed' && ticket.status === 'Repairing' && isSelfAssigned && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={useRepairPart.isPending}
                                      onClick={() => {
                                        useRepairPart.mutate({
                                          repairTicketId: ticket.id,
                                          repairPartId: p.id,
                                          rowVersion: p.rowVersion,
                                        }, {
                                          onSuccess: () => {
                                            toast.success(isVi ? `Đã xác nhận lắp linh kiện ${p.productName || ''} vào máy!` : 'Part marked as installed!');
                                            refetch();
                                          },
                                          onError: (err: any) => {
                                            toast.error(err?.response?.data?.message || (isVi ? 'Không thể lắp linh kiện' : 'Failed to mark installed'));
                                          }
                                        });
                                      }}
                                      className="h-6 px-2 text-[10px] font-bold neu-raised text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                                      title={isVi ? 'Đánh dấu đã lắp ráp linh kiện này vào máy' : 'Mark installed'}
                                    >
                                      <Wrench className="w-2.5 h-2.5 mr-1" />
                                      <span>{isVi ? 'Lắp ráp' : 'Install'}</span>
                                    </Button>
                                  )}

                                  {/* Action: Return / Remove part (whether installed, issued or reserved) */}
                                  {(isTechnician || isManagerOrAdmin) && !isReturned && !['Completed', 'Delivered', 'Cancelled'].includes(ticket.status) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={returnRepairPart.isPending}
                                      onClick={() => setPartToReturn(p)}
                                      className="h-6 px-2 text-[10px] font-bold neu-raised text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                      title={isVi ? 'Gỡ bỏ linh kiện này (dù đã lắp ráp hay chưa) và hoàn trả lại vào tồn kho' : 'Remove part and return to inventory'}
                                    >
                                      <RotateCcw className="w-2.5 h-2.5 mr-1" />
                                      <span>{isVi ? 'Gỡ linh kiện' : 'Remove'}</span>
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Deposit History */}
              {ticket.deposits && ticket.deposits.length > 0 && (
                <div className="p-5 rounded-2xl bg-card border border-border/40 neu-raised space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    {isVi ? 'Lịch sử Thu tiền đặt cọc' : 'Deposit Transactions'}
                  </h3>

                  <div className="space-y-2">
                    {ticket.deposits.map((d) => (
                      <div key={d.id} className="p-3 rounded-xl bg-background/50 border border-border/30 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(d.amount)}</p>
                          <p className="text-[10.5px] text-muted-foreground">{d.paidAt ? new Date(d.paidAt).toLocaleString('vi-VN') : ''}</p>
                        </div>
                        <Badge variant="outline" className="text-[11px]">
                          {d.paymentMethodName || 'Tiền mặt'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: QC CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-card border border-border/40 neu-raised space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    {isVi ? 'Biên bản Thẩm định QC 8 Điểm' : '8-Point QC Checklist'}
                  </h3>

                  {onOpenChecklist && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenChecklist(ticket)}
                      className="neu-raised h-8 text-xs font-bold text-purple-600 dark:text-purple-400"
                    >
                      {isVi ? 'Mở cửa sổ QC đầy đủ' : 'Open Full QC'}
                    </Button>
                  )}
                </div>

                {(!ticket.checklists || ticket.checklists.length === 0) ? (
                  <div className="p-8 text-center text-muted-foreground text-xs italic bg-muted/10 rounded-xl">
                    {isVi ? 'Chưa có biên bản kiểm tra tình trạng máy nào được lưu.' : 'No checklist recorded.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ticket.checklists.map((chk, idx) => (
                      <div key={chk.id || idx} className="p-4 rounded-xl bg-background/50 border border-border/30 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            {chk.type === 'CheckIn' ? (isVi ? 'Biên bản Tiếp nhận (Check-in)' : 'Check-in QC') : (isVi ? 'Biên bản Hoàn thành (Check-out)' : 'Check-out QC')}
                          </span>
                          <span className="text-muted-foreground font-mono text-[11px]">{new Date(chk.createdAt).toLocaleString('vi-VN')}</span>
                        </div>

                        {chk.items && chk.items.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                            {chk.items.map((item, itemIdx) => (
                              <div
                                key={itemIdx}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                  item.isPassed
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                                }`}
                              >
                                <span className="font-medium truncate">{item.checkPointName || (item as any).itemName || 'Hạng mục'}</span>
                                <span className="font-bold text-[10px] ml-1 shrink-0">
                                  {item.isPassed ? (isVi ? '✓ Đạt' : '✓ Pass') : (isVi ? '✗ Lỗi' : '✗ Fail')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {chk.notes && (
                          <p className="text-xs text-muted-foreground bg-card/60 p-2.5 rounded-lg border border-border/20 italic">
                            {chk.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: TIMELINE HISTORY */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-card border border-border/40 neu-raised space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  {isVi ? 'Nhật ký Lịch sử Chuyển trạng thái' : 'Status Transition Audit Trail'}
                </h3>

                {(!ticket.statusHistories || ticket.statusHistories.length === 0) ? (
                  <div className="p-6 text-center text-muted-foreground text-xs italic bg-muted/10 rounded-xl">
                    {isVi ? 'Chưa có lịch sử trạng thái.' : 'No status history recorded.'}
                  </div>
                ) : (
                  <div className="relative border-l-2 border-border/60 ml-4 pl-5 space-y-5 py-2">
                    {ticket.statusHistories.map((h, i) => (
                      <div key={h.id || i} className="relative">
                        <div className="absolute -left-[27px] top-0.5 w-4 h-4 rounded-full bg-indigo-500 border-2 border-background" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-bold text-foreground">
                            {getRepairStatusText(h.status as RepairTicketStatus, language)}
                          </span>
                          <span className="text-[10.5px] font-mono text-muted-foreground">
                            {new Date(h.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        {h.note && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed bg-background/50 p-2 rounded-lg border border-border/30">
                            {h.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-border/40 bg-card/80 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500 hidden sm:inline" />
            <span>{isVi ? 'Bấm In K80 hoặc Esc để đóng cửa sổ' : 'Press Print K80 or Esc to close'}</span>
          </div>

          <div className="flex items-center gap-2">
            {onPrint && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPrint(ticket)}
                className="neu-raised text-xs font-bold text-primary flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isVi ? 'In biên nhận K80' : 'Print Receipt'}</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="neu-raised text-xs font-semibold"
            >
              {isVi ? 'Đóng' : 'Close'}
            </Button>
          </div>
        </div>

      </Card>

      {/* Submit Diagnosis Modal */}
      {showDiagnosisModal && (
        <SubmitDiagnosisModal
          ticket={ticket}
          onClose={() => setShowDiagnosisModal(false)}
          onSuccess={() => {
            setShowDiagnosisModal(false);
            refetch();
          }}
        />
      )}

      {/* Reject Repair Dialog */}
      {showRejectPrompt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md p-5 bg-card border border-border/60 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>{isVi ? 'Xác Nhận Khách Từ Chối Sửa' : 'Confirm Customer Rejection'}</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {isVi 
                ? 'Khi khách hàng từ chối phương án sửa chữa, phiếu sẽ được chuyển sang trạng thái Đã hủy (Cancelled). Các linh kiện đã xuất (nếu có) sẽ được hoàn trả về kho.'
                : 'Ticket will transition to Cancelled status. Any reserved parts will be released.'}
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                {isVi ? 'Lý do từ chối (Tùy chọn):' : 'Rejection Reason (Optional):'}
              </label>
              <Input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={isVi ? 'Ví dụ: Giá quá cao, khách đổi ý mua máy mới...' : 'E.g. Cost too high...'}
                className="h-9 text-xs neu-inset bg-background/50"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRejectPrompt(false)}
                disabled={rejectRepair.isPending}
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={rejectRepair.isPending}
                onClick={() => {
                  rejectRepair.mutate(
                    {
                      repairTicketId: ticket.id,
                      reason: rejectReason.trim() || undefined,
                    },
                    {
                      onSuccess: () => {
                        toast.success(isVi ? 'Đã ghi nhận khách từ chối sửa máy.' : 'Recorded rejection.');
                        setShowRejectPrompt(false);
                        refetch();
                      },
                      onError: (err: any) => {
                        toast.error(err?.response?.data?.message || (isVi ? 'Không thể cập nhật' : 'Failed to reject'));
                      }
                    }
                  );
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                {rejectRepair.isPending ? (isVi ? 'Đang xử lý...' : 'Processing...') : (isVi ? 'Xác nhận hủy đơn' : 'Confirm Reject')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* In-app Confirmation Modal for Returning/Removing Part (Red confirm button, replaces window.confirm) */}
      {partToReturn && (
        <Dialog
          open={Boolean(partToReturn)}
          onOpenChange={(open) => { if (!open) setPartToReturn(null); }}
          title={isVi ? 'Xác nhận gỡ bỏ linh kiện' : 'Confirm Part Removal'}
          description={isVi ? 'Thực hiện thu hồi linh kiện và hoàn trả lại kho vật lý' : 'Return part back to warehouse inventory'}
          className="max-w-md"
        >
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-700 dark:text-rose-400">
                  {isVi ? 'Bạn có chắc chắn muốn gỡ bỏ linh kiện này?' : 'Are you sure you want to remove this part?'}
                </p>
                <p className="text-muted-foreground">
                  {isVi
                    ? `Linh kiện "${partToReturn.productName || 'này'}" (SL: ${partToReturn.quantity || 1}) sẽ được thu hồi và hoàn trả lại vào tồn kho của chi nhánh. Chi phí linh kiện sẽ tự động được khấu trừ khỏi phiếu sửa chữa.`
                    : `Part "${partToReturn.productName || 'this'}" (Qty: ${partToReturn.quantity || 1}) will be returned to branch inventory. Cost will be deducted from repair ticket.`}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isVi ? 'Trạng thái linh kiện:' : 'Part status:'}</span>
                <span className="font-bold text-foreground">{partToReturn.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isVi ? 'Đơn giá hoàn trừ:' : 'Refunded price:'}</span>
                <span className="font-bold text-emerald-600">{formatCurrency(partToReturn.unitPrice)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setPartToReturn(null)}
                disabled={returnRepairPart.isPending}
                className="px-4 text-xs font-semibold cursor-pointer"
              >
                {isVi ? 'Hủy bỏ' : 'Cancel'}
              </Button>
              <Button
                disabled={returnRepairPart.isPending}
                onClick={() => {
                  if (!partToReturn) return;
                  returnRepairPart.mutate({
                    repairTicketId: ticket.id,
                    repairPartId: partToReturn.id,
                    rowVersion: partToReturn.rowVersion,
                  }, {
                    onSuccess: () => {
                      toast.success(isVi ? `Đã gỡ bỏ linh kiện "${partToReturn.productName || ''}" và hoàn trả về kho!` : 'Part returned to stock!');
                      setPartToReturn(null);
                      refetch();
                    },
                    onError: (err: any) => {
                      toast.error(err?.response?.data?.message || (isVi ? 'Không thể gỡ bỏ linh kiện' : 'Failed to return part'));
                    }
                  });
                }}
                className="px-4 text-xs font-bold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white border border-rose-600 shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${returnRepairPart.isPending ? 'animate-spin' : ''}`} />
                <span>{returnRepairPart.isPending ? (isVi ? 'Đang hoàn kho...' : 'Returning...') : (isVi ? 'Xác nhận gỡ bỏ' : 'Accept / Confirm')}</span>
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
