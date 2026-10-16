import React, { useState } from 'react';
import { X, Wrench, ShieldAlert, RefreshCw, Truck, Smartphone, CheckCircle2, AlertTriangle, ArrowRight, UserCheck } from 'lucide-react';
import { useWarrantyService } from '../../contexts/WarrantyServiceContext';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import type { WarrantyTicketDto, RejectReason } from '../../types/api.types';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { operationalNotificationService } from '../../services/operationalNotificationService';

interface WarrantyProcessModalProps {
  ticket: WarrantyTicketDto;
  onClose: () => void;
  onSuccess: () => void;
}

export const WarrantyProcessModal: React.FC<WarrantyProcessModalProps> = ({
  ticket,
  onClose,
  onSuccess,
}) => {
  const { language } = useThemeStore();
  const { service } = useWarrantyService();
  const tCommon = i18nDictionary[language].common;

  const [activeTab, setActiveTab] = useState<'repair' | 'reject' | 'replace' | 'vendor'>('repair');
  const [loading, setLoading] = useState(false);

  // Tab 1: In-House Repair
  const [componentDiagnosis, setComponentDiagnosis] = useState('');
  const [technicianId, setTechnicianId] = useState('');

  // Tab 2: Reject
  const [rejectReason, setRejectReason] = useState<RejectReason>('WaterDamage');
  const [rejectNotes, setRejectNotes] = useState('');
  const [evidencePhotoUrls, setEvidencePhotoUrls] = useState('');
  const [transferToPaidRepair, setTransferToPaidRepair] = useState(false);

  // Tab 3: Replace Device 1-1
  const [newImei, setNewImei] = useState('');
  const [replaceReason, setReplaceReason] = useState('Lỗi phần cứng nghiêm trọng không thể sửa chữa (BR-905)');

  // Tab 4: Send to Vendor
  const [vendorName, setVendorName] = useState('');
  const [vendorTicketNumber, setVendorTicketNumber] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [vendorNotes, setVendorNotes] = useState('');

  const isSandboxAction = ticket.id.startsWith('demo-') || (ticket.ticketCode || ticket.code || '').includes('DEMO');

  // 1. Submit In-House Repair
  const handleInHouseRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentDiagnosis.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập chẩn đoán linh kiện lỗi!' : 'Please enter component diagnosis!');
      return;
    }
    setLoading(true);
    try {
      const repTicketCode = await service.transferToInHouseRepair({
        warrantyTicketId: ticket.id,
        componentDiagnosis: componentDiagnosis.trim(),
        technicianId: technicianId.trim() || undefined,
        rowVersion: ticket.rowVersion,
      });

      if (isSandboxAction) {
        operationalNotificationService.dispatchNotification({
          title: '🛠️ [THỰC HÀNH SANDBOX] Đã chuyển sửa chữa nội bộ 0đ',
          content: `Phiếu ${ticket.code} (${ticket.productName}) đã được chuyển cho phòng kỹ thuật. Ca sửa liên kết: ${repTicketCode || 'REP-DEMO-01'}.`,
          type: 'REPAIR_ASSIGNED',
          targetRoles: ['Warranty', 'Technician', 'Manager'],
          isSandbox: true,
          link: '/warranties?mode=training',
        });
      }

      toast.success(language === 'vi' ? 'Đã tạo phiếu sửa chữa nội bộ với chi phí 0đ!' : 'Internal repair ticket created (Cost 0 VND)!', { icon: '🔧' });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (language === 'vi' ? 'Không thể chuyển sửa chữa nội bộ!' : 'Failed to transfer to in-house repair!'));
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Reject
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectNotes.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập lý do giải trình từ chối bảo hành!' : 'Please enter rejection explanation notes!');
      return;
    }
    setLoading(true);
    try {
      await service.rejectWarranty({
        warrantyTicketId: ticket.id,
        reason: rejectReason,
        rejectNotes: rejectNotes.trim(),
        evidencePhotoUrls: evidencePhotoUrls.trim() || undefined,
        transferToPaidRepair,
        rowVersion: ticket.rowVersion,
      });

      if (isSandboxAction) {
        operationalNotificationService.dispatchNotification({
          title: '⚠️ [THỰC HÀNH SANDBOX] Từ chối bảo hành thiết bị',
          content: `Phiếu ${ticket.code} không đủ điều kiện bảo hành (Lý do: ${rejectReason}). ${transferToPaidRepair ? 'Đã tạo phiếu sửa chữa dịch vụ có phí cho Sales tư vấn.' : 'Chờ khách đến nhận lại máy.'}`,
          type: 'GENERAL',
          targetRoles: ['Warranty', 'Sales', 'Manager'],
          isSandbox: true,
          link: '/warranties?mode=training',
        });
      }

      toast.success(
        language === 'vi' 
          ? (transferToPaidRepair ? 'Đã từ chối bảo hành & tự động tạo phiếu sửa chữa dịch vụ!' : 'Đã từ chối bảo hành thiết bị!') 
          : 'Warranty rejected successfully!', 
        { icon: '⚠️' }
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (language === 'vi' ? 'Không thể từ chối bảo hành!' : 'Failed to reject warranty!'));
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Replace Device 1-1
  const handleReplaceDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImei.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập số IMEI của thiết bị mới!' : 'Please enter replacement device IMEI!');
      return;
    }
    setLoading(true);
    try {
      await service.replaceWarrantyDevice({
        warrantyTicketId: ticket.id,
        newImei: newImei.trim(),
        reason: replaceReason.trim() || undefined,
        rowVersion: ticket.rowVersion,
      });

      if (isSandboxAction) {
        operationalNotificationService.dispatchNotification({
          title: '🔄 [THỰC HÀNH SANDBOX] Duyệt đổi máy mới 1-1 (BR-905)',
          content: `Phiếu ${ticket.code} đã hoàn tất thủ tục xuất đổi máy mới 1-1 (IMEI mới: ${newImei.trim()}) từ kho đổi bảo hành. Sẵn sàng bàn giao khách!`,
          type: 'GENERAL',
          targetRoles: ['Warranty', 'Inventory', 'Sales', 'Manager'],
          isSandbox: true,
          link: '/warranties?mode=training',
        });
      }

      toast.success(language === 'vi' ? 'Đã hoàn tất đổi máy mới 1-1 theo chuẩn BR-905!' : '1-1 Device replacement completed (BR-905)!', { icon: '✅' });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (language === 'vi' ? 'Không thể thực hiện đổi máy mới!' : 'Failed to replace device!'));
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit Send to Vendor
  const handleSendToVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim() || !vendorTicketNumber.trim() || !trackingNumber.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng điền đầy đủ Tên TTBH hãng, Mã phiếu hãng và Mã vận đơn!' : 'Please fill all vendor RMA details!');
      return;
    }
    setLoading(true);
    try {
      await service.sendWarrantyToVendor({
        warrantyTicketId: ticket.id,
        vendorName: vendorName.trim(),
        vendorTicketNumber: vendorTicketNumber.trim(),
        trackingNumber: trackingNumber.trim(),
        notes: vendorNotes.trim() || undefined,
        rowVersion: ticket.rowVersion,
      });

      if (isSandboxAction) {
        operationalNotificationService.dispatchNotification({
          title: '🚚 [THỰC HÀNH SANDBOX] Đã gửi máy đi bảo hành hãng (OEM RMA)',
          content: `Thiết bị ${ticket.productName} (Phiếu: ${ticket.code}) đã gửi đến ${vendorName.trim()}. Mã phiếu hãng: ${vendorTicketNumber.trim()}, Vận đơn: ${trackingNumber.trim()}.`,
          type: 'GENERAL',
          targetRoles: ['Warranty', 'Manager'],
          isSandbox: true,
          link: '/warranties?mode=training',
        });
      }

      toast.success(language === 'vi' ? 'Đã cập nhật chuyển máy sang trung tâm bảo hành hãng (OEM RMA)!' : 'Device sent to OEM Vendor RMA!', { icon: '🚚' });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (language === 'vi' ? 'Không thể chuyển bảo hành hãng!' : 'Failed to send to vendor!'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card rounded-3xl p-6 border border-border/60 shadow-2xl space-y-5 text-foreground animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div>
            <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-primary/10 text-primary">
                <Wrench className="w-5 h-5" />
              </span>
              {language === 'vi' ? 'Thẩm Định & Xử Lý Bảo Hành Thiết Bị' : 'Warranty Appraisal & Processing Engine'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <span>Mã phiếu: <strong className="font-mono text-primary">{ticket.code}</strong></span>
              <span>•</span>
              <span>IMEI: <strong className="font-mono text-foreground">{ticket.imei}</strong></span>
              <span>•</span>
              <span>{ticket.productName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border/40">
          <button
            type="button"
            onClick={() => setActiveTab('repair')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'repair'
                ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-500/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? '1. Sửa nội bộ' : '1. In-House'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reject')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'reject'
                ? 'bg-card text-rose-500 shadow-sm border border-rose-500/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? '2. Từ chối BH' : '2. Reject'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('replace')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'replace'
                ? 'bg-card text-blue-500 shadow-sm border border-blue-500/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? '3. Đổi máy 1-1' : '3. Replace'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vendor')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'vendor'
                ? 'bg-card text-purple-500 shadow-sm border border-purple-500/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? '4. Gửi hãng' : '4. OEM RMA'}</span>
          </button>
        </div>

        {/* TAB 1: In-House Repair */}
        {activeTab === 'repair' && (
          <form onSubmit={handleInHouseRepair} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-muted-foreground space-y-1">
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4" />
                {language === 'vi' ? 'Quy trình Sửa Chữa Bảo Hành Nội Bộ:' : 'In-House Repair Workflow:'}
              </p>
              <p className="text-[11px] leading-relaxed">
                {language === 'vi'
                  ? 'Hệ thống sẽ tự động tạo một Phiếu Sửa Chữa (RepairTicket) với Chi phí công sửa & định mức = 0đ (Bảo hành cửa hàng). Kỹ thuật viên sẽ nhận việc và điều phối linh kiện thay thế chính hãng.'
                  : 'An internal Repair Ticket with 0 VND cost will be created in the same transaction for technician parts replacement.'}
              </p>
            </div>

            <div>
              <label className="text-foreground font-semibold block mb-1.5">
                {language === 'vi' ? 'Chẩn đoán linh kiện lỗi & Phương án sửa chữa *' : 'Component Diagnosis & Proposed Solution *'}
              </label>
              <textarea
                value={componentDiagnosis}
                onChange={(e) => setComponentDiagnosis(e.target.value)}
                placeholder={language === 'vi' ? 'VD: Loa trong rè do màng loa rách, cần thay thế cụm loa trong bóc máy chính hãng...' : 'Enter technical diagnosis...'}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 min-h-[90px]"
                required
              />
            </div>

            <div>
              <label className="text-foreground font-semibold block mb-1.5">
                {language === 'vi' ? 'Phân công Kỹ thuật viên phụ trách (Tùy chọn)' : 'Assign Technician (Optional)'}
              </label>
              <Input
                type="text"
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                placeholder={language === 'vi' ? 'Nhập ID Kỹ thuật viên (hoặc để trống để phân công sau)' : 'Technician GUID or leave blank'}
                className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs text-foreground font-mono"
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-border/40">
              <Button variant="outline" type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl cursor-pointer">
                {tCommon.cancel}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-[2] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Wrench className="w-4 h-4" />
                {loading ? tCommon.loading : (language === 'vi' ? 'Xác Nhận Chuyển Sửa Nội Bộ (0đ)' : 'Confirm In-House Repair (0 VND)')}
              </Button>
            </div>
          </form>
        )}

        {/* TAB 2: Reject Warranty */}
        {activeTab === 'reject' && (
          <form onSubmit={handleReject} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-muted-foreground space-y-1">
              <p className="font-semibold text-rose-500 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4" />
                {language === 'vi' ? 'Quy định Từ Chối Bảo Hành:' : 'Rejection Policy:'}
              </p>
              <p className="text-[11px] leading-relaxed">
                {language === 'vi'
                  ? 'Thiết bị vi phạm chính sách của nhà sản xuất (vào nước, rơi nứt vỡ, can thiệp linh kiện bên ngoài hoặc hết hạn). Bạn có thể tư vấn khách chuyển sang sửa chữa dịch vụ có phí ngay tại đây.'
                  : 'Device violates warranty conditions. You may also recommend paid service repair for the customer.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-foreground font-semibold block mb-1.5">
                  {language === 'vi' ? 'Lý do từ chối chính *' : 'Rejection Reason *'}
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value as RejectReason)}
                  className="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                >
                  <option value="WaterDamage">{language === 'vi' ? 'Vào nước / Chỉ thị LCI đổi màu' : 'Water Damage / Red LCI'}</option>
                  <option value="Dropped">{language === 'vi' ? 'Rơi vỡ / Cấn móp / Biến dạng ngoại lực' : 'Dropped / Physical Damage'}</option>
                  <option value="ThirdPartyIntervention">{language === 'vi' ? 'Rách tem / Can thiệp ngoài trái phép' : 'Third-Party Intervention'}</option>
                  <option value="Expired">{language === 'vi' ? 'Hết hạn bảo hành 12 tháng' : 'Warranty Expired'}</option>
                  <option value="Other">{language === 'vi' ? 'Lý do kỹ thuật khác' : 'Other Reason'}</option>
                </select>
              </div>

              <div>
                <label className="text-foreground font-semibold block mb-1.5">
                  {language === 'vi' ? 'Link ảnh bằng chứng / Biên bản (Tùy chọn)' : 'Evidence Photo URL (Optional)'}
                </label>
                <Input
                  type="text"
                  value={evidencePhotoUrls}
                  onChange={(e) => setEvidencePhotoUrls(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-card border border-border rounded-xl px-4 py-2 text-xs text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="text-foreground font-semibold block mb-1.5">
                {language === 'vi' ? 'Giải trình chi tiết kết quả thẩm định *' : 'Detailed Technical Explanation *'}
              </label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder={language === 'vi' ? 'Mô tả vị trí tem vỡ, mức độ oxi hóa chân socket mainboard...' : 'Enter detailed technical findings...'}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 min-h-[80px]"
                required
              />
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-3">
              <input
                type="checkbox"
                id="transferPaid"
                checked={transferToPaidRepair}
                onChange={(e) => setTransferToPaidRepair(e.target.checked)}
                className="w-4 h-4 rounded text-primary border-border focus:ring-primary cursor-pointer"
              />
              <label htmlFor="transferPaid" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                {language === 'vi' ? 'Tư vấn chuyển sang sửa chữa dịch vụ có phí (Tự động tạo phiếu sửa chữa)' : 'Convert to Paid Repair Service (Auto-creates Repair Ticket)'}
              </label>
            </div>

            <div className="flex gap-3 pt-3 border-t border-border/40">
              <Button variant="outline" type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl cursor-pointer">
                {tCommon.cancel}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-[2] py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <ShieldAlert className="w-4 h-4" />
                {loading ? tCommon.loading : (language === 'vi' ? 'Xác Nhận Từ Chối Bảo Hành' : 'Confirm Rejection')}
              </Button>
            </div>
          </form>
        )}

        {/* TAB 3: Replace Device 1-1 */}
        {activeTab === 'replace' && (
          <form onSubmit={handleReplaceDevice} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-muted-foreground space-y-1">
              <p className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 text-xs">
                <Smartphone className="w-4 h-4" />
                {language === 'vi' ? 'Tiêu chuẩn Đổi Máy Mới 1-1 (Quy chuẩn BR-905):' : '1-1 Device Exchange Rule (BR-905):'}
              </p>
              <p className="text-[11px] leading-relaxed">
                {language === 'vi'
                  ? 'Thiết bị lỗi bo mạch/chết nguồn trong thời hạn quy định sẽ được cấp đổi ngay 1 máy mới từ kho. IMEI cũ chuyển Disposed (thu hồi), IMEI mới chuyển Sold (đã bán ra cho khách) và hoàn tất quy trình bảo hành.'
                  : 'Old IMEI becomes Disposed, New IMEI in stock becomes Sold, and warranty cycle completes.'}
              </p>
            </div>

            <div>
              <label className="text-foreground font-semibold block mb-1.5">
                {language === 'vi' ? 'Số IMEI thiết bị mới lấy từ Kho * (15 chữ số)' : 'New Replacement IMEI in Stock * (15 digits)'}
              </label>
              <Input
                type="text"
                value={newImei}
                onChange={(e) => setNewImei(e.target.value)}
                placeholder="VD: 860123469903945"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-mono font-bold text-blue-600 dark:text-blue-400 placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>

            <div>
              <label className="text-foreground font-semibold block mb-1.5">
                {language === 'vi' ? 'Lý do đổi máy mới' : 'Replacement Reason'}
              </label>
              <Input
                type="text"
                value={replaceReason}
                onChange={(e) => setReplaceReason(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs text-foreground"
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-border/40">
              <Button variant="outline" type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl cursor-pointer">
                {tCommon.cancel}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-[2] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                {loading ? tCommon.loading : (language === 'vi' ? 'Xác Nhận Đổi Máy Mới (BR-905)' : 'Confirm Exchange (BR-905)')}
              </Button>
            </div>
          </form>
        )}

        {/* TAB 4: Send to Vendor OEM RMA */}
        {activeTab === 'vendor' && (
          <form onSubmit={handleSendToVendor} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-muted-foreground space-y-1">
              <p className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 text-xs">
                <Truck className="w-4 h-4" />
                {language === 'vi' ? 'Quy trình Gửi Hãng Ủy Quyền (OEM RMA):' : 'OEM Vendor RMA Dispatch:'}
              </p>
              <p className="text-[11px] leading-relaxed">
                {language === 'vi'
                  ? 'Sử dụng khi máy cần gửi lên Trung tâm bảo hành chính hãng (Apple AASP, Samsung Care, Xiaomi...). Trạng thái phiếu sẽ chuyển sang Đang xử lý (Processing) và ghi nhận vận đơn theo dõi.'
                  : 'Device dispatched to authorized service center. Status stays in Processing with tracking.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-foreground font-semibold block mb-1.5">
                  {language === 'vi' ? 'Tên Trung tâm BH Hãng / NCC *' : 'Vendor Service Center *'}
                </label>
                <Input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="VD: Apple Care Thakral One / Samsung Service"
                  className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs text-foreground"
                  required
                />
              </div>

              <div>
                <label className="text-foreground font-semibold block mb-1.5">
                  {language === 'vi' ? 'Mã phiếu tiếp nhận của Hãng *' : 'Vendor Ticket / RMA # *'}
                </label>
                <Input
                  type="text"
                  value={vendorTicketNumber}
                  onChange={(e) => setVendorTicketNumber(e.target.value)}
                  placeholder="VD: RMA-APL-2026-9901"
                  className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-foreground"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-foreground font-semibold block mb-1.5">
                {language === 'vi' ? 'Mã vận đơn chuyển phát (Tracking #) *' : 'Courier Tracking # *'}
              </label>
              <Input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="VD: VNPOST-88223344 hoặc VIETTELPOST-9911"
                className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-purple-600 dark:text-purple-400"
                required
              />
            </div>

            <div>
              <label className="text-foreground font-semibold block mb-1.5">
                {language === 'vi' ? 'Ghi chú gửi hàng' : 'Shipping Notes'}
              </label>
              <textarea
                value={vendorNotes}
                onChange={(e) => setVendorNotes(e.target.value)}
                placeholder={language === 'vi' ? 'Ghi chú kèm hộp phụ kiện, tình trạng niêm phong thùng gửi...' : 'Optional notes...'}
                className="w-full bg-card border border-border rounded-xl px-4 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 min-h-[60px]"
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-border/40">
              <Button variant="outline" type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl cursor-pointer">
                {tCommon.cancel}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-[2] py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Truck className="w-4 h-4" />
                {loading ? tCommon.loading : (language === 'vi' ? 'Xác Nhận Gửi Sang Hãng (OEM RMA)' : 'Confirm Vendor Dispatch')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
