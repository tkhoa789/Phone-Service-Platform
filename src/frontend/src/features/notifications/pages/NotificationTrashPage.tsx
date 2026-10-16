import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  AlertTriangle, 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Eye, 
  XCircle, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  Wrench, 
  FileText,
  Lock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useThemeStore } from '@/stores/themeStore';
import { axiosClient } from '@/utils/axiosClient';
import toast from 'react-hot-toast';

interface TrashNotification {
  id: string;
  userId: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  deletedAt?: string;
}

export const NotificationTrashPage: React.FC = () => {
  const { language } = useThemeStore();
  const isVi = language === 'vi';
  const navigate = useNavigate();

  const [items, setItems] = useState<TrashNotification[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const [selectedItem, setSelectedItem] = useState<TrashNotification | null>(null);
  const [itemToDelete, setItemToDelete] = useState<TrashNotification | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/Notification/trash', {
        params: { pageIndex: page, pageSize }
      });
      setItems(res.data?.data?.items || []);
      setTotalCount(res.data?.data?.totalCount || 0);
    } catch {
      toast.error(isVi ? 'Không thể tải thùng rác thông báo' : 'Failed to load trash');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, [page]);

  const handlePermanentDelete = async () => {
    if (!itemToDelete) return;
    setActionLoading(true);
    try {
      await axiosClient.delete(`/Notification/${itemToDelete.id}/permanent`);
      toast.success(isVi ? 'Đã xóa vĩnh viễn thông báo!' : 'Notification permanently deleted!');
      setItemToDelete(null);
      fetchTrash();
    } catch {
      toast.error(isVi ? 'Không thể xóa vĩnh viễn thông báo' : 'Failed to permanently delete');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearAllTrash = async () => {
    setActionLoading(true);
    try {
      await axiosClient.delete('/Notification/trash/clear-all');
      toast.success(isVi ? 'Đã làm trống thùng rác thành công!' : 'Trash cleared successfully!');
      setShowClearConfirm(false);
      setPage(1);
      fetchTrash();
    } catch {
      toast.error(isVi ? 'Không thể làm trống thùng rác' : 'Failed to clear trash');
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6 font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl neu-raised hover:neu-pressed border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title={isVi ? 'Quay lại' : 'Back'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-heading font-black tracking-tight text-foreground flex items-center gap-2">
                <Trash2 className="w-6 h-6 text-rose-500" />
                {isVi ? 'Thùng Rác Thông Báo' : 'Notification Trash'}
              </h1>
              <Badge variant="danger" className="font-bold font-mono text-xs px-2.5 py-0.5">
                {totalCount} {isVi ? 'đã xóa' : 'deleted'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isVi 
                ? 'Nơi lưu trữ các thông báo đã dọn dẹp hoặc xóa khỏi hộp thư.'
                : 'Repository of deleted system notifications.'}
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrash}
            disabled={loading}
            className="text-xs neu-raised hover:neu-pressed"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isVi ? 'Làm mới' : 'Refresh'}</span>
          </Button>

          {items.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              <span>{isVi ? 'Dọn sạch thùng rác' : 'Empty Trash'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mandatory Business Rule Alert Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 neu-inset">
        <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-amber-700 dark:text-amber-300">
            {isVi ? 'Quy định quản trị thông báo lưu trữ:' : 'Notification Archive Policy:'}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {isVi 
              ? 'Thùng rác chỉ cho phép xem chi tiết nội dung để làm thủ công hoặc xóa vĩnh viễn khỏi hệ thống. Theo quy tắc nghiệp vụ kiểm soát, hệ thống KHÔNG hỗ trợ khôi phục thư về hộp thư chính.'
              : 'Trash allows viewing detailed messages for manual processing or permanent deletion. In accordance with operational security rules, restoring notifications back to the inbox is prohibited.'}
          </p>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto text-primary animate-spin opacity-70" />
          <p className="text-xs text-muted-foreground">{isVi ? 'Đang tải thông báo trong thùng rác...' : 'Loading trash notifications...'}</p>
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center space-y-3 rounded-3xl neu-raised border border-border/40">
          <div className="w-14 h-14 rounded-3xl bg-muted/30 border border-border/40 flex items-center justify-center mx-auto text-muted-foreground">
            <Trash2 className="w-7 h-7 opacity-50" />
          </div>
          <h3 className="font-heading font-bold text-base text-foreground">
            {isVi ? 'Thùng rác đang trống' : 'Trash is empty'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {isVi 
              ? 'Không có thông báo nào bị xóa hoặc tất cả thông báo cũ đã được dọn dẹp vĩnh viễn.'
              : 'No notifications in trash or all deleted items have been purged.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <Card
              key={n.id}
              className="p-4 md:p-5 rounded-2xl neu-raised border border-border/40 hover:border-border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card"
            >
              {/* Info Column */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {n.title?.includes('sửa chữa') || n.title?.includes('Phiếu') ? (
                    <Badge variant="warning" className="text-[10px] font-bold uppercase">
                      <Wrench className="w-3 h-3 mr-1" /> Sửa Chữa
                    </Badge>
                  ) : n.title?.includes('Hao hụt') || n.title?.includes('Write-Off') ? (
                    <Badge variant="danger" className="text-[10px] font-bold uppercase">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Hao Hụt
                    </Badge>
                  ) : n.title?.includes('Hủy') ? (
                    <Badge variant="danger" className="text-[10px] font-bold uppercase">
                      <XCircle className="w-3 h-3 mr-1" /> Hủy Đơn
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                      <FileText className="w-3 h-3 mr-1" /> Hệ Thống
                    </Badge>
                  )}

                  <h4 className="font-bold text-sm text-foreground truncate">
                    {n.title}
                  </h4>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {n.content}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-muted-foreground/70 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(n.createdAt).toLocaleString(isVi ? 'vi-VN' : 'en-US')}
                  </span>
                  {n.deletedAt && (
                    <span className="flex items-center gap-1 text-rose-500/80">
                      <Trash2 className="w-3.5 h-3.5" />
                      {isVi ? 'Xóa lúc: ' : 'Deleted: '}
                      {new Date(n.deletedAt).toLocaleTimeString(isVi ? 'vi-VN' : 'en-US')}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Chi tiết & Xóa hẳn (TUYỆT ĐỐI KHÔNG CÓ NÚT KHÔI PHỤC) */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedItem(n)}
                  className="text-xs neu-raised hover:neu-pressed"
                >
                  <Eye className="w-3.5 h-3.5 mr-1 text-primary" />
                  <span>{isVi ? 'Đọc chi tiết' : 'View Details'}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setItemToDelete(n)}
                  className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  <span>{isVi ? 'Xóa hẳn' : 'Delete'}</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/40 text-xs">
          <span className="text-muted-foreground font-medium">
            {isVi 
              ? `Trang ${page} / ${totalPages} (Tổng cộng ${totalCount} thông báo)` 
              : `Page ${page} of ${totalPages} (${totalCount} notifications)`}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="h-8 px-2.5 neu-raised disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              <span>{isVi ? 'Trước' : 'Prev'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 neu-raised disabled:opacity-40"
            >
              <span>{isVi ? 'Sau' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal 1: Read Details Modal (Đọc lại làm thủ công - Không khôi phục) */}
      {selectedItem && (
        <Dialog
          open={true}
          onOpenChange={(open) => { if (!open) setSelectedItem(null); }}
          title={isVi ? 'Chi Tiết Thông Báo Trong Thùng Rác' : 'Notification Trash Details'}
          description={isVi ? 'Đọc thông tin để kiểm tra đối soát hoặc xử lý thủ công.' : 'Review notification details for manual handling.'}
          className="max-w-lg"
        >
          <div className="space-y-4 pt-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/40 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px]">
                <span>{new Date(selectedItem.createdAt).toLocaleString(isVi ? 'vi-VN' : 'en-US')}</span>
                <span className="text-rose-500 font-bold">[ĐÃ XÓA]</span>
              </div>
              <h3 className="font-bold text-sm text-foreground leading-snug">
                {selectedItem.title}
              </h3>
            </div>

            <div className="p-4 rounded-2xl neu-inset bg-card border border-border/40 space-y-2">
              <label className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider block">
                {isVi ? 'Nội dung chi tiết:' : 'Full Message Body:'}
              </label>
              <p className="text-foreground text-xs leading-relaxed whitespace-pre-wrap">
                {selectedItem.content}
              </p>
            </div>

            {/* Note stating no restore */}
            <p className="text-[11px] text-amber-600 dark:text-amber-400 italic bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
              {isVi 
                ? 'ℹ️ Ghi chú: Thông báo này chỉ xem để đối soát nghiệp vụ thủ công. Hệ thống không hỗ trợ đưa ngược lại hộp thư đến.'
                : 'ℹ️ Note: This archived notification is read-only for manual reconciliation. Cannot be restored.'}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setItemToDelete(selectedItem);
                  setSelectedItem(null);
                }}
                className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                <span>{isVi ? 'Xóa hẳn thông báo này' : 'Permanent Delete'}</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedItem(null)}
                className="text-xs"
              >
                <span>{isVi ? 'Đóng lại' : 'Close'}</span>
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Modal 2: Confirm Permanent Delete Single Item */}
      {itemToDelete && (
        <Dialog
          open={true}
          onOpenChange={(open) => { if (!open) setItemToDelete(null); }}
          title={isVi ? 'Xác Nhận Xóa Vĩnh Viễn' : 'Confirm Permanent Deletion'}
          description={isVi ? 'Hành động này sẽ xóa hoàn toàn khỏi cơ sở dữ liệu và không thể lấy lại.' : 'This action permanently removes the record from the database.'}
          className="max-w-md"
        >
          <div className="space-y-4 pt-3 text-xs">
            <p className="text-foreground font-semibold bg-destructive/10 text-destructive p-3 rounded-xl border border-destructive/20">
              {itemToDelete.title}
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItemToDelete(null)}
                disabled={actionLoading}
              >
                {isVi ? 'Hủy bỏ' : 'Cancel'}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handlePermanentDelete}
                disabled={actionLoading}
                className="bg-destructive text-white hover:bg-destructive/90 font-bold"
              >
                {actionLoading ? (isVi ? 'Đang xóa...' : 'Deleting...') : (isVi ? 'Xóa Vĩnh Viễn' : 'Delete Permanently')}
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Modal 3: Confirm Clear All Trash */}
      {showClearConfirm && (
        <Dialog
          open={true}
          onOpenChange={(open) => { if (!open) setShowClearConfirm(false); }}
          title={isVi ? 'Làm Trống Thùng Rác' : 'Empty Trash'}
          description={isVi ? 'Bạn có chắc chắn muốn xóa vĩnh viễn tất cả thông báo trong thùng rác?' : 'Are you sure you want to permanently delete all items in trash?'}
          className="max-w-md"
        >
          <div className="space-y-4 pt-3 text-xs">
            <p className="text-foreground text-muted-foreground leading-relaxed">
              {isVi 
                ? `Toàn bộ ${totalCount} thông báo trong thùng rác sẽ bị xóa hoàn toàn khỏi hệ thống.` 
                : `All ${totalCount} notifications in trash will be permanently purged.`}
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirm(false)}
                disabled={actionLoading}
              >
                {isVi ? 'Hủy bỏ' : 'Cancel'}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleClearAllTrash}
                disabled={actionLoading}
                className="bg-destructive text-white hover:bg-destructive/90 font-bold"
              >
                {actionLoading ? (isVi ? 'Đang dọn...' : 'Emptying...') : (isVi ? 'Dọn Sạch Ngay' : 'Empty All')}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
