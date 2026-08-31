import React, { useState } from 'react';
import { X, RefreshCw, Smartphone } from 'lucide-react';
import { serviceService } from '../../services/serviceService';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface WarrantyReplacementModalProps {
  rowVersion: string;
  warrantyTicketId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const WarrantyReplacementModal: React.FC<WarrantyReplacementModalProps> = ({
  warrantyTicketId, rowVersion,
  onClose,
  onSuccess,
}) => {
  const { language } = useThemeStore();
  const tCommon = i18nDictionary[language].common;

  const [replacementImei, setReplacementImei] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacementImei.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập số IMEI của máy mới đổi!' : 'Please enter 15-digit IMEI of new replacement device!');
      return;
    }
    setLoading(true);

    try {
      await serviceService.updateWarrantyStatus(
        warrantyTicketId,
        'Completed', // Status
        'Swap',      // Action
        null,        // Description
        replacementImei.trim(), // NewImei
        rowVersion   // RowVersion
      );
      toast.success(language === 'vi' ? 'Đã hoàn tất đổi máy mới cho khách hàng (BR-905)!' : 'Device replacement completed (BR-905)!', { icon: '✅' });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (language === 'vi' ? 'Không thể cập nhật đổi máy mới!' : 'Failed to process replacement!'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--neu-bg-base)] rounded-3xl p-6 border border-[var(--neu-border)] shadow-[var(--neu-shadow-outer)] space-y-5 text-[var(--neu-text-title)] animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-400/20 pb-3">
          <h3 className="font-heading font-medium text-base text-[var(--neu-text-title)] flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[var(--neu-accent-mint)]" /> {language === 'vi' ? 'Đổi Máy Mới Theo Quy Định (BR-905)' : 'Device Replacement Rule (BR-905)'}
          </h3>
          <Button variant="outline" onClick={onClose} className="p-1.5 rounded-xl bg-[var(--neu-bg-base)] text-slate-400 hover:text-[var(--neu-text-title)] shadow-[var(--neu-shadow-button)] transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-[var(--neu-bg-base)] border border-emerald-500/30 text-[var(--neu-text-sub)] space-y-1 shadow-inner border border-border/50 bg-muted/20">
            <p className="font-medium text-[var(--neu-accent-mint)] flex items-center gap-1.5 text-xs">
              <Smartphone className="w-4 h-4" /> {language === 'vi' ? 'Quy tắc Bảo hành Đổi Máy Nhanh:' : 'Fast Replacement Warranty Rule:'}
            </p>
            <p className="text-[11px] font-normal">
              {language === 'vi'
                ? 'Thiết bị đủ điều kiện bảo hành bị lỗi phần cứng nặng sẽ được đổi ngay 1 máy mới. Số IMEI cũ sẽ được hủy và thay bằng số IMEI máy mới này.'
                : 'Eligible warranty devices with major hardware failure will receive an instant replacement. The old IMEI will be deactivated and swapped with this new IMEI.'}
            </p>
          </div>

          <div>
            <label className="text-[var(--neu-text-title)] font-medium block mb-1">{language === 'vi' ? 'Chuỗi 15 số IMEI của Thiết Bị Mới *' : '15-Digit IMEI of Replacement Device *'}</label>
            <Input
              type="text"
              value={replacementImei}
              onChange={(e) => setReplacementImei(e.target.value)}
              placeholder="358921109988771"
              className="w-full bg-[var(--neu-bg-base)] border border-slate-300/40 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-[var(--neu-accent-mint)] placeholder-slate-400 shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline"
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl bg-[var(--neu-bg-base)] text-[var(--neu-text-sub)] hover:text-[var(--neu-text-title)] font-medium shadow-[var(--neu-shadow-button)] active:shadow-inner border border-border/50 bg-muted/20 transition-all cursor-pointer"
            >
              {tCommon.cancel}
            </Button>
            <Button variant="outline"
              type="submit"
              disabled={loading}
              className="flex-[2] py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-medium flex items-center justify-center gap-2 shadow-[var(--neu-shadow-button)] transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> {loading ? tCommon.loading : (language === 'vi' ? 'Xác Nhận Đổi Máy Mới' : 'Confirm Replacement')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
