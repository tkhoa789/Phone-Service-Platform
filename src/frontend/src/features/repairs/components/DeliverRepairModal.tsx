import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  DollarSign,
  UserCheck,
  Printer,
  Smartphone,
  AlertCircle,
  FileCheck2,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { useDeliverRepair } from '../api/useRepairs';
import type { RepairTicketDto } from '@/types/api.types';

interface DeliverRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: RepairTicketDto | null;
  onDeliveredSuccess?: (ticket: RepairTicketDto) => void;
}

export const DeliverRepairModal: React.FC<DeliverRepairModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onDeliveredSuccess,
}) => {
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [shouldPrintReceipt, setShouldPrintReceipt] = useState(true);

  const deliverMutation = useDeliverRepair();

  useEffect(() => {
    if (ticket) {
      setReceiverName(ticket.customerName || '');
      setReceiverPhone(ticket.customerPhone || '');
      setNotes('Đã kiểm tra hoạt động bình thường các chức năng, dán tem bảo hành và bàn giao phụ kiện đi kèm.');
      setPaymentConfirmed(false);
      setShouldPrintReceipt(true);
    }
  }, [ticket, isOpen]);

  if (!isOpen || !ticket) return null;

  // Tính toán tài chính
  const totalCost = Number(ticket.actualCost ?? ticket.totalAmount ?? ticket.estimatedCost ?? 0);
  const totalDeposit = (ticket.deposits && ticket.deposits.length > 0)
    ? ticket.deposits.reduce((sum, d) => sum + Number(d.amount || 0), 0)
    : Number((ticket as any).depositAmount || 0);

  const balanceDue = Math.max(0, totalCost - totalDeposit);
  const isFullyPaid = balanceDue <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiverName.trim()) {
      toast.error('Vui lòng nhập họ tên người nhận thiết bị.');
      return;
    }

    if (!isFullyPaid && !paymentConfirmed) {
      toast.error('Vui lòng xác nhận đã thu đủ khoản tiền quyết toán còn lại trước khi giao máy!');
      return;
    }

    const isSandboxMode = new URLSearchParams(window.location.search).get('mode') === 'training';
    if (isSandboxMode) {
      try {
        const { repairSandboxService } = await import('../services/repairSandboxService');
        repairSandboxService.deliverRepair(ticket.id, receiverName.trim());
        toast.success('[SANDBOX] Bàn giao thiết bị cho khách hàng thành công!');
        onClose();
        if (onDeliveredSuccess) {
          onDeliveredSuccess({
            ...ticket,
            status: 'Delivered',
          });
        }
      } catch (err: any) {
        toast.error(err?.message || 'Lỗi bàn giao trong sandbox');
      }
      return;
    }

    try {
      await deliverMutation.mutateAsync({
        repairTicketId: ticket.id,
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success('Bàn giao thiết bị cho khách hàng thành công!');
      onClose();

      if (onDeliveredSuccess) {
        onDeliveredSuccess({
          ...ticket,
          status: 'Delivered',
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi bàn giao thiết bị.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-border/60 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Bàn Giao Máy Cho Khách</h2>
                <Badge variant="outline" className="font-mono text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                  {ticket.ticketCode || ticket.code}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quy trình bàn giao hoàn tất thiết bị & quyết toán thu tiền khách hàng
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground h-9 w-9 p-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Thông tin máy */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-background border border-border/60 text-muted-foreground">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Thiết bị sửa chữa</p>
                <p className="text-sm font-semibold text-foreground">
                  {ticket.deviceModel || ticket.customModelName || ticket.productName || 'Thiết bị'}
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mt-0.5">
                  <span>IMEI: {ticket.imei || (ticket as any).serialNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              Sẵn sàng giao
            </span>
          </div>

          {/* Quyết toán tài chính */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Quyết Toán Tài Chính & Chi Phí Sửa Chữa</span>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 text-center">
              <div>
                <span className="text-xs text-muted-foreground block">Tổng chi phí</span>
                <span className="text-base font-bold text-foreground">
                  {totalCost.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Đã đặt cọc</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {totalDeposit.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Còn phải thu</span>
                <span className={`text-base font-bold ${balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                  {balanceDue.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>

            {balanceDue > 0 ? (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <p className="font-semibold">Cần thu thêm {balanceDue.toLocaleString('vi-VN')} ₫</p>
                  <p className="text-muted-foreground mt-0.5">
                    Yêu cầu khách thanh toán đủ tiền mặt, chuyển khoản VietQR hoặc quẹt thẻ trước khi giao máy.
                  </p>
                  <label className="flex items-center gap-2 mt-2.5 font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={paymentConfirmed}
                      onChange={(e) => setPaymentConfirmed(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-border"
                    />
                    <span className="text-foreground">Đã xác nhận thu đủ {balanceDue.toLocaleString('vi-VN')} ₫ từ khách</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Khách hàng đã thanh toán toàn bộ chi phí (Số dư còn lại: 0 ₫). Có thể bàn giao ngay.</span>
              </div>
            )}
          </div>

          {/* Thông tin người nhận bàn giao */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Thông Tin Người Nhận Máy & Cam Kết</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="receiverName" className="text-xs font-medium text-foreground block">
                  Họ tên người nhận <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="receiverName"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Nhập họ tên người nhận máy"
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="receiverPhone" className="text-xs font-medium text-foreground block">
                  Số điện thoại người nhận
                </label>
                <Input
                  id="receiverPhone"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  placeholder="Nhập số điện thoại (nếu có)"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="notes" className="text-xs font-medium text-foreground block">
                Ghi chú tình trạng bàn giao & Tem bảo hành
              </label>
              <Textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú chi tiết về tình trạng thiết bị khi giao cho khách..."
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Tùy chọn in phiếu */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 text-xs">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">In biên nhận bàn giao & bảo hành (K80 Thermal)</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={shouldPrintReceipt}
                onChange={(e) => setShouldPrintReceipt(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
              />
              <span className="text-muted-foreground">Tự động mở phiếu</span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
              disabled={deliverMutation.isPending}
            >
              Đóng
            </Button>

            <Button
              type="submit"
              disabled={deliverMutation.isPending || (!isFullyPaid && !paymentConfirmed)}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-lg shadow-emerald-600/20"
            >
              {deliverMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileCheck2 className="w-4 h-4" />
              )}
              Xác Nhận Bàn Giao Máy
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
