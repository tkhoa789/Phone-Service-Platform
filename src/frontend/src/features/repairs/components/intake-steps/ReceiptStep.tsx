import React, { useRef } from 'react';
import type { IntakeState } from '../../types/intake.types';
import { useThemeStore } from '@/stores/themeStore';
import { useBranchStore } from '@/stores/branchStore';
import { useRepairDetails } from '../../api/useRepairs';
import { CheckCircle2, Printer, ArrowRight, Loader2, RefreshCw, PlusCircle, Wrench, Shield, Smartphone, Phone, User, Calendar, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

interface Props {
  state: IntakeState;
  onReset?: () => void;
}

export const ReceiptStep: React.FC<Props> = ({ state, onReset }) => {
  const { language } = useThemeStore();
  const { activeBranchName } = useBranchStore();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const { data: ticket, isLoading: loading, isError, refetch } = useRepairDetails(state.ticketId);

  if (!state.ticketId) {
    return (
      <div className="p-8 text-center text-rose-500 space-y-4">
        <p className="font-semibold">
          {language === 'vi' ? 'Không tìm thấy mã phiếu tiếp nhận.' : 'No intake ticket ID found.'}
        </p>
        <Button variant="outline" onClick={() => navigate('/repairs')}>
          {language === 'vi' ? 'Về Danh Sách Sửa Chữa' : 'Back to Repair List'}
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-muted-foreground space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm">
          {language === 'vi' ? 'Đang đồng bộ thông tin phiếu từ máy chủ...' : 'Syncing ticket from server...'}
        </p>
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="p-8 text-center text-rose-500 space-y-4">
        <p className="font-semibold">
          {language === 'vi' ? 'Không thể tải chi tiết phiếu từ máy chủ' : 'Could not load ticket from server'}
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            {language === 'vi' ? 'Thử lại' : 'Retry'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/repairs')}>
            {language === 'vi' ? 'Về Danh Sách' : 'Back to List'}
          </Button>
        </div>
      </div>
    );
  }

  const deposit = ticket.deposits && ticket.deposits.length > 0 ? ticket.deposits[ticket.deposits.length - 1] : null;
  const ticketCode = ticket.code || ticket.ticketCode || state.ticketId.substring(0, 8).toUpperCase();
  const deviceDisplayName = ticket.productName || state.customModel || state.deviceModel || 'Thiết bị tiếp nhận';

  const handlePrintK80 = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Phiếu Tiếp Nhận - ${ticketCode}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            width: 76mm;
            margin: 2mm auto;
            padding: 2mm;
            font-size: 11px;
            color: #000;
            line-height: 1.35;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .title { font-size: 14px; margin: 4px 0; font-weight: bold; }
          .dashed { border-bottom: 1px dashed #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .col-left { width: 35%; color: #333; }
          .col-right { width: 65%; text-align: right; word-break: break-word; }
          .qr-placeholder { font-family: monospace; font-size: 14px; letter-spacing: 2px; }
          .footer { font-size: 9px; margin-top: 8px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="bold" style="font-size: 12px;">HỆ THỐNG SỬA CHỮA ĐIỆN THOẠI</div>
          <div style="font-size: 10px;">${activeBranchName || 'Chi nhánh tiếp nhận'}</div>
          <div class="dashed"></div>
          <div class="title">PHIẾU TIẾP NHẬN SỬA CHỮA</div>
          <div class="qr-placeholder bold">*${ticketCode}*</div>
        </div>

        <div class="dashed"></div>

        <div class="row"><span class="col-left">Mã phiếu:</span><span class="col-right bold">${ticketCode}</span></div>
        <div class="row"><span class="col-left">Ngày nhận:</span><span class="col-right">${new Date(ticket.receivedDate).toLocaleString('vi-VN')}</span></div>
        <div class="row"><span class="col-left">Khách hàng:</span><span class="col-right bold">${ticket.customerName}</span></div>
        <div class="row"><span class="col-left">Điện thoại:</span><span class="col-right">${ticket.customerPhone}</span></div>
        <div class="row"><span class="col-left">Thiết bị:</span><span class="col-right bold">${deviceDisplayName}</span></div>
        <div class="row"><span class="col-left">IMEI/Serial:</span><span class="col-right font-mono">${ticket.imei || state.imei || 'N/A'}</span></div>
        <div class="row"><span class="col-left">Kỹ thuật viên:</span><span class="col-right bold">${ticket.technicianName || state.technicianName || 'Kỹ thuật viên tại xưởng'}</span></div>

        <div class="dashed"></div>

        <div style="margin: 4px 0;">
          <div class="bold">Tình trạng / Hiện tượng lỗi:</div>
          <div style="padding-left: 4px; font-size: 10.5px;">${ticket.problemDescription || 'Kiểm tra tổng quát'}</div>
        </div>

        <div class="dashed"></div>

        <div class="row"><span class="col-left">Chi phí dự kiến:</span><span class="col-right bold">${ticket.estimatedCost ? ticket.estimatedCost.toLocaleString('vi-VN') + ' đ' : 'Báo giá sau'}</span></div>
        ${deposit ? `
          <div class="row"><span class="col-left">Tiền cọc:</span><span class="col-right bold">${deposit.amount.toLocaleString('vi-VN')} đ</span></div>
          <div class="row"><span class="col-left">Hình thức cọc:</span><span class="col-right">${deposit.paymentMethodName || 'Tiền mặt'}</span></div>
          <div class="row"><span class="col-left">Còn lại tạm tính:</span><span class="col-right bold">${Math.max(0, (ticket.estimatedCost || 0) - deposit.amount).toLocaleString('vi-VN')} đ</span></div>
        ` : `
          <div class="row"><span class="col-left">Tiền cọc:</span><span class="col-right">Chưa thu cọc</span></div>
        `}

        <div class="dashed"></div>

        <div class="footer">
          <p class="bold">LƯU Ý KHÁCH HÀNG:</p>
          <p>- Vui lòng giữ phiếu này để đối chiếu khi nhận lại máy.</p>
          <p>- Trung tâm không chịu trách nhiệm về dữ liệu cá nhân trong máy.</p>
          <p>- Cảm ơn Quý khách đã tin tưởng dịch vụ!</p>
        </div>
      </body>
      </html>
    `;

    if (!iframeRef.current) {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      iframeRef.current = iframe;
    }

    const doc = iframeRef.current.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printContent);
      doc.close();
      setTimeout(() => {
        iframeRef.current?.contentWindow?.focus();
        iframeRef.current?.contentWindow?.print();
      }, 300);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Success Badge Banner */}
      <div className="flex flex-col items-center text-center space-y-3 py-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-500/20">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div>
          <h2 className="text-2xl font-heading font-black text-foreground">
            {language === 'vi' ? 'Tiếp Nhận Sửa Chữa Thành Công!' : 'Intake Ticket Created Successfully!'}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {language === 'vi'
              ? 'Hồ sơ máy đã được đưa vào luồng kỹ thuật và sẵn sàng phân bổ kỹ thuật viên xử lý'
              : 'Device has been queued in the repair workflow and ready for technician assignment'}
          </p>
        </div>
      </div>

      {/* Ticket Details Summary Card */}
      <div className="p-6 rounded-3xl bg-card border border-border/40 neu-raised space-y-5">
        {/* Ticket Barcode / Code Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              {language === 'vi' ? 'Mã Phiếu Tiếp Nhận' : 'Intake Ticket Code'}
            </p>
            <p className="font-mono font-black text-2xl text-emerald-600 dark:text-emerald-400 mt-0.5">
              {ticketCode}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              {language === 'vi' ? 'Thời Gian Tiếp Nhận' : 'Received Time'}
            </p>
            <p className="text-xs font-semibold text-foreground mt-0.5">
              {new Date(ticket.receivedDate).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Customer & Device Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-border/40">
          <div className="p-4 rounded-2xl bg-background/50 border border-border/30 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              {language === 'vi' ? 'Khách Hàng' : 'Customer'}
            </div>
            <p className="font-bold text-sm text-foreground">{ticket.customerName}</p>
            <p className="text-xs text-muted-foreground font-mono flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {ticket.customerPhone}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-background/50 border border-border/30 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
              {language === 'vi' ? 'Thiết Bị & Kỹ Thuật' : 'Device & Technician'}
            </div>
            <p className="font-bold text-sm text-foreground">{deviceDisplayName}</p>
            <p className="text-xs text-muted-foreground font-mono">
              IMEI: {ticket.imei || state.imei || 'Không có'}
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium pt-1 border-t border-border/30">
              {language === 'vi' ? 'Kỹ thuật viên: ' : 'Technician: '}
              <span className="font-bold">{ticket.technicianName || state.technicianName || (language === 'vi' ? 'Chưa phân công' : 'Unassigned')}</span>
            </p>
          </div>
        </div>

        {/* Problem Description */}
        <div className="p-4 rounded-2xl bg-background/50 border border-border/30 space-y-1">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {language === 'vi' ? 'Hiện tượng lỗi & Tình trạng bàn giao:' : 'Fault Description & Initial Condition:'}
          </p>
          <p className="text-xs text-foreground leading-relaxed">
            {ticket.problemDescription || 'Tiếp nhận kiểm tra máy'}
          </p>
        </div>

        {/* Cost & Deposit Summary */}
        <div className="p-4 rounded-2xl bg-background/60 border border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-muted-foreground">
              {language === 'vi' ? 'Chi phí dự kiến: ' : 'Estimated Cost: '}
            </span>
            <span className="font-bold text-sm text-foreground">
              {ticket.estimatedCost && ticket.estimatedCost > 0
                ? `${ticket.estimatedCost.toLocaleString('vi-VN')} ₫`
                : (language === 'vi' ? 'Báo giá sau chẩn đoán' : 'Quote later')}
            </span>
          </div>

          <div>
            {deposit ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                  {language === 'vi' ? 'Đã thu cọc: ' : 'Deposit Paid: '}
                  {deposit.amount.toLocaleString('vi-VN')} ₫
                </span>
                <span className="text-muted-foreground font-medium">({deposit.paymentMethodName})</span>
              </div>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium border border-border/40">
                {language === 'vi' ? 'Không thu cọc (Thanh toán khi nhận máy)' : 'No deposit (Pay on pickup)'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          onClick={handlePrintK80}
          className="neu-raised hover:neu-pressed text-foreground text-xs font-semibold py-3 px-5 rounded-2xl flex items-center gap-2 w-full sm:w-auto"
        >
          <Printer className="w-4 h-4 text-emerald-500" />
          {language === 'vi' ? 'In Phiếu K80 Cho Khách' : 'Print K80 Thermal Receipt'}
        </Button>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {onReset && (
            <Button
              variant="outline"
              onClick={onReset}
              className="neu-raised hover:neu-pressed text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-xs font-semibold py-3 px-4 rounded-2xl flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              {language === 'vi' ? 'Tiếp Nhận Ca Mới' : 'New Intake'}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => navigate('/repairs')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-3 px-5 rounded-2xl shadow-md flex items-center gap-2"
          >
            {language === 'vi' ? 'Về Danh Sách Sửa Chữa' : 'Back to Repair List'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
