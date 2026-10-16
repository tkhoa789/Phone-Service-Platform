import React from 'react';
import { X, Clock, Calendar, User, Phone, Smartphone, FileText, CheckCircle2, AlertTriangle, Truck, Wrench, RefreshCw, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useWarrantyService } from '../../contexts/WarrantyServiceContext';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import type { WarrantyTicketDto } from '../../types/api.types';
import { Button } from '@/components/ui/Button';

interface WarrantyHistoryTimelineModalProps {
  ticketId: string;
  onClose: () => void;
}

export const WarrantyHistoryTimelineModal: React.FC<WarrantyHistoryTimelineModalProps> = ({
  ticketId,
  onClose,
}) => {
  const { language } = useThemeStore();
  const { service } = useWarrantyService();
  const tCommon = i18nDictionary[language].common;

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['warranty-detail', ticketId],
    queryFn: () => service.getWarrantyById(ticketId),
  });

  const getActionIcon = (action: string) => {
    if (action.includes('Tiếp nhận')) return <Clock className="w-4 h-4 text-purple-500" />;
    if (action.includes('Từ chối')) return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    if (action.includes('sửa chữa') || action.includes('nội bộ')) return <Wrench className="w-4 h-4 text-emerald-500" />;
    if (action.includes('Đổi máy')) return <RefreshCw className="w-4 h-4 text-blue-500" />;
    if (action.includes('Gửi hãng') || action.includes('RMA')) return <Truck className="w-4 h-4 text-amber-500" />;
    if (action.includes('Bàn giao')) return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    return <FileText className="w-4 h-4 text-primary" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20 text-[10px]">Hoàn thành</span>;
      case 'Processing':
        return <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 text-[10px]">Đang xử lý</span>;
      case 'Rejected':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 text-[10px]">Từ chối</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20 text-[10px]">Tiếp nhận</span>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '---';
    try {
      const d = new Date(dateString);
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card rounded-3xl p-6 border border-border/60 shadow-2xl space-y-5 text-foreground animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-primary/10 text-primary">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-foreground">
                {language === 'vi' ? 'Lịch Sử Tiến Trình Bảo Hành' : 'Warranty Progress Timeline'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {language === 'vi' ? 'Theo dõi toàn bộ các bước thẩm định, sửa chữa và bàn giao' : 'Track appraisal, repair, and delivery stages'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground text-xs">
            {tCommon.loading}
          </div>
        ) : !ticket ? (
          <div className="p-12 text-center text-muted-foreground text-xs">
            {language === 'vi' ? 'Không tìm thấy thông tin phiếu bảo hành' : 'Warranty ticket not found'}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Overview Card */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Mã phiếu:</span>
                  <span className="font-mono font-bold text-primary">{ticket.code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Thiết bị:</span>
                  <span className="font-semibold text-foreground">{ticket.productName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Số IMEI:</span>
                  <span className="font-mono font-bold text-foreground">{ticket.imei}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Hóa đơn mua:</span>
                  <span className="font-mono font-semibold text-foreground">{ticket.salesOrderCode || 'Hóa đơn gốc'}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Khách hàng:</span>
                  <span className="font-semibold text-foreground">{ticket.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Điện thoại:</span>
                  <span className="font-mono text-muted-foreground">{ticket.customerPhone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ngày tiếp nhận:</span>
                  <span className="text-muted-foreground">{formatDate(ticket.startDate || ticket.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <div>{getStatusBadge(ticket.status)}</div>
                </div>
              </div>
            </div>

            {/* Special Context Banners */}
            {ticket.repairTicketCode && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4" />
                  Đang xử lý sửa chữa nội bộ: Phiếu <span className="font-mono font-bold">{ticket.repairTicketCode}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold">Chi phí 0đ</span>
              </div>
            )}

            {ticket.vendorName && (
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs flex items-center justify-between">
                <span className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  Đã gửi hãng: {ticket.vendorName} (Mã: <span className="font-mono">{ticket.vendorTicketNumber}</span>)
                </span>
                <span className="font-mono text-[11px] font-bold text-purple-500">Vận đơn: {ticket.trackingNumber}</span>
              </div>
            )}

            {ticket.rejectReason && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1">
                <span className="font-bold text-rose-500 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Từ chối bảo hành: {ticket.rejectReason}
                </span>
                <p className="text-muted-foreground text-[11px]">{ticket.rejectNotes}</p>
                {ticket.transferToPaidRepair && (
                  <p className="text-emerald-500 font-semibold text-[11px]">• Khách hàng đã chuyển sang gói sửa chữa dịch vụ có phí.</p>
                )}
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                {language === 'vi' ? 'Dòng thời gian sự kiện' : 'Timeline Events'}
              </h4>

              {(!ticket.histories || ticket.histories.length === 0) ? (
                <div className="p-6 text-center text-muted-foreground text-xs bg-muted/20 rounded-xl">
                  {language === 'vi' ? 'Chưa có bản ghi lịch sử nào' : 'No history events recorded'}
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                  {ticket.histories.map((h, idx) => (
                    <div key={h.id || idx} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-card border-2 border-primary flex items-center justify-center shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>

                      <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/40 hover:border-border transition-all space-y-1.5 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {getActionIcon(h.action)}
                            <span className="font-bold text-foreground">{h.action}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(h.status)}
                            <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              {formatDate(h.createdAt)}
                            </span>
                          </div>
                        </div>

                        {h.description && (
                          <p className="text-muted-foreground text-xs leading-relaxed pl-6">
                            {h.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pl-6 pt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-primary" />
                            Người thực hiện: <strong className="text-foreground font-normal">{h.actorName || h.createdBy || 'Hệ thống'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-border/40">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
