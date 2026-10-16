import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  Smartphone,
  User,
  Phone,
  FileText,
  AlertCircle,
  Award,
  Sparkles,
  Printer,
  X,
  Plus
} from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useBranchStore } from '../../stores/branchStore';
import { useWarrantyService } from '../../contexts/WarrantyServiceContext';
import { operationalNotificationService } from '../../services/operationalNotificationService';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface WarrantyCareLookupWidgetProps {
  onTicketCreated?: () => void;
}

export const WarrantyCareLookupWidget: React.FC<WarrantyCareLookupWidgetProps> = ({ onTicketCreated }) => {
  const { language } = useThemeStore();
  const { user } = useAuthStore();
  const { activeBranchId } = useBranchStore();
  const { service, isTrainingMode } = useWarrantyService();

  const [searchImei, setSearchImei] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [intakeNote, setIntakeNote] = useState('');
  const [submittingIntake, setSubmittingIntake] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchImei.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const data: any = await service.checkWarrantyStatus(searchImei.trim());
      if (data.warrantyStatus === 'NotFound') {
        setResult(null);
        toast.error(language === 'vi' ? 'Không tìm thấy thông tin bảo hành cho IMEI này!' : 'Warranty record not found for this IMEI!');
        return;
      }

      const purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
      const endDate = data.warrantyExpirationDate ? new Date(data.warrantyExpirationDate) : null;

      setResult({
        ...data,
        remainingDays: data.remainingDays ?? 0,
        endDateStr: endDate ? endDate.toLocaleDateString('vi-VN') : 'N/A',
        startDateStr: purchaseDate ? purchaseDate.toLocaleDateString('vi-VN') : 'N/A',
        invoiceCode: data.salesOrderCode || 'N/A',
        packageType: data.isUnderWarranty ? 'Bảo hành Tiêu chuẩn 12 Tháng' : 'Hết hạn bảo hành',
        branchName: 'Hệ thống PSP',
      });
      toast.success(language === 'vi' ? 'Đã xác thực thông tin Bảo hành Điện tử!' : 'Warranty verified!', { icon: '🛡️' });
    } catch (err: any) {
      setResult(null);
      const errMsg = err.response?.data?.message || (language === 'vi' ? 'Không tìm thấy thông tin bảo hành hoặc mã IMEI không hợp lệ.' : 'Warranty lookup failed or invalid IMEI.');
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const handleCreateIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !intakeNote.trim()) return;
    setSubmittingIntake(true);
    const effectiveBranchId = (activeBranchId && activeBranchId !== 'all') ? activeBranchId : (user?.branchId || '00000000-0000-0000-0000-000000000001');
    try {
      await service.createWarrantyTicket({
        branchId: effectiveBranchId,
        customerId: result.customerId,
        productVariantId: result.productVariantId,
        imei: result.imei,
        note: intakeNote.trim(),
      });

      if (isTrainingMode) {
        operationalNotificationService.dispatchNotification({
          title: '🛡️ [THỰC HÀNH SANDBOX] Lập phiếu tiếp nhận bảo hành mới',
          content: `Đã tiếp nhận thiết bị ${result.productName} (IMEI: ${result.imei}, Khách hàng: ${result.customerName}) vào quầy dịch vụ bảo hành. Sẵn sàng thẩm định!`,
          type: 'GENERAL',
          targetRoles: ['Warranty', 'Sales', 'Manager'],
          isSandbox: true,
          link: '/warranties?mode=training',
        });
      }

      toast.success(language === 'vi' ? 'Lập phiếu tiếp nhận bảo hành thành công!' : 'Warranty ticket created!', { icon: '🛡️' });
      setShowIntakeModal(false);
      setIntakeNote('');
      onTicketCreated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (language === 'vi' ? 'Không thể lập phiếu bảo hành!' : 'Failed to create warranty ticket!'));
    } finally {
      setSubmittingIntake(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-[var(--neu-bg-base)] border border-[var(--neu-border)] shadow-[var(--neu-shadow-outer)] space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-[var(--neu-shadow-button)] shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-medium text-base text-[var(--neu-text-title)]">
              {language === 'vi' ? 'Tra Cứu Bảo Hành Điện Tử (AppleCare+ / Samsung Care+)' : 'Electronic Warranty Verification Portal'}
            </h3>
            <p className="text-xs text-[var(--neu-text-sub)] font-normal">
              {language === 'vi' ? 'Nhập 15 số IMEI hoặc SĐT để kiểm tra thời hạn & quyền lợi bảo hành' : 'Enter 15-digit IMEI or Phone to verify coverage & benefits'}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-[var(--neu-accent-mint)] text-xs font-bold border border-emerald-500/40 hidden sm:flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Live Validation
        </span>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neu-accent-mint)]" />
          <Input
            type="text"
            value={searchImei}
            onChange={(e) => setSearchImei(e.target.value)}
            placeholder={language === 'vi' ? 'Nhập IMEI (Ví dụ: 356890123456789) hoặc SĐT Khách...' : 'Enter 15-digit IMEI or Customer Phone...'}
            className="w-full bg-[var(--neu-bg-base)] border border-slate-300/40 rounded-2xl pl-11 pr-4 py-3 text-xs font-mono font-bold text-[var(--neu-accent-mint)] placeholder-slate-400 shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
        <Button variant="outline"
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-medium text-xs shadow-[var(--neu-shadow-button)] hover:scale-[1.02] active:scale-95 transition-all shrink-0 cursor-pointer flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span>{loading ? (language === 'vi' ? 'Đang xác thực...' : 'Verifying...') : (language === 'vi' ? 'Xác Thực Bảo Hành' : 'Verify Coverage')}</span>
        </Button>
      </form>

      {/* Quick Demo IMEIs for Sandbox Mode (Trụ cột 4: Peripheral Mocking) */}
      {isTrainingMode && (
        <div className="flex flex-wrap items-center gap-2 text-xs -mt-2 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-amber-500 font-semibold flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            {language === 'vi' ? 'Mô phỏng máy quét / Điền nhanh IMEI mẫu:' : 'Simulated Scanner / Quick Demo IMEIs:'}
          </span>
          <button
            type="button"
            onClick={() => setSearchImei('356891092837461')}
            className="px-2.5 py-1 rounded-xl bg-card hover:bg-amber-500/20 text-foreground hover:text-amber-400 border border-amber-500/30 font-mono text-[11px] font-bold cursor-pointer transition-colors"
          >
            356891092837461 (iPhone 15 PM)
          </button>
          <button
            type="button"
            onClick={() => setSearchImei('354892019283745')}
            className="px-2.5 py-1 rounded-xl bg-card hover:bg-amber-500/20 text-foreground hover:text-amber-400 border border-amber-500/30 font-mono text-[11px] font-bold cursor-pointer transition-colors"
          >
            354892019283745 (S24 Ultra)
          </button>
          <button
            type="button"
            onClick={() => setSearchImei('358912093847562')}
            className="px-2.5 py-1 rounded-xl bg-card hover:bg-amber-500/20 text-foreground hover:text-amber-400 border border-amber-500/30 font-mono text-[11px] font-bold cursor-pointer transition-colors"
          >
            358912093847562 (Z Fold 5 RMA)
          </button>
        </div>
      )}

      {/* Verification Result Card */}
      {result && (
        <div className="p-5 rounded-3xl bg-[var(--neu-bg-base)] border border-emerald-500/40 shadow-inner border border-border/50 bg-muted/20 space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-400/20">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[var(--neu-accent-mint)] font-mono font-bold text-[11px] border border-emerald-500/40">
                  {result.packageType}
                </span>
                <span className="text-xs text-[var(--neu-text-sub)]">| {result.branchName}</span>
              </div>
              <h4 className="font-heading font-medium text-lg text-[var(--neu-text-title)] mt-1">{result.productName}</h4>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/20 text-[var(--neu-accent-mint)] font-bold text-xs border border-emerald-500/40 flex items-center gap-1.5 shadow-[var(--neu-shadow-button)]">
                <CheckCircle2 className="w-4 h-4 text-[var(--neu-accent-mint)]" />
                <span>{language === 'vi' ? `Còn ${result.remainingDays} ngày bảo hành` : `${result.remainingDays} Days Remaining`}</span>
              </span>
              <Button variant="outline"
                onClick={handlePrintCertificate}
                className="px-3 py-1.5 rounded-2xl bg-[var(--neu-bg-base)] text-[var(--neu-text-title)] hover:text-[var(--neu-accent-mint)] text-xs font-medium border border-slate-400/20 shadow-[var(--neu-shadow-button)] active:shadow-inner border border-border/50 bg-muted/20 transition-all cursor-pointer flex items-center gap-1"
                title="In Thẻ Bảo Hành Điện Tử"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">In Thẻ</span>
              </Button>

              {result.isUnderWarranty && (
                <Button
                  onClick={() => setShowIntakeModal(true)}
                  className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold shadow-[var(--neu-shadow-button)] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Lập Phiếu Tiếp Nhận' : 'Intake Ticket'}</span>
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400 font-normal block">Số IMEI Thiết Bị:</span>
              <span className="font-mono font-bold text-[var(--neu-accent-mint)] text-sm">{result.imei}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 font-normal block">Khách Hàng Sở Hữu:</span>
              <span className="font-bold text-[var(--neu-text-title)]">{result.customerName} ({result.customerPhone})</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 font-normal block">Hóa Đơn Mua Hàng:</span>
              <span className="font-mono font-bold text-[var(--neu-text-title)]">{result.invoiceCode} ({result.startDateStr})</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 font-normal block">Hạn Bảo Hành Cuối:</span>
              <span className="font-bold text-emerald-400">{result.endDateStr}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-400/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--neu-text-sub)]">
            <div className="flex items-center gap-4">
              <span>✓ Bảo hành Màn hình & Cảm ứng</span>
              <span>✓ Bảo hành Nguồn & Mainboard</span>
              <span>✓ Chính sách 1-Đổi-1 lỗi phần cứng</span>
            </div>
            <span className="font-mono text-slate-400">UUID Verified</span>
          </div>
        </div>
      )}

      {/* Intake Modal Dialog */}
      {showIntakeModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg p-6 bg-card border border-border/60 rounded-3xl shadow-2xl space-y-4 font-sans animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-bold text-base text-foreground">
                  {language === 'vi' ? 'Tiếp Nhận Bảo Hành Thiết Bị' : 'Create Warranty Intake Ticket'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIntakeModal(false)}
                className="w-8 h-8 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIntake} className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{language === 'vi' ? 'Thiết bị:' : 'Device:'}</span>
                  <span className="font-bold text-foreground">{result.productName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">IMEI:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{result.imei}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{language === 'vi' ? 'Khách hàng:' : 'Customer:'}</span>
                  <span className="font-medium text-foreground">{result.customerName} ({result.customerPhone || 'N/A'})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{language === 'vi' ? 'Hạn bảo hành:' : 'Warranty until:'}</span>
                  <span className="font-bold text-emerald-500">{result.endDateStr} ({language === 'vi' ? `Còn ${result.remainingDays} ngày` : `${result.remainingDays} days left`})</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {language === 'vi' ? 'Mô tả hiện tượng lỗi / Triệu chứng hư hỏng *' : 'Fault Description / Symptoms *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={intakeNote}
                  onChange={(e) => setIntakeNote(e.target.value)}
                  placeholder={language === 'vi' ? 'Ví dụ: Màn hình bị sọc xanh, nguồn chập chờn sạc không vào, loa trong bị rè...' : 'E.g. Screen flickering, speaker crackling, no charging...'}
                  className="w-full bg-background border border-border/60 rounded-2xl p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowIntakeModal(false)}
                  className="text-xs"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={submittingIntake || !intakeNote.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  {submittingIntake ? (language === 'vi' ? 'Đang lập phiếu...' : 'Creating...') : (language === 'vi' ? 'Tạo Phiếu Tiếp Nhận' : 'Confirm Intake')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
