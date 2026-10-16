import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../../stores/authStore';
import { useBranchStore } from '../../../../stores/branchStore';
import { useThemeStore } from '../../../../stores/themeStore';
import { serviceService } from '../../../../services/serviceService';
import { warrantyTrainingService } from '../../../../services/warrantyTrainingService';
import { exitSandboxMode } from '../../../../utils/sandboxUtils';
import toast from 'react-hot-toast';
import { PageHeader } from '../../../../components/shared/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Input } from '../../../../components/ui/Input';
import { WorkQueueTable } from '../widgets/WorkQueueTable';
import { QuickActions } from '../widgets/QuickActions';
import type { QuickActionItem } from '../widgets/QuickActions';
import { ExceptionPanel } from '../widgets/ExceptionPanel';
import { SupportingBadges } from '../widgets/SupportingBadges';
import type { SupportingBadgeItem } from '../widgets/SupportingBadges';
import { 
  ShieldCheck, Smartphone, Receipt, Users, Clock, 
  Store, Search, Check, XCircle, RefreshCw, 
  ArrowRight, AlertCircle, CheckCircle2, Sparkles, LogOut
} from 'lucide-react';
import type { WarrantyTicketDto, WarrantyCheckResultDto } from '../../../../types/api.types';

export const WarrantyDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { activeBranchId, activeBranchName } = useBranchStore();
  const { language } = useThemeStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSandboxMode = searchParams.get('mode') === 'training';

  // IMEI quick checker state
  const [imeiQuery, setImeiQuery] = useState('');
  const [checkingImei, setCheckingImei] = useState(false);
  const [imeiResult, setImeiResult] = useState<WarrantyCheckResultDto | null>(null);
  const [imeiError, setImeiError] = useState<string | null>(null);
  const imeiInputRef = useRef<HTMLInputElement>(null);

  // Query branch warranty tickets (fallback to warrantyTrainingService in Sandbox)
  const { 
    data: warrantiesData, 
    isLoading, 
    isError,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['warranties', 'dashboard-queue', activeBranchId, isSandboxMode],
    queryFn: () => isSandboxMode ? warrantyTrainingService.getWarranties({ pageSize: 50 }) : serviceService.getWarranties({ pageSize: 50 }),
    staleTime: isSandboxMode ? 0 : 30 * 1000,
  });

  const allTickets = warrantiesData?.items || [];

  // Work Queues:
  // 1. Active RMA Claims: Both 'Received' (awaiting inspection) and 'Processing' (in-progress RMA)
  const activeClaims = allTickets.filter((w) => w.status === 'Received' || w.status === 'Processing');
  const awaitingAssessment = allTickets.filter((w) => w.status === 'Received');
  const awaitingCount = awaitingAssessment.length;

  // 2. Ready for Handover: Replaced or repaired devices ready for customer pickup
  const readyForHandover = allTickets.filter((w) => w.status === 'Completed');
  const readyCount = readyForHandover.length;

  // 3. In-progress RMA (with OEM or repair lab)
  const processingCount = allTickets.filter((w) => w.status === 'Processing').length;

  // 4. Disputed / Rejected claims requiring explanation notes
  const rejectedClaims = allTickets.filter((w) => w.status === 'Rejected');

  const handleCheckImei = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imeiQuery.trim()) return;

    setCheckingImei(true);
    setImeiError(null);
    setImeiResult(null);

    try {
      const res = await serviceService.checkWarrantyStatus(imeiQuery.trim());
      setImeiResult(res);
    } catch (err: any) {
      setImeiError(
        err?.response?.data?.message || 
        (language === 'vi' ? 'Không tìm thấy thông tin bảo hành cho IMEI này.' : 'No warranty record found for this IMEI.')
      );
    } finally {
      setCheckingImei(false);
    }
  };

  const focusImeiInput = () => {
    imeiInputRef.current?.focus();
    imeiInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const quickActionsList: QuickActionItem[] = [
    {
      title: language === 'vi' ? 'Quản Lý Hồ Sơ Bảo Hành' : 'Warranty Tickets',
      description: language === 'vi' ? 'Tiếp nhận yêu cầu RMA, thẩm định chính sách bảo hành chính hãng và phân loại lỗi.' : 'Process RMA claims and evaluate warranty policies.',
      icon: <ShieldCheck className="w-5 h-5" />,
      iconColor: 'text-emerald-500',
      badge: language === 'vi' ? 'Chính' : 'Primary',
      onClick: () => navigate('/warranties'),
    },
    {
      title: language === 'vi' ? 'Tra Cứu Lịch Sử Serial / IMEI' : 'IMEI / Serial History',
      description: language === 'vi' ? 'Kiểm tra trạng thái kích hoạt, thời hạn bảo hành còn lại và lịch sử sửa chữa thiết bị.' : 'Check warranty validity and repair history.',
      icon: <Search className="w-5 h-5" />,
      iconColor: 'text-blue-500',
      onClick: focusImeiInput,
    },
    {
      title: language === 'vi' ? 'Đối Chiếu Hóa Đơn Gốc' : 'Original Sales Receipt',
      description: language === 'vi' ? 'Đối soát đơn hàng gốc tại chuỗi cửa hàng khi khách làm mất phiếu bảo hành giấy.' : 'Audit sales invoice and date of purchase.',
      icon: <Receipt className="w-5 h-5" />,
      iconColor: 'text-purple-500',
      onClick: () => navigate('/sales'),
    },
    {
      title: language === 'vi' ? 'Hồ Sơ Khách Hàng Bảo Hành' : 'Warranty Customers',
      description: language === 'vi' ? 'Tra cứu thông tin liên lạc khách hàng để báo nhận máy hoặc giải thích từ chối.' : 'Customer directory and contact details.',
      icon: <Users className="w-5 h-5" />,
      iconColor: 'text-rose-500',
      onClick: () => navigate('/customers'),
    },
  ];

  // Supporting compact badges (placed at bottom)
  const summaryBadges: SupportingBadgeItem[] = [
    {
      id: 'awaiting-assessment',
      label: language === 'vi' ? 'Chờ Thẩm Định Gốc' : 'Awaiting Assessment',
      value: awaitingCount,
      unit: language === 'vi' ? 'hồ sơ' : 'claims',
      icon: <Clock className="w-4 h-4" />,
      iconColor: 'text-amber-500',
      variant: awaitingCount > 0 ? 'warning' : 'default',
      onClick: () => navigate('/warranties?status=Received'),
    },
    {
      id: 'in-progress-rma',
      label: language === 'vi' ? 'Đang Xử Lý RMA' : 'In-Progress RMA',
      value: processingCount,
      unit: language === 'vi' ? 'hồ sơ' : 'claims',
      icon: <Smartphone className="w-4 h-4" />,
      iconColor: 'text-blue-500',
      variant: 'info',
      onClick: () => navigate('/warranties?status=Processing'),
    },
    {
      id: 'ready-handover',
      label: language === 'vi' ? 'Sẵn Sàng Bàn Giao' : 'Ready for Handover',
      value: readyCount,
      unit: language === 'vi' ? 'thiết bị' : 'devices',
      icon: <CheckCircle2 className="w-4 h-4" />,
      iconColor: 'text-emerald-500',
      variant: 'success',
      onClick: () => navigate('/warranties?status=Completed'),
    },
    {
      id: 'total-claims',
      label: language === 'vi' ? 'Tổng Hồ Sơ Chi Nhánh' : 'Total Branch Claims',
      value: allTickets.length,
      unit: language === 'vi' ? 'hồ sơ' : 'claims',
      icon: <ShieldCheck className="w-4 h-4" />,
      iconColor: 'text-primary',
      variant: 'default',
    },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Page Header with Primary Action Button */}
      <PageHeader
        title={language === 'vi' ? 'Trung Tâm Tiếp Nhận & Xử Lý Bảo Hành' : 'Warranty & RMA Operations Center'}
        description={
          language === 'vi'
            ? `Tra cứu bảo hành theo IMEI tức thời, thẩm định yêu cầu RMA và theo dõi bàn giao thiết bị. Cơ sở: ${activeBranchName}.`
            : `Instant IMEI eligibility check, RMA claim appraisal, and customer device returns. Scope: ${activeBranchName}.`
        }
        icon={<ShieldCheck className="w-6 h-6 text-emerald-500" />}
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
              variant="primary"
              onClick={() => navigate('/warranties')}
              className="gap-2 text-xs h-9 px-4 shadow-md font-semibold"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{language === 'vi' ? 'Quản Lý Hồ Sơ Bảo Hành' : 'Warranty Tickets'}</span>
            </Button>

            {/* Nút Hướng dẫn sử dụng màu xanh biển nổi bật */}
            <Button
              id="tour-warranty-guide-btn"
              type="button"
              onClick={() => navigate('/warranties?mode=training&tour=auto')}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 border border-sky-400/40 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
              <span>{language === 'vi' ? 'Hướng dẫn sử dụng' : 'User Guide'}</span>
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
                ? 'Chế độ Thực hành: Dữ liệu hồ sơ bảo hành giả lập an toàn'
                : 'Sandbox Mode: Isolated warranty training data active'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                warrantyTrainingService.reset();
                refetch();
                toast.success(
                  language === 'vi' ? 'Đã khôi phục 6 hồ sơ bảo hành mẫu!' : 'Reset demo warranty data successfully!',
                  { icon: '🔄' }
                );
              }}
              className="h-8 text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 mr-1.5" />
              <span>{language === 'vi' ? 'Khôi phục mẫu' : 'Reset Demo'}</span>
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
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="success" className="font-semibold uppercase tracking-wider text-[11px]">
            {language === 'vi' ? 'Chuyên Viên Bảo Hành (Warranty)' : 'Warranty Specialist'}
          </Badge>
          <span className="text-muted-foreground hidden sm:inline">•</span>
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-emerald-500" />
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
          <span>{language === 'vi' ? 'Quầy Thẩm Định Trực Tuyến' : 'RMA Desk Active'}</span>
        </div>
      </div>

      {/* 3. Interactive Core Tool Front & Center: Instant IMEI Warranty Checker */}
      <Card className="p-5 neu-raised border border-primary/30 bg-primary/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl neu-inset flex items-center justify-center text-primary">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-foreground">
                {language === 'vi' ? 'Tra Cứu Bảo Hành Theo IMEI / Serial Thiết Bị' : 'Instant IMEI / Serial Warranty Lookup'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {language === 'vi'
                  ? 'Nhập 15 chữ số IMEI hoặc quét mã vạch trên vỏ máy để kiểm tra thời hạn và gói dịch vụ.'
                  : 'Scan or type the 15-digit IMEI to verify active coverage, plan type, and days remaining.'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleCheckImei} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Input
              ref={imeiInputRef}
              value={imeiQuery}
              onChange={(e) => setImeiQuery(e.target.value)}
              placeholder="VD: 356890123456789"
              className="font-mono text-sm h-10 neu-inset bg-card/90"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={checkingImei || !imeiQuery.trim()}
            className="gap-2 h-10 px-5 shrink-0"
          >
            <Search className={`w-4 h-4 ${checkingImei ? 'animate-spin' : ''}`} />
            <span>{checkingImei ? (language === 'vi' ? 'Đang tra...' : 'Checking...') : (language === 'vi' ? 'Tra' : 'Check')}</span>
          </Button>
        </form>

        {/* Result presentation */}
        {imeiResult && (
          <div className="p-3.5 rounded-2xl bg-card border border-border/50 neu-raised space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {imeiResult.isUnderWarranty ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
                <span className="font-heading font-bold text-sm text-foreground">
                  {imeiResult.productName || 'Thiết bị'}
                </span>
              </div>
              <Badge variant={imeiResult.isUnderWarranty ? 'success' : 'danger'}>
                {imeiResult.isUnderWarranty
                  ? (language === 'vi' ? 'Còn bảo hành' : 'Covered')
                  : (language === 'vi' ? 'Hết hạn bảo hành' : 'Expired')}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground pt-1 border-t border-border/30">
              <div>
                <span>IMEI: </span>
                <span className="font-mono font-medium text-foreground">{imeiResult.imei}</span>
              </div>
              <div>
                <span>{language === 'vi' ? 'Ngày hết hạn: ' : 'Expires: '}</span>
                <span className="font-medium text-foreground">
                  {imeiResult.warrantyExpirationDate || (imeiResult as any).warrantyEndDate
                    ? new Date(imeiResult.warrantyExpirationDate || (imeiResult as any).warrantyEndDate).toLocaleDateString('vi-VN')
                    : '—'}
                </span>
              </div>
              <div>
                <span>{language === 'vi' ? 'Thời gian còn lại: ' : 'Remaining: '}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {((imeiResult as any).remainingDays ?? (imeiResult as any).daysRemaining) !== undefined
                    ? `${(imeiResult as any).remainingDays ?? (imeiResult as any).daysRemaining} ngày`
                    : '—'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate(`/warranties`)}
                className="text-xs h-8 gap-1.5"
              >
                <span>{language === 'vi' ? 'Tạo Phiếu Khiếu Nại Cho Thiết Bị Này' : 'Create RMA Ticket for this IMEI'}</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {imeiError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{imeiError}</span>
          </div>
        )}
      </Card>

      {/* 4. Operational Exceptions: Disputed or Rejected Claims */}
      {rejectedClaims.length > 0 && (
        <ExceptionPanel
          severity="danger"
          title={language === 'vi' ? 'Hồ Sơ Không Đạt Điều Kiện / Bị Từ Chối Bảo Hành' : 'Ineligible / Rejected RMA Claims'}
          description={
            language === 'vi'
              ? `Có ${rejectedClaims.length} hồ sơ bị từ chối do rơi vỡ, vào nước hoặc vi phạm niêm phong tem. Vui lòng in biên bản giải thích rõ ràng cho khách.`
              : `There are ${rejectedClaims.length} rejected warranty claims requiring customer notification.`
          }
          count={rejectedClaims.length}
          actionText={language === 'vi' ? 'Xem danh sách từ chối' : 'View Rejected'}
          onActionClick={() => navigate('/warranties?status=Rejected')}
          items={rejectedClaims.slice(0, 2).map((w) => ({
            id: w.id,
            title: `${w.ticketCode || w.id.slice(0, 8)} — ${w.customerName || 'Khách hàng'}`,
            subtitle: `IMEI: ${w.imei || '—'} • Lý do: Không đủ điều kiện bảo hành hãng`,
            badge: language === 'vi' ? 'Từ chối' : 'Rejected',
            actionText: language === 'vi' ? 'Biên bản' : 'View Record',
            onAction: () => navigate('/warranties'),
          }))}
        />
      )}

      {/* 5. Core Work Queue: Dual Actionable Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue 1: Hồ Sơ Bảo Hành Đang Xử Lý & Thẩm Định */}
        <WorkQueueTable<WarrantyTicketDto>
          title={language === 'vi' ? 'Hồ Sơ Chờ Thẩm Định Ban Đầu' : 'Claims Awaiting Assessment'}
          description={language === 'vi' ? 'Các yêu cầu mới nhận cần kiểm tra ngoại quan & quỳ tím' : 'Newly received claims requiring inspection'}
          icon={<Clock className="w-4 h-4" />}
          iconColor="text-amber-500"
          badge={activeClaims.length > 0 ? { text: `${activeClaims.length} ca`, variant: 'warning' } : undefined}
          data={activeClaims}
          isLoading={isLoading}
          emptyMessage={language === 'vi' ? 'Không có hồ sơ nào đang chờ thẩm định.' : 'No claims currently awaiting initial assessment.'}
          actionText={language === 'vi' ? 'Xem tất cả' : 'View All'}
          onActionClick={() => navigate('/warranties')}
          onRowClick={() => navigate('/warranties')}
          columns={[
            {
              key: 'ticketCode',
              header: language === 'vi' ? 'Mã Claim' : 'Claim Code',
              render: (w) => (
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {w.ticketCode || (w as any).code || w.id.slice(0, 8)}
                </span>
              ),
            },
            {
              key: 'imei',
              header: 'IMEI / Thiết bị',
              render: (w) => (
                <div>
                  <span className="font-medium text-foreground block truncate max-w-[150px]">
                    {(w as any).productName || (w as any).deviceModel || w.imei || 'Thiết bị'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{w.imei || w.customerName || 'Khách lẻ'}</span>
                </div>
              ),
            },
            {
              key: 'createdAt',
              header: language === 'vi' ? 'Ngày nhận' : 'Received Date',
              render: (w) => (
                <span className="text-muted-foreground">
                  {w.createdAt ? new Date(w.createdAt).toLocaleDateString('vi-VN') : '—'}
                </span>
              ),
            },
            {
              key: 'action',
              header: language === 'vi' ? 'Thao tác' : 'Action',
              align: 'center',
              render: (w) => (
                <Badge variant={w.status === 'Received' ? 'warning' : 'primary'} className="cursor-pointer hover:opacity-80">
                  {w.status === 'Received' ? (language === 'vi' ? 'Thẩm định' : 'Inspect') : (language === 'vi' ? 'Xử lý' : 'Process')}
                </Badge>
              ),
            },
          ]}
        />

        {/* Queue 2: Thiết Bị Sẵn Sàng Bàn Giao */}
        <WorkQueueTable<WarrantyTicketDto>
          title={language === 'vi' ? 'Thiết Bị Sẵn Sàng Bàn Giao' : 'Ready for Customer Handover'}
          description={language === 'vi' ? 'Máy đã bảo hành xong từ hãng chờ khách lấy' : 'Completed RMA devices ready for pickup'}
          icon={<CheckCircle2 className="w-4 h-4" />}
          iconColor="text-emerald-500"
          badge={readyCount > 0 ? { text: `${readyCount} máy`, variant: 'success' } : undefined}
          data={readyForHandover}
          isLoading={isLoading}
          emptyMessage={language === 'vi' ? 'Chưa có thiết bị nào hoàn tất chờ bàn giao.' : 'No completed warranty devices waiting for handover.'}
          actionText={language === 'vi' ? 'Xem tất cả' : 'View All'}
          onActionClick={() => navigate('/warranties')}
          onRowClick={() => navigate('/warranties')}
          columns={[
            {
              key: 'ticketCode',
              header: language === 'vi' ? 'Mã Claim' : 'Claim Code',
              render: (w) => (
                <span className="font-mono font-bold text-foreground">
                  {w.ticketCode || (w as any).code || w.id.slice(0, 8)}
                </span>
              ),
            },
            {
              key: 'customer',
              header: language === 'vi' ? 'Khách nhận máy' : 'Customer',
              render: (w) => (
                <div>
                  <span className="font-medium text-foreground block">{w.customerName || 'Khách lẻ'}</span>
                  <span className="text-[11px] font-mono text-muted-foreground">{w.customerPhone || '—'}</span>
                </div>
              ),
            },
            {
              key: 'status',
              header: language === 'vi' ? 'Trạng thái' : 'Status',
              align: 'center',
              render: () => (
                <Badge variant="success" className="text-[10px]">
                  {language === 'vi' ? 'Đã xong' : 'Completed'}
                </Badge>
              ),
            },
            {
              key: 'action',
              header: language === 'vi' ? 'Thao tác' : 'Action',
              align: 'center',
              render: () => (
                <Badge variant="outline" className="cursor-pointer hover:bg-emerald-500/10 text-emerald-600">
                  {language === 'vi' ? 'Trả máy' : 'Return'}
                </Badge>
              ),
            },
          ]}
        />
      </div>

      {/* 6. Operational Launchers: Quick Actions Grid */}
      <QuickActions
        title={language === 'vi' ? 'Lối Tắt Nghiệp Vụ Bảo Hành' : 'Warranty Operational Launchers'}
        description={language === 'vi' ? 'Truy cập nhanh vào các công cụ xử lý RMA' : 'One-click shortcuts to RMA and claim tools'}
        actions={quickActionsList}
        columns={4}
      />

      {/* 7. Supporting Summary Badges (Positioned at bottom, compact) */}
      <SupportingBadges
        title={language === 'vi' ? 'Tóm Tắt Tình Trạng Hồ Sơ Bảo Hành' : 'Warranty Status Summary'}
        items={summaryBadges}
      />
    </div>
  );
};
