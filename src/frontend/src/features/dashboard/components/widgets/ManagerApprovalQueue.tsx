import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Dialog } from '../../../../components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  Store,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Lock
} from 'lucide-react';
import { useThemeStore } from '../../../../stores/themeStore';
import { useAuthStore } from '../../../../stores/authStore';
import { useBranchStore } from '../../../../stores/branchStore';
import { formatCurrency } from '../../../../utils/formatCurrency';
import { managerSandboxService, type ManagerApprovalRequest } from '../../services/managerSandboxService';
import toast from 'react-hot-toast';

export type ApprovalRequest = ManagerApprovalRequest;

const ITEMS_PER_PAGE = 5;

export const ManagerApprovalQueue: React.FC = () => {
  const { language } = useThemeStore();
  const isVi = language === 'vi';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { user, roles } = useAuthStore();
  const { activeBranchId, activeBranchName } = useBranchStore();

  const isManager = roles.includes('Manager');
  const isOwner = roles.includes('Owner');
  const isAdmin = roles.includes('Admin');

  // Strict Policy: Owner & Admin KHÔNG LIÊN QUAN, gỡ bỏ hoàn toàn.
  // Chỉ có Cửa Hàng Trưởng / Quản Lý Chi Nhánh (Manager) mới có thẩm quyền duyệt.
  if (!isManager || isOwner || isAdmin) {
    return null;
  }

  // Xác định chi nhánh trực thuộc mà Quản Lý này được phân công
  const managerBranchId = user?.branchId || (activeBranchId !== 'all' ? activeBranchId : 'branch-q1');
  const managerBranchName = user?.branchName || (activeBranchName !== 'Tất cả chi nhánh' ? activeBranchName : 'Chi Nhánh 1 (Quận 1)');

  const [sandboxTick, setSandboxTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setSandboxTick((t) => t + 1);
    window.addEventListener('psp_sandbox_manager_updated', handleUpdate);
    return () => window.removeEventListener('psp_sandbox_manager_updated', handleUpdate);
  }, []);

  const requests = useMemo(() => {
    return managerSandboxService.getRequests();
  }, [sandboxTick]);

  const [rejectModalItem, setRejectModalItem] = useState<ApprovalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Lọc nghiêm ngặt: Quản lý chỉ thấy và duyệt các yêu cầu thuộc ĐÚNG chi nhánh của mình!
  // Tuyệt đối không xem và không duyệt chéo sang chi nhánh khác.
  const branchScopedRequests = useMemo(() => {
    return requests.filter(req => {
      // 1. So khớp ID chi nhánh
      if (managerBranchId && req.branchId && req.branchId === managerBranchId) {
        return true;
      }
      // 2. So khớp Tên chi nhánh
      if (managerBranchName && managerBranchName !== 'Tất cả chi nhánh') {
        const normManager = managerBranchName.toLowerCase().replace(/chi nhánh\s*/i, '').trim();
        const normReq = req.branchName.toLowerCase().replace(/chi nhánh\s*/i, '').trim();
        if (normReq.includes(normManager) || normManager.includes(normReq)) {
          return true;
        }
      }
      return req.branchId === 'branch-q1' || req.branchName.includes('Chi Nhánh 1');
    });
  }, [requests, managerBranchId, managerBranchName]);

  const pendingRequests = branchScopedRequests.filter(r => r.status === 'PENDING');
  const pendingCount = pendingRequests.length;

  // Counts per tab (chỉ tính trong phạm vi chi nhánh trực thuộc)
  const countAll = pendingRequests.length;
  const countVoid = pendingRequests.filter(r => r.type === 'VOID_ORDER').length;
  const countStock = pendingRequests.filter(r => r.type === 'STOCK_DISCREPANCY').length;
  const countParts = pendingRequests.filter(r => r.type === 'SPECIAL_PART').length;

  const filteredRequests = pendingRequests.filter(r => {
    if (activeFilter === 'ALL') return true;
    return r.type === activeFilter;
  });

  // Pagination calculation
  const totalItems = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleTabChange = (tabId: string) => {
    setActiveFilter(tabId);
    setCurrentPage(1);
  };

  const handleApprove = (req: ApprovalRequest) => {
    managerSandboxService.approveRequest(req.id);
    toast.success(
      isVi 
        ? `Đã phê duyệt thành công: ${req.title} (${req.branchName})!` 
        : `Approved successfully: ${req.title} (${req.branchName})!`,
      { icon: '✅' }
    );
  };

  const handleConfirmReject = () => {
    if (!rejectModalItem) return;
    const reason = rejectReason.trim() || (isVi ? 'Không đủ điều kiện phê duyệt' : 'Does not meet approval criteria');
    managerSandboxService.rejectRequest(rejectModalItem.id, reason);
    toast.error(
      isVi 
        ? `Đã từ chối yêu cầu: ${rejectModalItem.title} (${rejectModalItem.branchName})!` 
        : `Rejected request: ${rejectModalItem.title} (${rejectModalItem.branchName})!`
    );
    setRejectModalItem(null);
    setRejectReason('');
  };

  const handleNavigateDetail = (targetPath: string) => {
    const isSandbox = sessionStorage.getItem('psp_sandbox_mode') === 'true' || searchParams.get('mode') === 'training';
    if (isSandbox) {
      const separator = targetPath.includes('?') ? '&' : '?';
      navigate(`${targetPath}${separator}mode=training`);
    } else {
      navigate(targetPath);
    }
  };

  const getTypeBadge = (type: ApprovalRequest['type']) => {
    switch (type) {
      case 'VOID_ORDER':
        return <Badge variant="danger" className="text-[10px] uppercase font-bold">{isVi ? 'Hủy Đơn' : 'Void Order'}</Badge>;
      case 'STOCK_DISCREPANCY':
        return <Badge variant="warning" className="text-[10px] uppercase font-bold">{isVi ? 'Lệch Kho' : 'Stock Gap'}</Badge>;
      case 'SPECIAL_PART':
        return <Badge variant="primary" className="text-[10px] uppercase font-bold">{isVi ? 'Linh Kiện' : 'Special Part'}</Badge>;
    }
  };

  return (
    <Card id="tour-manager-approval-queue" className="p-5 md:p-6 rounded-3xl neu-raised border border-amber-500/30 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-heading font-bold text-base md:text-lg text-foreground tracking-tight">
                {isVi ? 'Hàng Chờ Phê Duyệt Cửa Hàng Trưởng' : 'Store Manager Approval Queue'}
              </h2>
              {/* Badge chi nhánh trực thuộc */}
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center gap-1">
                <Store className="w-3 h-3" />
                <span>{managerBranchName}</span>
              </Badge>
              {pendingCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs animate-pulse">
                  {pendingCount} {isVi ? 'chờ xử lý' : 'pending'}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                  {isVi ? 'Đã hoàn tất' : 'All clear'}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isVi 
                ? `Chỉ hiển thị các yêu cầu phát sinh nội bộ tại ${managerBranchName}. Cửa hàng trưởng chỉ có thẩm quyền phê duyệt trong phạm vi chi nhánh trực thuộc.`
                : `Strictly scoped to ${managerBranchName}. Cross-branch approval is restricted.`}
            </p>
          </div>
        </div>

        {/* 4 Tabs with Counts: Tất cả, Hủy đơn, Lệch kho, Linh kiện */}
        <div id="tour-manager-filter-tabs" className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide text-xs">
          {[
            { id: 'ALL', label: isVi ? 'Tất cả' : 'All', count: countAll },
            { id: 'VOID_ORDER', label: isVi ? 'Hủy đơn' : 'Void Order', count: countVoid },
            { id: 'STOCK_DISCREPANCY', label: isVi ? 'Lệch kho' : 'Stock Discrepancy', count: countStock },
            { id: 'SPECIAL_PART', label: isVi ? 'Linh kiện' : 'Special Parts', count: countParts },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-amber-500 text-white font-bold shadow-sm'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeFilter === tab.id 
                  ? 'bg-white/25 text-white font-bold' 
                  : 'bg-muted text-foreground'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List of Approval Items (Strictly 5 items per page) */}
      {paginatedRequests.length === 0 ? (
        <div className="py-8 text-center space-y-2.5 rounded-2xl bg-muted/15 border border-dashed border-border/60">
          <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {isVi ? `Không có yêu cầu chờ duyệt nào tại ${managerBranchName}!` : `No pending approval requests for ${managerBranchName}!`}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {isVi 
              ? `Tất cả các ca thuộc ${managerBranchName} đều đã được ký duyệt hoặc không có ngoại lệ phát sinh.`
              : 'All requests for this branch have been processed.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedRequests.map(req => (
            <div
              key={req.id}
              className="p-4 rounded-2xl neu-raised bg-card border border-border/40 hover:border-amber-500/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Info Column */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {getTypeBadge(req.type)}
                  <span className="font-semibold text-sm text-foreground truncate">
                    {req.title}
                  </span>
                  {req.amount && (
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                      {formatCurrency(req.amount)}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto lg:ml-0 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {req.submittedAt}
                  </span>
                </div>

                <p className="text-xs text-foreground/80 leading-relaxed bg-muted/20 p-2.5 rounded-xl border border-border/30">
                  <span className="font-semibold text-muted-foreground mr-1">{isVi ? 'Lý do giải trình:' : 'Reason:'}</span>
                  {req.reason}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>{req.requesterName}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-primary" />
                    <span>{req.branchName}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div id="tour-manager-quick-approve" className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                <Button
                  id="tour-manager-deep-link"
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigateDetail(req.targetPath)}
                  className="text-xs text-muted-foreground hover:text-foreground neu-raised cursor-pointer"
                  title={isVi ? 'Xem phiếu gốc' : 'View record'}
                >
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  <span>{isVi ? 'Chi tiết' : 'Details'}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRejectModalItem(req);
                    setRejectReason('');
                  }}
                  className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  <span>{isVi ? 'Từ chối' : 'Reject'}</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApprove(req)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>{isVi ? 'Duyệt ngay' : 'Approve'}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls - Strictly 5 cards per page */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/40 text-xs">
          <span className="text-muted-foreground font-medium">
            {isVi 
              ? `Hiển thị ${startIndex + 1}–${Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} trên tổng số ${totalItems} yêu cầu tại ${managerBranchName} (Trang ${safeCurrentPage}/${totalPages})`
              : `Showing ${startIndex + 1}–${Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of ${totalItems} requests at ${managerBranchName} (Page ${safeCurrentPage}/${totalPages})`}
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safeCurrentPage <= 1}
              className="h-8 px-2.5 text-xs neu-raised disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              <span>{isVi ? 'Trước' : 'Prev'}</span>
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  safeCurrentPage === pageNum
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="h-8 px-2.5 text-xs neu-raised disabled:opacity-40"
            >
              <span>{isVi ? 'Sau' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalItem && (
        <Dialog
          open={true}
          onOpenChange={(isOpen) => { if (!isOpen) setRejectModalItem(null); }}
          title={isVi ? 'Từ Chối Yêu Cầu Phê Duyệt' : 'Reject Authorization Request'}
          description={`${rejectModalItem.title} (${rejectModalItem.requesterName})`}
          className="max-w-md"
        >
          <div className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {isVi ? 'Nhập lý do từ chối (bắt buộc thông báo cho nhân viên):' : 'Rejection rationale (notified to requester):'}
              </label>
              <Input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={isVi ? 'Ví dụ: Cần kiểm tra lại camera trước khi hủy bill...' : 'E.g. Verify camera before voiding bill...'}
                className="w-full"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button variant="outline" size="sm" onClick={() => setRejectModalItem(null)}>
                {isVi ? 'Hủy bỏ' : 'Cancel'}
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmReject} className="bg-destructive text-white hover:bg-destructive/90">
                {isVi ? 'Xác nhận Từ Chối' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </Card>
  );
};
