import React, { useState } from 'react';
import { X, CheckCircle2, User, Phone, Smartphone, AlertCircle, ShieldCheck } from 'lucide-react';
import { useWarrantyService } from '../../contexts/WarrantyServiceContext';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import type { WarrantyTicketDto } from '../../types/api.types';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { operationalNotificationService } from '../../services/operationalNotificationService';

interface WarrantyDeliverModalProps {
  ticket: WarrantyTicketDto;
  onClose: () => void;
  onSuccess: () => void;
}

export const WarrantyDeliverModal: React.FC<WarrantyDeliverModalProps> = ({
  ticket,
  onClose,
  onSuccess,
}) => {
  const { language } = useThemeStore();
  const { service } = useWarrantyService();
  const tCommon = i18nDictionary[language].common;

  const [receiverName, setReceiverName] = useState(ticket.customerName || '');
  const [notes, setNotes] = useState(
    ticket.status === 'Rejected'
      ? 'Khách hàng đã nhận lại máy sau khi giải thích lý do từ chối bảo hành.'
      : 'Khách hàng đã test máy hoạt động bình thường, đồng ý nhận bàn giao và ký nhận.'
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await service.deliverWarrantyToCustomer({
        warrantyTicketId: ticket.id,
        receiverName: receiverName.trim() || undefined,
        notes: notes.trim() || undefined,
        rowVersion: ticket.rowVersion,
      });

      const isSandboxAction = ticket.id.startsWith('demo-') || (ticket.ticketCode || ticket.code || '').includes('DEMO');
      if (isSandboxAction) {
        operationalNotificationService.dispatchNotification({
          title: '🎉 [THỰC HÀNH SANDBOX] Bàn giao thiết bị bảo hành hoàn tất',
          content: `Phiếu ${ticket.code} (${ticket.productName}) đã bàn giao thành công cho: ${receiverName.trim() || ticket.customerName}. Hoàn tất quy trình bảo hành.`,
          type: 'GENERAL',
          targetRoles: ['Warranty', 'Sales', 'Manager'],
          isSandbox: true,
          link: '/warranties?mode=training',
        });
      }

      toast.success(
        language === 'vi'
          ? 'Đã bàn giao máy trả khách và hoàn tất vòng đời bảo hành!'
          : 'Device successfully returned to customer! Warranty cycle completed.',
        { icon: '🤝' }
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (language === 'vi' ? 'Không thể bàn giao thiết bị!' : 'Failed to deliver device!'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-3xl p-6 border border-border/60 shadow-2xl space-y-5 text-foreground animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            {language === 'vi' ? 'Bàn Giao Thiết Bị Trả Khách Hàng' : 'Deliver Device to Customer'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Summary Card */}
        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/50 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{language === 'vi' ? 'Mã phiếu bảo hành:' : 'Ticket Code:'}</span>
            <span className="font-mono font-bold text-primary">{ticket.code}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{language === 'vi' ? 'Thiết bị & IMEI:' : 'Device & IMEI:'}</span>
            <span className="font-mono font-bold text-foreground">{ticket.imei}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{language === 'vi' ? 'Khách hàng:' : 'Customer:'}</span>
            <span className="font-semibold text-foreground flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-primary" /> {ticket.customerName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{language === 'vi' ? 'Trạng thái hiện tại:' : 'Current Status:'}</span>
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
              ticket.status === 'Rejected'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            }`}>
              {ticket.status}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-foreground font-semibold block mb-1">
              {language === 'vi' ? 'Họ tên người nhận máy *' : 'Receiver Full Name *'}
            </label>
            <Input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs text-foreground font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-foreground font-semibold block mb-1">
              {language === 'vi' ? 'Ghi chú bàn giao & biên bản ký nhận' : 'Handover Notes & Signature Confirmation'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 min-h-[70px]"
            />
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-muted-foreground flex items-start gap-2 text-[11px] leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              {language === 'vi'
                ? 'Khi bàn giao hoàn tất, hệ thống sẽ chốt ngày kết thúc (EndDate) và tự động trả trạng thái số IMEI về "Sold" (Đã bán/Khách sở hữu).'
                : 'Completing handover sets EndDate and restores IMEI status to Sold.'}
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl cursor-pointer"
            >
              {tCommon.cancel}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? tCommon.loading : (language === 'vi' ? 'Xác Nhận Bàn Giao' : 'Confirm Handover')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
