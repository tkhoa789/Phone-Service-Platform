import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { WarrantyServiceProvider, useWarrantyService } from '../../contexts/WarrantyServiceContext';
import { useWarrantyTour } from '../../hooks/useWarrantyTour';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import type { WarrantyTicketDto, WarrantyTicketStatus } from '../../types/api.types';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Phone,
  User,
  BookOpen,
  AlertTriangle,
  Clock,
  Wrench,
  Eye,
  GraduationCap,
  Sparkles,
  RotateCcw,
  Package,
  LogOut,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { operationalNotificationService } from '../../services/operationalNotificationService';
import { exitSandboxMode } from '../../utils/sandboxUtils';
import { Pagination } from '../../components/common/Pagination';
import { WarrantyCareLookupWidget } from '../../components/warranties/WarrantyCareLookupWidget';
import { WarrantyProcessModal } from '../../components/warranties/WarrantyProcessModal';
import { WarrantyDeliverModal } from '../../components/warranties/WarrantyDeliverModal';
import { WarrantyHistoryTimelineModal } from '../../components/warranties/WarrantyHistoryTimelineModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { useAuthStore } from '../../stores/authStore';

const WarrantyListPageContent: React.FC = () => {
  const { language } = useThemeStore();
  const tWar = i18nDictionary[language].warranties;
  const tCommon = i18nDictionary[language].common;

  const navigate = useNavigate();
  const { hasRole, can } = useAuthStore();
  const canProcessWarranty = can('Warranty.UPDATE') || hasRole('Warranty') || hasRole('Technician') || hasRole('Manager') || hasRole('Admin') || hasRole('Owner');
  const { service, isTrainingMode, setTrainingMode, resetTrainingData } = useWarrantyService();
  const { startTour } = useWarrantyTour();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('tour') === 'auto' || searchParams.get('tour') === 'true') {
      const timer = setTimeout(() => {
        startTour();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, startTour]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | WarrantyTicketStatus>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Modals state
  const [processTicket, setProcessTicket] = useState<WarrantyTicketDto | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);

  const [deliverTicket, setDeliverTicket] = useState<WarrantyTicketDto | null>(null);
  const [showDeliverModal, setShowDeliverModal] = useState(false);

  const [timelineTicketId, setTimelineTicketId] = useState<string | null>(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  const { data: fetchedWarranties, isLoading: loading, refetch: loadWarranties } = useQuery({
    queryKey: ['warranties', searchTerm, isTrainingMode],
    queryFn: () => service.getWarranties({ search: searchTerm }),
    staleTime: isTrainingMode ? 0 : 5 * 60 * 1000
  });

  const handleRmaReturn = async (ticket: WarrantyTicketDto) => {
    try {
      await service.updateWarrantyStatus(
        ticket.id,
        'Processing',
        'Tiếp nhận máy từ hãng về chi nhánh',
        `Trung tâm bảo hành hãng ${ticket.vendorName || 'OEM'} đã hoàn tất xử lý và chuyển trả máy về chi nhánh. Thiết bị đã được kiểm tra đạt chuẩn, sẵn sàng để bàn giao cho khách.`,
        null,
        ticket.rowVersion
      );

      const isSandboxAction = isTrainingMode || ticket.id.startsWith('demo-') || (ticket.ticketCode || ticket.code || '').includes('DEMO');

      operationalNotificationService.dispatchNotification({
        title: isSandboxAction
          ? '🎓 [THỰC HÀNH SANDBOX] Máy gửi hãng (RMA) đã quay về chi nhánh!'
          : '📦 Máy gửi hãng (RMA) đã quay về chi nhánh!',
        content: isSandboxAction
          ? `[Mô phỏng thực hành] Thiết bị ${ticket.productName} (Mã phiếu: ${ticket.ticketCode || ticket.code}, IMEI: ${ticket.imei}) gửi hãng ${ticket.vendorName || 'OEM'} đã quay về chi nhánh. Sẵn sàng liên hệ bàn giao trả khách!`
          : `Thiết bị ${ticket.productName} (Mã phiếu: ${ticket.ticketCode || ticket.code}, IMEI: ${ticket.imei}) gửi hãng ${ticket.vendorName || 'OEM'} đã quay về chi nhánh. Sẵn sàng liên hệ bàn giao trả khách!`,
        type: 'WARRANTY_RMA_RETURN',
        targetRoles: isSandboxAction ? ['Warranty'] : ['Warranty', 'Sales', 'Manager'],
        link: isSandboxAction ? '/warranties?mode=training' : '/warranties',
        isSandbox: isSandboxAction,
      });

      toast.success(
        language === 'vi'
          ? (isSandboxAction ? '🎓 [Sandbox] Đã mô phỏng nhận máy từ hãng thành công!' : 'Đã xác nhận máy từ hãng quay về chi nhánh thành công!')
          : (isSandboxAction ? '🎓 [Sandbox] Simulated OEM RMA return completed!' : 'OEM RMA device received back at branch!'),
        { icon: isSandboxAction ? '🎓' : '📦' }
      );
      loadWarranties();
    } catch (e: any) {
      toast.error(e?.message || (language === 'vi' ? 'Không thể cập nhật trạng thái nhận máy từ hãng' : 'Failed to receive from vendor'));
    }
  };

  const warranties: WarrantyTicketDto[] = React.useMemo(() => {
    if (!fetchedWarranties) return [];
    return Array.isArray((fetchedWarranties as any)?.items) ? (fetchedWarranties as any).items : Array.isArray(fetchedWarranties) ? fetchedWarranties : [];
  }, [fetchedWarranties]);

  // Client-side filtering by status & search term
  const filteredWarranties = React.useMemo(() => {
    let list = warranties;
    if (statusFilter !== 'ALL') {
      list = list.filter((w) => w.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter(
        (w) =>
          (w.code && w.code.toLowerCase().includes(term)) ||
          (w.ticketCode && w.ticketCode.toLowerCase().includes(term)) ||
          (w.imei && w.imei.toLowerCase().includes(term)) ||
          (w.customerName && w.customerName.toLowerCase().includes(term)) ||
          (w.customerPhone && w.customerPhone.toLowerCase().includes(term)) ||
          (w.productName && w.productName.toLowerCase().includes(term))
      );
    }
    return list;
  }, [warranties, statusFilter, searchTerm]);

  const paginatedWarranties = filteredWarranties.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const firstProcessableId = React.useMemo(
    () => canProcessWarranty ? paginatedWarranties.find((x) => x.status === 'Received' || x.status === 'Processing')?.id : undefined,
    [paginatedWarranties, canProcessWarranty]
  );
  const firstDeliverableId = React.useMemo(
    () => paginatedWarranties.find((x) => x.status === 'Processing' || x.status === 'Rejected')?.id,
    [paginatedWarranties]
  );
  const firstTimelineId = paginatedWarranties[0]?.id;

  const countByStatus = (status: WarrantyTicketStatus) => {
    return warranties.filter((w) => w.status === status).length;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="px-3 py-1.5 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/40 whitespace-nowrap inline-flex items-center justify-center text-center text-xs">
            {tWar.statusCompleted}
          </span>
        );
      case 'Processing':
        return (
          <span className="px-3 py-1.5 rounded-2xl bg-cyan-500/20 text-cyan-400 font-medium border border-cyan-500/30 whitespace-nowrap inline-flex items-center justify-center text-center text-xs">
            {tWar.statusProcessing}
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-3 py-1.5 rounded-2xl bg-rose-500/20 text-rose-400 font-medium border border-rose-500/30 whitespace-nowrap inline-flex items-center justify-center text-center text-xs">
            {tWar.statusRejected}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1.5 rounded-2xl bg-purple-500/20 text-purple-400 font-medium border border-purple-500/30 whitespace-nowrap inline-flex items-center justify-center text-center text-xs">
            {tWar.statusReceived}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans text-muted-foreground">
      {/* Sticky Sandbox Alert Banner (When Training Mode is Active) */}
      {isTrainingMode && (
        <div
          id="tour-sandbox-banner"
          className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-500 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-300"
        >
          <div className="flex items-start md:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                  {language === 'vi' ? 'CHẾ ĐỘ THỰC HÀNH NGHIỆP VỤ (SANDBOX TRAINING)' : 'SANDBOX TRAINING MODE'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ZERO-DB FOOTPRINT
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === 'vi'
                  ? 'Dữ liệu 6 kịch bản mẫu lưu trong Database Tạm (Shadow Store), an toàn 100% không ghi vào Database thật. Chuông thông báo Sandbox hoạt động đầy đủ 1:1 để thực hành quy trình chuẩn.'
                  : '6 sample scenarios running in isolated Shadow Store. Full 1:1 notifications mirroring with zero writes to live database.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              onClick={startTour}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-102"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>{language === 'vi' ? 'Bắt đầu Hướng dẫn' : 'Start Tour'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetTrainingData();
                operationalNotificationService.clearSandboxNotifications();
                loadWarranties();
                toast.success(language === 'vi' ? 'Đã khôi phục 6 kịch bản mẫu ban đầu!' : 'Demo data reset successfully!', { icon: '🔄' });
              }}
              className="px-3.5 py-2 rounded-xl bg-card border border-amber-500/30 hover:bg-amber-500/10 text-amber-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Khôi phục mẫu' : 'Reset Demo'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                exitSandboxMode({
                  searchParams,
                  setSearchParams,
                  navigate,
                  language,
                  onExit: () => {
                    setTrainingMode(false);
                  }
                });
              }}
              className="px-3.5 py-2 rounded-xl bg-card border border-rose-500/30 hover:bg-rose-500/10 text-rose-500 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Thoát Sandbox' : 'Exit Sandbox'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="p-6 rounded-3xl bg-card border border-border/40 neu-raised flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground tracking-tight">{tWar.warrantiesTitle}</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-normal">{tWar.warrantiesSubtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Hướng dẫn sử dụng màu xanh biển nổi bật chuẩn Neu-raised */}
          <Button
            type="button"
            onClick={() => {
              if (!isTrainingMode) {
                setTrainingMode(true);
                toast.success(
                  language === 'vi'
                    ? 'Đã khởi động Chế độ Thực hành & Mở Hướng dẫn nghiệp vụ!'
                    : 'Sandbox Training & Guided Tour started!',
                  { icon: '🌊' }
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

          {/* Toggle Sandbox Training Button */}
          <Button
            variant="outline"
            onClick={() => {
              const next = !isTrainingMode;
              setTrainingMode(next);
              if (next) {
                toast.success(language === 'vi' ? 'Đã kích hoạt Chế độ Thực hành Sandbox!' : 'Sandbox Training Mode activated!', { icon: '🎓' });
              } else {
                operationalNotificationService.clearSandboxNotifications();
                toast.success(language === 'vi' ? 'Đã trở lại dữ liệu thật của hệ thống.' : 'Returned to live database data.', { icon: '🛡️' });
              }
            }}
            className={`px-4 py-2.5 rounded-2xl border font-semibold text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all shrink-0 ${
              isTrainingMode
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30 ring-2 ring-amber-500/30'
                : 'bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>
              {isTrainingMode
                ? (language === 'vi' ? 'Đang thực hành (Sandbox)' : 'In Sandbox Mode')
                : (language === 'vi' ? 'Bật Sandbox độc lập' : 'Interactive Sandbox')}
            </span>
            {isTrainingMode && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowPolicyModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/10 text-primary font-medium text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all shrink-0"
          >
            <BookOpen className="w-4 h-4" />
            <span>{language === 'vi' ? 'Chính sách bảo hành & Quy chuẩn KTV' : 'Warranty Policy & SLA'}</span>
          </Button>

          {/* Cổng tra cứu bảo hành công khai (/warranty-check) */}
          <Button
            variant="outline"
            onClick={() => window.open('/warranty-check', '_blank')}
            className="px-4 py-2.5 rounded-2xl bg-card border border-border hover:border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all shrink-0"
            title={language === 'vi' ? 'Mở Cổng tra cứu bảo hành công khai (/warranty-check) trong tab mới' : 'Open Public Warranty Check Portal (/warranty-check) in new tab'}
          >
            <ExternalLink className="w-4 h-4" />
            <span>{language === 'vi' ? 'Cổng tra cứu IMEI (/warranty-check)' : 'Public Warranty Check'}</span>
          </Button>
        </div>
      </div>

      {/* Electronic Warranty Verification Portal Widget (AppleCare+ & Samsung Care+ Standard) */}
      <div id="tour-lookup-widget">
        <WarrantyCareLookupWidget onTicketCreated={loadWarranties} />
      </div>

      {/* Status Filter Tabs & Search Bar */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div id="tour-status-tabs" className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'ALL'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <span>{language === 'vi' ? 'Tất cả' : 'All'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-card/40 font-mono">
                {warranties.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setStatusFilter('Received'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'Received'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10'
              }`}
            >
              <span>{tWar.statusReceived}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-card/40 font-mono">
                {countByStatus('Received')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setStatusFilter('Processing'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'Processing'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10'
              }`}
            >
              <span>{tWar.statusProcessing}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-card/40 font-mono">
                {countByStatus('Processing')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setStatusFilter('Completed'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'Completed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <span>{tWar.statusCompleted}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-card/40 font-mono">
                {countByStatus('Completed')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setStatusFilter('Rejected'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'Rejected'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              <span>{tWar.statusRejected}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-card/40 font-mono">
                {countByStatus('Rejected')}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {isTrainingMode && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 font-mono text-[10px] font-bold border border-amber-500/30 hidden lg:flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> SANDBOX DEMO
              </span>
            )}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder={language === 'vi' ? 'Tìm mã phiếu, IMEI, khách hàng...' : 'Search ticket, IMEI, customer...'}
                className="w-full pl-9 pr-4 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        {/* Warranty Tickets Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/30 text-foreground uppercase font-semibold border-b border-border/50">
              <tr>
                <th className="p-3.5">{tWar.colTicketCode}</th>
                <th className="p-3.5">{tWar.colImeiDevice}</th>
                <th className="p-3.5">{tWar.colCustomer}</th>
                <th className="p-3.5">{tWar.colIssueDesc}</th>
                <th className="p-3.5">{tWar.colStatus}</th>
                <th className="p-3.5 text-right">{tWar.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-muted-foreground">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground font-normal">{tCommon.loading}</td>
                </tr>
              ) : paginatedWarranties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground font-normal">{tWar.emptyWarranties}</td>
                </tr>
              ) : (
                paginatedWarranties.map((w) => (
                  <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                    {/* Ticket Code (Clickable to open Timeline) */}
                    <td className="p-3.5">
                      <button
                        type="button"
                        onClick={() => { setTimelineTicketId(w.id); setShowTimelineModal(true); }}
                        className="font-mono font-bold text-primary hover:underline flex items-center gap-1.5 cursor-pointer text-left group"
                        title={language === 'vi' ? 'Xem dòng thời gian lịch sử xử lý' : 'View history timeline'}
                      >
                        <span>{w.ticketCode || w.code}</span>
                        <Eye className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 text-primary" />
                      </button>
                      {w.repairTicketCode && (
                        <span className="block mt-1 text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                          <Wrench className="w-3 h-3" /> {w.repairTicketCode}
                        </span>
                      )}
                      {w.vendorName && (
                        <span className="block mt-1 text-[10px] text-purple-400 font-mono">
                          OEM: {w.vendorTicketNumber || w.vendorName}
                        </span>
                      )}
                    </td>

                    {/* IMEI & Product Variant */}
                    <td className="p-3.5 space-y-0.5">
                      <span className="font-mono text-foreground block font-bold">{w.imei}</span>
                      <span className="text-foreground font-medium">{w.productName || 'Phone'}</span>
                    </td>

                    {/* Customer */}
                    <td className="p-3.5 space-y-0.5">
                      <p className="font-medium text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" /> {w.customerName || 'N/A'}
                      </p>
                      <p className="text-muted-foreground font-mono flex items-center gap-1 text-[11px]">
                        <Phone className="w-3 h-3 text-muted-foreground" /> {w.customerPhone || 'N/A'}
                      </p>
                    </td>

                    {/* Issue Description */}
                    <td className="p-3.5 max-w-xs text-foreground font-normal truncate" title={w.issueDescription || w.note}>
                      {w.issueDescription || w.note || (language === 'vi' ? 'Không có mô tả' : 'No description')}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5">{getStatusBadge(w.status)}</td>

                    {/* Actions */}
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {/* Thẩm định & Xử lý (Tab 1: Sửa nội bộ, Tab 2: Từ chối, Tab 3: Đổi máy 1-1, Tab 4: Gửi hãng) */}
                      {canProcessWarranty && (w.status === 'Received' || w.status === 'Processing') && (
                        <Button
                          id={w.id === firstProcessableId ? 'tour-process-btn' : undefined}
                          variant="outline"
                          onClick={() => { setProcessTicket(w); setShowProcessModal(true); }}
                          className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-semibold text-[11px] inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>{language === 'vi' ? 'Thẩm định & Xử lý' : 'Process'}</span>
                        </Button>
                      )}

                      {/* Xác nhận máy hãng RMA trả về chi nhánh */}
                      {canProcessWarranty && Boolean(w.vendorName && w.status === 'Processing') && (
                        <Button
                          variant="outline"
                          onClick={() => handleRmaReturn(w)}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 dark:text-purple-300 border border-purple-500/30 font-semibold text-[11px] inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                          title={language === 'vi' ? 'Xác nhận trung tâm bảo hành hãng đã gửi trả máy về chi nhánh' : 'Confirm OEM RMA device received at branch'}
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>{language === 'vi' ? 'Nhận máy từ hãng' : 'RMA Returned'}</span>
                        </Button>
                      )}

                      {/* Bàn giao trả khách */}
                      {(w.status === 'Processing' || w.status === 'Rejected') && (
                        <Button
                          id={w.id === firstDeliverableId ? 'tour-deliver-btn' : undefined}
                          variant="outline"
                          onClick={() => { setDeliverTicket(w); setShowDeliverModal(true); }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold text-[11px] inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{language === 'vi' ? 'Bàn giao trả khách' : 'Deliver'}</span>
                        </Button>
                      )}

                      {/* Nút xem lịch sử timeline */}
                      <Button
                        id={w.id === firstTimelineId ? 'tour-timeline-btn' : undefined}
                        variant="outline"
                        onClick={() => { setTimelineTicketId(w.id); setShowTimelineModal(true); }}
                        className="px-2.5 py-1.5 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 font-medium text-[11px] inline-flex items-center gap-1 cursor-pointer"
                        title={language === 'vi' ? 'Xem dòng thời gian lịch sử' : 'View History Timeline'}
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredWarranties.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modals */}
      {showProcessModal && processTicket && (
        <WarrantyProcessModal
          ticket={processTicket}
          onClose={() => setShowProcessModal(false)}
          onSuccess={() => {
            loadWarranties();
          }}
        />
      )}

      {showDeliverModal && deliverTicket && (
        <WarrantyDeliverModal
          ticket={deliverTicket}
          onClose={() => setShowDeliverModal(false)}
          onSuccess={() => {
            loadWarranties();
          }}
        />
      )}

      {showTimelineModal && timelineTicketId && (
        <WarrantyHistoryTimelineModal
          ticketId={timelineTicketId}
          onClose={() => {
            setShowTimelineModal(false);
            setTimelineTicketId(null);
          }}
        />
      )}

      {/* Warranty Policy Dialog (Modal) */}
      {showPolicyModal && (
        <Dialog
          open={showPolicyModal}
          onOpenChange={setShowPolicyModal}
          title={language === 'vi' ? 'Chính Sách Bảo Hành & Quy Chuẩn Kỹ Thuật Viên' : 'Warranty Policy & Technician SLA'}
          className="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Section 1: Standard Policy */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>1. Điều Kiện Tiếp Nhận & Tiêu Chuẩn Bảo Hành</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">Sản phẩm đủ điều kiện:</strong> Máy còn trong thời hạn bảo hành điện tử (12 tháng kể từ ngày kích hoạt bán lẻ).</li>
                <li><strong className="text-foreground">Chính sách 1 Đổi 1 trong 30 ngày (BR-905):</strong> Áp dụng đối với sản phẩm phát sinh lỗi phần cứng do nhà sản xuất (Mainboard, Màn hình, FaceID, Nguồn). Đổi ngay thân máy tương đương hoặc nguyên seal mới.</li>
                <li><strong className="text-foreground">Chính sách từ chối bảo hành:</strong> Máy có dấu hiệu vào nước (quỳ tím LCI đổi đỏ), va đập cấn móp biến dạng, tự ý can thiệp phần cứng hoặc bị bên thứ ba tháo mở.</li>
              </ul>
            </div>

            {/* Section 2: Technician Mandatory Role */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>2. Vai Trò Bắt Buộc Của Kỹ Thuật Viên (Technician)</span>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Tiếp tân / Thu ngân:</strong> Chỉ thực hiện kiểm tra sơ bộ ngoại quan, tra cứu IMEI trên cổng bảo hành và ấn <span className="font-semibold text-emerald-600">[+ Lập Phiếu Tiếp Nhận]</span>.
                </p>
                <p>
                  <strong className="text-foreground">Kỹ thuật viên (BẮT BUỘC KIỂM TRA CHUYÊN SÂU):</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Tháo máy kiểm tra bo mạch bên trong và xác minh chỉ báo ẩm nước LCI.</li>
                  <li>Chạy công cụ chẩn đoán phần cứng (Apple Diagnostics / Samsung Service Mode) để kiểm tra Serial các linh kiện (Màn hình, Pin, Camera, FaceID) xem có bị thay đổi/luộc đồ hay không.</li>
                  <li>
                    <span className="font-bold text-foreground">Phân định kết quả:</span>
                    <ul className="list-circle pl-5 mt-1 space-y-0.5">
                      <li><strong>Lỗi do Nhà sản xuất (30 ngày đầu):</strong> Phê duyệt thực hiện <strong className="text-emerald-500">Đổi máy mới 1-1 (BR-905)</strong> ngay cho khách.</li>
                      <li><strong>Lỗi do Nhà sản xuất (12 tháng):</strong> Phê duyệt xuất linh kiện chính hãng thay thế miễn phí.</li>
                      <li><strong>Lỗi do Người dùng (vào nước/rơi vỡ):</strong> Lập biên bản từ chối bảo hành (Rejected), thông báo lý do và tư vấn báo giá sửa chữa dịch vụ có phí.</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 3: SLA */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-blue-600 dark:text-blue-400">
                <Clock className="w-4 h-4" />
                <span>3. Cam Kết Thời Gian Xử Lý (SLA Chuỗi Cửa Hàng)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center pt-1">
                <div className="p-2.5 rounded-xl bg-background border border-border">
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold">Chẩn đoán phần cứng</span>
                  <span className="font-heading font-extrabold text-base text-blue-600">2 - 4 Giờ</span>
                </div>
                <div className="p-2.5 rounded-xl bg-background border border-border">
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold">Đổi máy mới 1-1 (BR-905)</span>
                  <span className="font-heading font-extrabold text-base text-emerald-600">Trong ngày</span>
                </div>
                <div className="p-2.5 rounded-xl bg-background border border-border">
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold">Bảo hành thay thế LK</span>
                  <span className="font-heading font-extrabold text-base text-amber-600">1 - 3 Ngày</span>
                </div>
              </div>
            </div>

            {/* Section 4: Test IMEIs helper */}
            <div className="p-3.5 rounded-2xl bg-card border border-border space-y-1.5">
              <span className="font-bold text-foreground block">Mã IMEI kiểm thử luồng bảo hành:</span>
              <p className="text-muted-foreground text-[11px]">
                • <strong className="text-foreground">IMEI hợp lệ đã bán:</strong> <code className="px-1.5 py-0.5 rounded bg-muted font-mono font-bold text-emerald-600">860123469903945</code> (Galaxy S24 Ultra, khách 0977259527) - đủ điều kiện bảo hành.<br />
                • <strong className="text-foreground">IMEI chưa xuất bán (Trong kho):</strong> <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-amber-600">SKUSDEV751-2EE739-002</code> - hệ thống sẽ báo chưa kích hoạt bán lẻ.<br />
                • <strong className="text-foreground">IMEI rỗng / không tồn tại:</strong> <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-rose-500">999999999999999</code> - hệ thống sẽ chặn không cho lập phiếu bảo hành.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-border mt-3">
            <Button
              variant="primary"
              onClick={() => setShowPolicyModal(false)}
              className="px-5 py-2 font-bold text-xs cursor-pointer"
            >
              {language === 'vi' ? 'Đã hiểu & Đóng' : 'Understood & Close'}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export const WarrantyListPage: React.FC = () => {
  return (
    <WarrantyServiceProvider>
      <WarrantyListPageContent />
    </WarrantyServiceProvider>
  );
};
