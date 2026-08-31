import React, { useState } from 'react';
import { X, Tag, PlusCircle, Calendar, Hash, DollarSign, AlertCircle } from 'lucide-react';
import { voucherService, type CreateVoucherCommand } from '../../services/voucherService';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface VoucherFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const VoucherFormModal: React.FC<VoucherFormModalProps> = ({ onClose, onSuccess }) => {
  const { language } = useThemeStore();
  const tVoucher = i18nDictionary[language].vouchers;
  const tCommon = i18nDictionary[language].common;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateVoucherCommand>({
    code: '',
    discountAmount: 50000,
    minOrderValue: 200000,
    usageLimit: 100,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập mã Voucher!' : 'Please enter a voucher code!');
      return;
    }
    setLoading(true);

    try {
      await voucherService.create({
        ...formData,
        code: formData.code.trim().toUpperCase(),
        expiryDate: new Date(`${formData.expiryDate}T23:59:59`).toISOString(),
      });
      toast.success(
        language === 'vi'
          ? `Phát hành mã Voucher [${formData.code.toUpperCase()}] thành công!`
          : `Voucher [${formData.code.toUpperCase()}] issued successfully!`,
        { icon: '🎉' }
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (language === 'vi' ? 'Không thể phát hành Voucher mới!' : 'Failed to issue new voucher!'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[var(--neu-bg-base)] rounded-3xl p-6 border border-[var(--neu-border)] shadow-[var(--neu-shadow-outer)] space-y-5 text-[var(--neu-text-title)] animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-400/20 pb-3">
          <h3 className="font-heading font-medium text-base text-[var(--neu-text-title)] flex items-center gap-2">
            <Tag className="w-5 h-5 text-[var(--neu-accent-mint)]" /> {tVoucher.modalTitle}
          </h3>
          <Button variant="outline" onClick={onClose} className="p-1.5 rounded-xl bg-[var(--neu-bg-base)] text-slate-400 hover:text-[var(--neu-text-title)] shadow-[var(--neu-shadow-button)] transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[var(--neu-text-title)] font-medium block mb-1">{tVoucher.codeLabel}</label>
            <div className="relative">
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neu-accent-mint)]" />
              <Input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SALE50K, HE2026..."
                className="w-full bg-[var(--neu-bg-base)] border border-slate-300/40 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-mono text-[var(--neu-accent-mint)] font-bold placeholder-slate-400 shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 uppercase"
                required
              />
            </div>
            <p className="text-[11px] text-[var(--neu-text-sub)] mt-1 font-normal">{language === 'vi' ? 'Mã sẽ tự động viết hoa (Ví dụ: SALE50K)' : 'Code auto-uppercased (e.g. SALE50K)'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--neu-text-title)] font-medium block mb-1">{tVoucher.discountLabel}</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neu-accent-mint)]" />
                <Input
                  type="number"
                  min="1000"
                  step="1000"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[var(--neu-bg-base)] border border-slate-300/40 rounded-2xl pl-9 pr-3 py-2 text-[var(--neu-accent-mint)] font-bold shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[var(--neu-text-title)] font-medium block mb-1">{tVoucher.minOrderLabel}</label>
              <Input
                type="number"
                min="0"
                step="10000"
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[var(--neu-bg-base)] border border-slate-300/40 rounded-2xl px-3 py-2 text-[var(--neu-text-title)] font-bold shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--neu-text-title)] font-medium block mb-1">{tVoucher.limitLabel}</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neu-accent-mint)]" />
                <Input
                  type="number"
                  min="1"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 1 })}
                  className="w-full bg-[var(--neu-bg-base)] border border-slate-300/40 rounded-2xl pl-9 pr-3 py-2 text-[var(--neu-text-title)] font-bold shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[var(--neu-text-title)] font-medium block mb-1">{tVoucher.expiryLabel}</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neu-accent-mint)]" />
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full bg-[var(--neu-bg-base)] border border-slate-300/40 rounded-2xl pl-9 pr-3 py-2 text-[var(--neu-text-title)] font-bold shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--neu-bg-base)] border border-emerald-500/30 shadow-inner border border-border/50 bg-muted/20 flex items-start gap-2 text-xs text-[var(--neu-text-sub)]">
            <AlertCircle className="w-4 h-4 text-[var(--neu-accent-mint)] shrink-0 mt-0.5" />
            <p className="text-[11px] font-normal">
              {language === 'vi'
                ? 'Voucher phát hành sẽ có hiệu lực ngay lập tức. Nhân viên thu ngân tại quầy POS có thể nhập mã này để trừ tiền trực tiếp trên hóa đơn cho khách hàng.'
                : 'Issued voucher will take effect immediately. POS cashiers can enter this voucher code to apply discount on checkout.'}
            </p>
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
              <PlusCircle className="w-4 h-4" /> {loading ? (language === 'vi' ? 'Đang phát hành...' : 'Issuing...') : tVoucher.btnCreateVoucher}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
